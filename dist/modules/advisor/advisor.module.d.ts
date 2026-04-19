/**
 * Advisor service — intelligent financial insights and suggestions.
 */
export declare class AdvisorService {
    generateInsights(userId: string): Promise<{
        insights: string[];
        warnings: string[];
        suggestions: string[];
        monthlySummary: {
            currentExpensePaise: number;
            previousExpensePaise: number;
        };
    }>;
}
export declare const advisorService: AdvisorService;
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=advisor.module.d.ts.map