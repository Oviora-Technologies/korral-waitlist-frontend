"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommunityOrGroup = createCommunityOrGroup;
exports.getManagedOrganization = getManagedOrganization;
exports.getManagedMembers = getManagedMembers;
const database_1 = require("../config/database");
const authService_1 = require("./authService");
/**
 * Register the creator as an individual, then create the organization
 * with adminUserId referencing the individual registration's _id.
 * Basic compensation is used for standalone local MongoDB instances.
 * A production deployment should use a MongoDB transaction and email verification.
 */
async function createCommunityOrGroup(input, signedInUserId, existingToken) {
    const { creator, type, name, slug, description, location } = input;
    if (!signedInUserId && !creator)
        throw new Error('Creator details are required');
    const passwordHash = creator && !signedInUserId
        ? await (0, authService_1.hashPassword)(creator.password)
        : undefined;
    const now = new Date();
    let userId = signedInUserId;
    let newlyCreatedUser = false;
    let organizationId;
    try {
        // Check the slug before making the individual registration.
        const existing = await database_1.db
            .collection('organizations')
            .findOne({ type, slug }, { projection: { _id: 1 } });
        if (existing) {
            const error = new Error('This invitation name is already in use');
            error.code = 11000;
            throw error;
        }
        if (!signedInUserId && creator) {
            const userResult = await database_1.db.collection('registrations').insertOne({
                name: creator.fullName,
                fullName: creator.fullName,
                email: creator.email,
                phone: creator.phone,
                passwordHash,
                source: { type: 'direct' },
                consentedAt: now,
                status: 'pending',
                createdAt: now,
            });
            userId = userResult.insertedId;
            newlyCreatedUser = true;
        }
        if (!userId)
            throw new Error('Creator not found');
        const orgResult = await database_1.db.collection('organizations').insertOne({
            type,
            name,
            slug,
            description,
            location,
            adminUserId: userId,
            createdBy: userId,
            adminStatus: 'pending_verification',
            createdAt: now,
        });
        organizationId = orgResult.insertedId;
        const membership = await database_1.db
            .collection('registrations')
            .updateOne({ _id: userId }, { $addToSet: { managedOrganizationIds: organizationId } });
        if (membership.matchedCount !== 1)
            throw new Error('Failed to link user and organization');
        return {
            organizationId: organizationId.toHexString(),
            userId: userId.toHexString(),
            type,
            name,
            slug,
            description,
            location,
            sessionToken: existingToken || (await (0, authService_1.createSession)(userId)),
            adminStatus: 'pending_verification',
        };
    }
    catch (error) {
        if (organizationId)
            await database_1.db
                .collection('organizations')
                .deleteOne({ _id: organizationId })
                .catch(() => { });
        if (newlyCreatedUser && userId)
            await database_1.db
                .collection('registrations')
                .deleteOne({ _id: userId })
                .catch(() => { });
        throw error;
    }
}
/** Only the authenticated organization creator can read members. */
async function getManagedOrganization(type, slug, userId) {
    const org = await database_1.db
        .collection('organizations')
        .findOne({ type, slug, adminUserId: userId });
    if (!org)
        return null;
    const [memberCount, creator] = await Promise.all([
        database_1.db
            .collection('registrations')
            .countDocuments({ 'source.organizationId': org._id }),
        database_1.db
            .collection('registrations')
            .findOne({ _id: userId }, { projection: { _id: 1, name: 1 } }),
    ]);
    return {
        id: org._id.toHexString(),
        name: org.name,
        type: org.type,
        slug: org.slug,
        description: org.description || '',
        location: org.location || null,
        adminStatus: org.adminStatus || 'pending_verification',
        creator: creator
            ? { id: creator._id.toHexString(), name: creator.name }
            : null,
        memberCount: memberCount + (creator ? 1 : 0),
        joinedMemberCount: memberCount,
    };
}
async function getManagedMembers(type, slug, userId) {
    const org = await database_1.db
        .collection('organizations')
        .findOne({ type, slug, adminUserId: userId });
    if (!org)
        return null;
    const [creator, members] = await Promise.all([
        database_1.db
            .collection('registrations')
            .findOne({ _id: userId }, { projection: { _id: 1, name: 1, createdAt: 1 } }),
        database_1.db
            .collection('registrations')
            .find({ 'source.organizationId': org._id }, { projection: { _id: 1, name: 1, createdAt: 1 } })
            .sort({ createdAt: -1 })
            .limit(100)
            .toArray(),
    ]);
    return [
        ...(creator
            ? [
                {
                    id: creator._id.toHexString(),
                    name: creator.name,
                    role: 'admin',
                    joinedAt: creator.createdAt,
                },
            ]
            : []),
        ...members.map((person) => ({
            id: person._id.toHexString(),
            name: person.name,
            role: 'member',
            joinedAt: person.createdAt,
        })),
    ];
}
