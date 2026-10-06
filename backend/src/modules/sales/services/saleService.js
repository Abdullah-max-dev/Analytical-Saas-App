const mongoose = require("mongoose");

const saleModel = require("../models/sales.model");
const productModel = require("../../product/models/product.model");
const inventoryModel = require("../../inventory/models/inventory.model");
const inventoryTransactionModel = require("../../inventory/models/inventoryTransaction.model");

const AppError = (message, statusCode) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

// CREATE SALE
const createSale = async ({ organizationId, userId, customerId, items }) => {
    const session = await mongoose.startSession();

    try {
        let createdSale;

        await session.withTransaction(async () => {
            const saleId = new mongoose.Types.ObjectId();
            const saleItems = [];
            let totalAmount = 0;

            for (const { productId, quantity } of items) {
                // console.log("Product ID:", productId);
                // console.log("Organization ID:", organizationId);

                // 1. Product isi org ka hona chahiye
                const product = await productModel
                    .findOne({ _id: productId, organizationId })
                    .session(session);

                if (!product) {
                    throw AppError(`Product ${productId}, ${organizationId} not found`, 404);
                }

                // 2. Atomic stock deduction (race condition safe)
                const inventory = await inventoryModel.findOneAndUpdate(
                    { organizationId, productId, quantity: { $gte: quantity } },
                    { $inc: { quantity: -quantity }, $set: { updatedBy: userId } },
                    { new: true, session }
                );

                if (!inventory) {
                    throw AppError(`Insufficient stock for ${product.name}`, 400);
                }

                // 3. Stock ledger entry
                await inventoryTransactionModel.create(
                    [{
                        organizationId,
                        productId,
                        type: "OUT",
                        event: "SALE",
                        quantity,
                        previousQuantity: inventory.quantity + quantity,
                        newQuantity: inventory.quantity,
                        referenceId: saleId,
                        referenceModel: "Sale",
                        createdBy: userId
                    }],
                    { session }
                );

                // 4. Price snapshot DB se
                const total = product.price * quantity;
                totalAmount += total;

                saleItems.push({ productId, quantity, price: product.price, total });
            }

            // 5. Sale create
            const [sale] = await saleModel.create(
                [{
                    _id: saleId,
                    organizationId,
                    items: saleItems,
                    totalAmount,
                    createdBy: userId
                }],
                { session }
            );

            createdSale = sale;
        });

        return createdSale;

    } finally {
        await session.endSession();
    }
};

// GET ALL SALES (dashboard)
const getSales = async ({ organizationId, page = 1, limit = 20 }) => {
    const skip = (page - 1) * limit;

    const [sales, total] = await Promise.all([
        saleModel
            .find({ organizationId })
            .populate("items.productId", "name sku")
            .populate("createdBy", "name username")
            .sort({ saleDate: -1 })
            .skip(skip)
            .limit(limit),
        saleModel.countDocuments({ organizationId })
    ]);

    return {
        sales,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
};

// GET SINGLE SALE
const getSale = async ({ organizationId, saleId }) => {
    const sale = await saleModel
        .findOne({ _id: saleId, organizationId })
        .populate("items.productId", "name sku")
        .populate("createdBy", "name username");

    if (!sale) throw AppError("Sale not found", 404);

    return sale;
};

module.exports = { createSale, getSales, getSale };