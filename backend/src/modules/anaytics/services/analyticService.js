
const mongoose = require("mongoose");

const analyticsModel = require("../models/analytics.model");
const saleModel = require("../../sales/models/sale.model");
const { redisClient } = require("../../../config/redis.config");

const CACHE_TTL = 300;

// -------------------- HELPERS --------------------

const getOrganizationId = (id) => {
    
  if (!mongoose.isObjectIdOrHexString(id)) {
    throw new Error("Invalid organizationId");
  }

  return new mongoose.Types.ObjectId(id);
};

const getUTCDate = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }

  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const getDateFilter = (startDate, endDate) => {
  if (!startDate && !endDate) return {};

  const date = {};

  if (startDate) {
    date.$gte = getUTCDate(startDate);
  }

  if (endDate) {
    const nextDay = getUTCDate(endDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    date.$lt = nextDay;
  }

  if (
    startDate &&
    endDate &&
    date.$gte >= date.$lt
  ) {
    throw new Error("Invalid date range");
  }

  return { date };
};

const normalizePagination = (page, limit) => {
  const p = Number(page ?? 1);
  const l = Number(limit ?? 10);

  if (
    !Number.isInteger(p) ||
    !Number.isInteger(l) ||
    p < 1 ||
    l < 1
  ) {
    throw new Error("Invalid pagination");
  }

  return {
    page: p,
    limit: Math.min(l, 100)
  };
};

// Cache version per organization
const getCacheVersion = async (organizationId) => {
  const version = await redisClient.get(
    `analytics:version:${organizationId}`
  );

  return version || "0";
};

// Call ONLY after successful transaction commit
const invalidateAnalyticsCache = async (organizationId) => {
  await redisClient.incr(
    `analytics:version:${organizationId}`
  );
};

// -------------------- 1. DASHBOARD LIST --------------------

/**
 * Get paginated analytics documents.
 * Reads Analytics collection, not Sales.
 */
const getDashboardAnalytics = async ({
  organizationId,
  startDate,
  endDate,
  page = 1,
  limit = 10
}) => {
  const orgId = getOrganizationId(organizationId);
  const pagination = normalizePagination(page, limit);

  const filter = {
    organizationId: orgId,
    ...getDateFilter(startDate, endDate)
  };

  const version = await getCacheVersion(orgId);

  const cacheKey = [
    "analytics",
    "list",
    orgId,
    version,
    startDate || "all",
    endDate || "all",
    pagination.page,
    pagination.limit
  ].join(":");

  const cached = await redisClient.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const skip = (pagination.page - 1) * pagination.limit;

  const [analytics, total] = await Promise.all([
    analyticsModel
      .find(filter)
      .select("-processedSales")
      .sort({ date: -1, _id: -1 })
      .skip(skip)
      .limit(pagination.limit)
      .lean(),

    analyticsModel.countDocuments(filter)
  ]);

  const result = {
    analytics,
    pagination: {
      total,
      page: pagination.page,
      limit: pagination.limit,
      pages: Math.ceil(total / pagination.limit)
    }
  };

  await redisClient.set(
    cacheKey,
    JSON.stringify(result),
    { EX: CACHE_TTL }
  );

  return result;
};

// -------------------- 2. DASHBOARD SUMMARY --------------------

/**
 * Get overall sales and revenue.
 * No pagination.
 */
const getDashboardSummary = async ({
  organizationId,
  startDate,
  endDate
}) => {
  const orgId = getOrganizationId(organizationId);

  const filter = {
    organizationId: orgId,
    ...getDateFilter(startDate, endDate)
  };

  const version = await getCacheVersion(orgId);

  const cacheKey = [
    "analytics",
    "summary",
    orgId,
    version,
    startDate || "all",
    endDate || "all"
  ].join(":");

  const cached = await redisClient.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const [summary] = await analyticsModel.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalSales: { $sum: "$totalSales" },
        totalRevenue: { $sum: "$totalRevenue" },
        totalOrders: { $sum: "$totalOrders" }
      }
    },
    {
      $project: {
        _id: 0,
        totalSales: 1,
        totalRevenue: 1,
        totalOrders: 1
      }
    }
  ]);

  const result = summary || {
    totalSales: 0,
    totalRevenue: 0,
    totalOrders: 0
  };

  await redisClient.set(
    cacheKey,
    JSON.stringify(result),
    { EX: CACHE_TTL }
  );

  return result;
};

// -------------------- 3. UPDATE SALES ANALYTICS --------------------

/**
 * Process one completed sale.
 * Must be called with an ACTIVE Mongoose transaction.
 */
const updateSalesAnalytics = async ({
  organizationId,
  saleId,
  session
}) => {
  if (!session?.inTransaction()) {
    throw new Error("Active MongoDB session required");
  }

  const orgId = getOrganizationId(organizationId);

  if (!mongoose.isObjectIdOrHexString(saleId)) {
    throw new Error("Invalid saleId");
  }

  // Read only the relevant completed sale
  const sale = await saleModel.findOne({
    _id: saleId,
    organizationId: orgId,
    status: "completed"
  })
    .session(session)
    .lean();

  if (!sale) {
    throw new Error("Completed sale not found");
  }

  const amount = Number(sale.totalAmount);

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Invalid sale amount");
  }

  const date = getUTCDate(
    sale.completedAt || sale.createdAt
  );

  const filter = {
    organizationId: orgId,
    date
  };

  // Create daily document if it does not exist.
  await analyticsModel.updateOne(
    filter,
    {
      $setOnInsert: {
        totalSales: 0,
        totalRevenue: 0,
        totalOrders: 0,
        processedSales: [],
        topProducts: []
      }
    },
    {
      upsert: true,
      session
    }
  );

  // Update only if this sale has not been processed.
  const result = await analyticsModel.updateOne(
    {
      ...filter,
      processedSales: { $ne: sale._id }
    },
    {
      $inc: {
        totalSales: 1,
        totalRevenue: amount,
        totalOrders: 1
      },
      $addToSet: {
        processedSales: sale._id
      }
    },
    { session }
  );

  return {
    processed: result.modifiedCount === 1,
    saleId: sale._id,
    organizationId: orgId,
    date
  };
};

module.exports = {
  getDashboardAnalytics,
  getDashboardSummary,
  updateSalesAnalytics,
  invalidateAnalyticsCache
};
