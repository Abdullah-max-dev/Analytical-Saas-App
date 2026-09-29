const tenantModel = require("../models/tenant.model");
const userModel = require("../../users/models/user.model");

const createTenant = async ({ name, userId }) => {
    const slug = name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-");

    const existingTenant = await tenantModel.findOne({ slug });

    if (existingTenant) {
        throw new Error("Tenant with this name already exists");
    }

    const tenant = await tenantModel.create({
        name,
        slug,
        owner: userId
    });

    await userModel.findByIdAndUpdate(
        userId,
        {
            $push: {
                organizations: {
                    organizationId: tenant._id,
                    role: "owner"
                }
            }
        },
        { new: true }
    );

    return tenant;
};


const switchOrganization = async ({ userId, organizationId }) => {

    const user = await userModel.findById(userId);

    if (!user) {
        throw new Error("User not found");
    }

    const organization = user.organizations.find(
        (organization) =>
            organization.organizationId.toString() === organizationId.toString()
    );

    if (!organization) {
        throw new Error("You are not a member of this organization");
    }

    return {
        organizationId: organization.organizationId,
        role: organization.role
    };
};

const updateTenant = async ({ slug, userId, name }) => {
    console.log("SLUG:", slug);
    console.log("USER ID:", userId);
    const tenant = await tenantModel.findOne({
        slug,
        owner: userId
    });

    if (!tenant) {
        throw new Error("Tenant not found or you are not the owner");
    }

    tenant.name = name;

    tenant.slug = name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-");

    await tenant.save();

    return tenant;
};

const deleteTenant = async ({ slug, userId }) => {

    const tenant = await tenantModel.findOne({
        slug,
        owner: userId
    });

    if (!tenant) {
        throw new Error("Tenant not found or you are not the owner");
    }

    await tenantModel.findByIdAndDelete(tenant._id);

    await userModel.findByIdAndUpdate(
        userId,
        {
            $pull: {
                organizations: {
                    organizationId: tenant._id
                }
            }
        }
    );

    return tenant;
};

module.exports = {
    createTenant,
    switchOrganization,
    updateTenant,
    deleteTenant
};
