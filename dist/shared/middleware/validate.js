"use strict";
/**
 * Zod validation middleware — validates request body, params, and query.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const zod_1 = require("zod");
const errors_1 = require("../errors");
/**
 * Creates middleware that validates request parts against Zod schemas.
 * On success, replaces req.body/params/query with parsed (clean) data.
 */
function validate(schemas) {
    return (req, _res, next) => {
        try {
            if (schemas.body) {
                req.body = schemas.body.parse(req.body);
            }
            if (schemas.params) {
                req.params = schemas.params.parse(req.params);
            }
            if (schemas.query) {
                req.query = schemas.query.parse(req.query);
            }
            next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                const fieldErrors = {};
                for (const issue of err.issues) {
                    const path = issue.path.join('.') || '_root';
                    if (!fieldErrors[path])
                        fieldErrors[path] = [];
                    fieldErrors[path].push(issue.message);
                }
                next(new errors_1.ValidationError('Validation failed', fieldErrors));
                return;
            }
            next(err);
        }
    };
}
//# sourceMappingURL=validate.js.map