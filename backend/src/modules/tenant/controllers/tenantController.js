const {
    createTenant,
    switchOrganization,
    updateTenant,
    deleteTenant
} = require("../services/tenantService");
const { createTenantValidation } = require("../validations/tenantValidation");

const createTenantController = async (req, res, next) => {
    try {
        const { error, value } = createTenantValidation.validate(req.body);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        const tenant = await createTenant({
            name: value.name,
            userId: req.user.id
        });

        res.status(201).json({
            success: true,
            message: "Tenant created successfully",
            tenant
        });

    } catch (error) {
        next(error);
    }
};



const switchOrganizationController = async (req, res, next) => {
    try {
        const organization = await switchOrganization({
            userId: req.user.id,
            organizationId: req.body.organizationId
        });

        res.status(200).json({
            success: true,
            message: "Organization switched successfully",
            organization
        });

    } catch (error) {
        next(error);
    }
};




const updateTenantController = async (req, res, next) => {
    try {
        const tenant = await updateTenant({
            slug: req.params.slug,
            userId: req.user.id,
            name: req.body.name
        });

        res.status(200).json({
            success: true,
            message: "Tenant updated successfully",
            tenant
        });

    } catch (error) {
        next(error);
    }
};

const deleteTenantController = async (req, res, next) => {
    try {

        const tenant = await deleteTenant({
            slug: req.params.slug,
            userId: req.user.id
        });

        res.status(200).json({
            success: true,
            message: "Tenant deleted successfully",
            tenant
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createTenantController,
    switchOrganizationController,
    updateTenantController,
    deleteTenantController
};
