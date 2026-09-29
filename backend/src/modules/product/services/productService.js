const productModel = require("../models/product.model");
const userModel = require("../../users/models/user.model");


// CREATE PRODUCT
const createProduct = async ({
    organizationId,
    userId,
    name,
    sku,
    price,
    costPrice
}) => {

    // Check user belongs to organization
    const user = await userModel.findOne({
        _id: userId,
        "organizations.organizationId": organizationId
    });

    if (!user) {
        throw new Error("You are not a member of this organization");
    }


    // Check duplicate SKU inside organization
    const existingProduct = await productModel.findOne({
        organizationId,
        sku
    });

    if (existingProduct) {
        throw new Error("Product with this SKU already exists");
    }


    const product = await productModel.create({
        organizationId,
        name,
        sku,
        price,
        costPrice,
        createdBy: userId
    });

    return product;
};


// GET ALL PRODUCTS
const getProducts = async ({
    organizationId,
    userId
}) => {

    // Check user belongs to organization
    const user = await userModel.findOne({
        _id: userId,
        "organizations.organizationId": organizationId
    });

    if (!user) {
        throw new Error("You are not a member of this organization");
    }


    const products = await productModel
        .find({ organizationId })
        .sort({ createdAt: -1 });

    return products;
};


// GET SINGLE PRODUCT
const getProduct = async ({
    organizationId,
    userId,
    productId
}) => {

    // Check user belongs to organization
    const user = await userModel.findOne({
        _id: userId,
        "organizations.organizationId": organizationId
    });

    if (!user) {
        throw new Error("You are not a member of this organization");
    }


    const product = await productModel.findOne({
        _id: productId,
        organizationId
    });

    if (!product) {
        throw new Error("Product not found");
    }

    return product;
};


// UPDATE PRODUCT
const updateProduct = async ({
    organizationId,
    userId,
    productId,
    name,
    sku,
    price,
    costPrice
}) => {

    // Check user belongs to organization
    const user = await userModel.findOne({
        _id: userId,
        "organizations.organizationId": organizationId
    });

    if (!user) {
        throw new Error("You are not a member of this organization");
    }


    // Find product
    const product = await productModel.findOne({
        _id: productId,
        organizationId
    });

    if (!product) {
        throw new Error("Product not found");
    }


    // Check if new SKU already belongs to another product
    if (sku !== product.sku) {

        const existingProduct = await productModel.findOne({
            organizationId,
            sku,
            _id: { $ne: productId }
        });

        if (existingProduct) {
            throw new Error("Product with this SKU already exists");
        }
    }


    product.name = name;
    product.sku = sku;
    product.price = price;
    product.costPrice = costPrice;


    await product.save();

    return product;
};


// DELETE PRODUCT
const deleteProduct = async ({
    organizationId,
    userId,
    productId
}) => {

    // Check user belongs to organization
    const user = await userModel.findOne({
        _id: userId,
        "organizations.organizationId": organizationId
    });

    if (!user) {
        throw new Error("You are not a member of this organization");
    }


    const product = await productModel.findOne({
        _id: productId,
        organizationId
    });

    if (!product) {
        throw new Error("Product not found");
    }


    await productModel.findByIdAndDelete(product._id);

    return product;
};


module.exports = {
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct
};