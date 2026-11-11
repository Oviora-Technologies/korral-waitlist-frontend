"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findOrganization = findOrganization;
exports.registerPerson = registerPerson;
exports.duplicateKey = duplicateKey;
const database_1 = require("../config/database");
async function findOrganization(type, slug) {
    return database_1.db.collection('organizations').findOne({ type, slug });
}
async function registerPerson(data) {
    const organization = data.organizationType && data.organizationSlug
        ? await findOrganization(data.organizationType, data.organizationSlug)
        : null;
    if (data.organizationType && !organization)
        return false;
    await database_1.db.collection('registrations').insertOne({
        name: data.name,
        email: data.email,
        source: organization
            ? {
                type: organization.type,
                slug: organization.slug,
                organizationId: organization._id,
            }
            : { type: 'direct' },
        consentedAt: new Date(),
        status: 'pending',
        createdAt: new Date(),
    });
    return {
        organizationName: organization?.name,
        organizationType: organization?.type,
    };
}
function duplicateKey(error) {
    return (typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11000);
}
