"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireString = requireString;
exports.requireStringMax = requireStringMax;
exports.optionalString = optionalString;
exports.requireOneOf = requireOneOf;
exports.requireISODate = requireISODate;
exports.optionalISODate = optionalISODate;
exports.requireBoolean = requireBoolean;
exports.requirePositiveInt = requirePositiveInt;
const Errors_1 = require("./Errors");
/** Assert a required string field is non-empty. */
function requireString(value, field) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Errors_1.ValidationError(field, 'must be a non-empty string');
    }
    return value.trim();
}
/** Assert a required string and enforce max length. */
function requireStringMax(value, field, max) {
    const s = requireString(value, field);
    if (s.length > max) {
        throw new Errors_1.ValidationError(field, `must be ${max} characters or fewer (got ${s.length})`);
    }
    return s;
}
/** Assert an optional string field — returns undefined if absent/null. */
function optionalString(value, field) {
    if (value === undefined || value === null)
        return undefined;
    if (typeof value !== 'string')
        throw new Errors_1.ValidationError(field, 'must be a string if provided');
    return value.trim() || undefined;
}
/** Assert value is one of an allowed set. */
function requireOneOf(value, field, allowed) {
    if (!allowed.includes(value)) {
        throw new Errors_1.ValidationError(field, `must be one of: ${allowed.join(', ')}`);
    }
    return value;
}
/** Assert value is a valid ISO-8601 date-time string. */
function requireISODate(value, field) {
    const s = requireString(value, field);
    if (isNaN(Date.parse(s))) {
        throw new Errors_1.ValidationError(field, 'must be a valid ISO-8601 date-time string');
    }
    return s;
}
/** Assert optional ISO-8601 date-time — returns undefined if absent. */
function optionalISODate(value, field) {
    if (value === undefined || value === null)
        return undefined;
    return requireISODate(value, field);
}
/** Assert a required boolean field. */
function requireBoolean(value, field) {
    if (typeof value !== 'boolean')
        throw new Errors_1.ValidationError(field, 'must be a boolean');
    return value;
}
/** Assert value is a positive integer. */
function requirePositiveInt(value, field) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
        throw new Errors_1.ValidationError(field, 'must be a positive integer');
    }
    return value;
}
//# sourceMappingURL=Validation.js.map