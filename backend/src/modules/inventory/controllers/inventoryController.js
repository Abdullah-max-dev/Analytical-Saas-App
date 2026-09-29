const inventoryService = require("../services/inventoryService");


// GET /api/inventory
const getAllInventoryController = async (req, res, next) => {
  try {
    const result = await inventoryService.getAllInventory({
     organizationId: req.organizationId,
      userId: req.user.id
    });

    return res.status(200).json({
      success: true,
      message: "Inventory fetched successfully",
      data: result
    });

  } catch (error) {
    next(error);
  }
};


// GET /api/inventory/:productId
const getInventoryController = async (req, res, next) => {
  try {
    const result = await inventoryService.getInventory({
      organizationId: req.organizationId,
      userId: req.user.id,
      productId: req.params.productId
    });
    console.log("Inventory Result:", result);

    return res.status(200).json({
      success: true,
      message: "Inventory fetched successfully",
      data: result
    });

  } catch (error) {
    next(error);
  }
};


// PATCH /api/inventory
const updateInventoryController = async (req, res, next) => {
  try {
    const { quantity, lowStockLimit, note } = req.body;

    const result = await inventoryService.updateInventory({
      organizationId: req.user.organizations[0].organizationId,
      userId: req.user.id,
      productId: req.params.productId,
      quantity,
      lowStockLimit,
      note
    });

    return res.status(200).json({
      success: true,
      message: "Inventory updated successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  getAllInventoryController,
  getInventoryController,
  updateInventoryController
};