const saleService = require("../services/saleService");

const createSaleController = async (req, res, next) => {
    try {
        const sale = await saleService.createSale({
            organizationId: req.organizationId,
            userId: req.user._id,
            customerId: req.body.customerId,
            items: req.body.items
        });

        return res.status(201).json({
            success: true,
            message: "Sale created successfully",
            data: sale
        });
    } catch (error) {
        next(error);
    }
};

const getSalesController = async (req, res, next) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);

        const result = await saleService.getSales({
            organizationId: req.organizationId,
            page,
            limit
        });

        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const getSaleController = async (req, res, next) => {
    try {
        const sale = await saleService.getSale({
            organizationId: req.organizationId,
            saleId: req.params.saleId
        });

        return res.status(200).json({ success: true, data: sale });
    } catch (error) {
        next(error);
    }
};

module.exports = { createSaleController, getSalesController, getSaleController };