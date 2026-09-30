const mongoose = require("mongoose");

const saleModel = require("./sales.model");
const productModel = require("../product/product.model");
const inventoryModel = require("../inventory/inventory.model");
const transactionModel = require("../inventory/transaction.model");

const createSaleService = async ({
    organizationId,
    customerId,
    items,
    userId
}) => {

    const session = await mongoose.startSession();

    try {

        let createdSale;

        await session.withTransaction(async () => {

            let totalAmount = 0;
            const saleItems = [];

            for (const item of items) {

                const { productId, quantity } = item;

                // 1. Check product belongs to organization
                const product = await productModel.findOne({
                    _id: productId,
                    organizationId
                }).session(session);

                if (!product) {
                    throw new Error(
                        `Product ${productId} not found in this organization`
                    );
                }

                // 2. Get inventory
                const inventory = await inventoryModel.findOne({
                    organizationId,
                    productId
                }).session(session);

                if (!inventory) {
                    throw new Error(
                        `Inventory not found for product ${productId}`
                    );
                }

                const updatedInventory = await inventoryModel.findOneAndUpdate(
                    {
                        organizationId,
                        productId,
                        quantity: { $gte: quantity }
                    },
                    {
                        $inc: {
                            quantity: -quantity
                        },
                        $set: {
                            updatedBy: userId
                        }
                    },
                    {
                        new: true,
                        session
                    }
                );

                if (!updatedInventory) {
                    throw new Error(
                        `Insufficient stock for product ${product.name}`
                    );
                }

                await transactionModel.create(
                    [{
                        organizationId,
                        productId,
                        type: "OUT",
                        quantity,
                        previousQuantity: inventory.quantity,
                        newQuantity: updatedInventory.quantity,
                        createdBy: userId
                    }],
                    { session }
                );
            }

            // 3. Create sale
            const [sale] = await saleModel.create(
                [{
                    organizationId,
                    customerId,
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

module.exports = {
    createSaleService
};