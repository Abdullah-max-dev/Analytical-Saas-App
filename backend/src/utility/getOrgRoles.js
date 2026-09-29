// utils/getInviterRole.js

const getInviterRole = (user, organizationId) => {
    return user.organizations.find(
        (org) =>
            org.organizationId.toString() ===
            organizationId.toString()
    )?.role;
};

module.exports = { getInviterRole };