/**
 * Zod validation middleware — validates request body, params, and query.
 */
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
interface ValidationSchemas {
    body?: ZodSchema;
    params?: ZodSchema;
    query?: ZodSchema;
}
/**
 * Creates middleware that validates request parts against Zod schemas.
 * On success, replaces req.body/params/query with parsed (clean) data.
 */
export declare function validate(schemas: ValidationSchemas): (req: Request, _res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=validate.d.ts.map