export const SUBMIT_ORCHESTRATION_BUDGET_MS = 25;
export const ERROR_NORMALIZATION_BUDGET_MS = 10;

export type SubmitPerformanceMeasurement = {
 durationMs: number;
 withinBudget: boolean;
};

function nowMs() {
 if (typeof performance !== "undefined" && typeof performance.now === "function") {
 return performance.now();
 }
 return Date.now();
}

export function measureSubmitOrchestration<T>(
 fn: () => T,
): { result: T; measurement: SubmitPerformanceMeasurement } {
 const start = nowMs();
 const result = fn();
 const durationMs = nowMs() - start;
 return {
 result,
 measurement: {
 durationMs,
 withinBudget: durationMs <= SUBMIT_ORCHESTRATION_BUDGET_MS,
 },
 };
}

export function measureErrorNormalization<T>(
 fn: () => T,
): { result: T; measurement: SubmitPerformanceMeasurement } {
 const start = nowMs();
 const result = fn();
 const durationMs = nowMs() - start;
 return {
 result,
 measurement: {
 durationMs,
 withinBudget: durationMs <= ERROR_NORMALIZATION_BUDGET_MS,
 },
 };
}
