const Joi = require("joi");

const {
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct
} = require("../services/productService");

const { createProductValidation } = require("../validations/productValidation");



// CREATE PRODUCT
const createProductController = async (req, res, next) => {
    try {

        const { error, value } = createProductValidation(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const product = await createProduct({
            organizationId: value.organizationId,
            userId: req.user.id,
            name: value.name,
            sku: value.sku,
            price: value.price,
            costPrice: value.costPrice
        });

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            product
        });

    } catch (error) {
        next(error);
    }
};


// GET ALL PRODUCTS
const getProductsController = async (req, res, next) => {

    try {

        const products = await getProducts({
            organizationId: req.params.organizationId,
            userId: req.user.id
        });


        res.status(200).json({
            success: true,
            products
        });

    } catch (error) {
        next(error);
    }
};


// GET SINGLE PRODUCT
const getProductController = async (req, res, next) => {

    try {

        const product = await getProduct({
            organizationId: req.params.organizationId,
            userId: req.user.id,
            productId: req.params.productId
        });


        res.status(200).json({
            success: true,
            product
        });

    } catch (error) {
        next(error);
    }
};


// UPDATE PRODUCT
const updateProductController = async (req, res, next) => {

    try {

        const { error, value } = createProductValidation(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }


        const product = await updateProduct({
            organizationId: req.params.organizationId,
            userId: req.user.id,
            productId: req.params.productId,
            name: value.name,
            sku: value.sku,
            price: value.price,
            costPrice: value.costPrice
        });


        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product
        });

    } catch (error) {
        next(error);
    }
};


// DELETE PRODUCT
const deleteProductController = async (req, res, next) => {

    try {

        const product = await deleteProduct({
            organizationId: req.params.organizationId,
            userId: req.user.id,
            productId: req.params.productId
        });


        res.status(200).json({
            success: true,
            message: "Product deleted successfully",
            product
        });

    } catch (error) {
        next(error);
    }
};


module.exports = {
    createProductController,
    getProductsController,
    getProductController,
    updateProductController,
    deleteProductController
};