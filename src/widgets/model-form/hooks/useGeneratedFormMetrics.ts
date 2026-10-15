import { useRef } from "react";

type AttemptResult = {
 ok: boolean;
 hadValidationErrors?: boolean;
};

type MetricsSnapshot = {
 totalSubmissions: number;
 firstAttemptSuccesses: number;
 firstAttemptCorrectionSuccesses: number;
 correctionRate: number;
};

export function useGeneratedFormMetrics() {
 const attemptsRef = useRef<number>(0);
 const firstAttemptSuccessesRef = useRef<number>(0);
 const firstAttemptCorrectionSuccessesRef = useRef<number>(0);
 const waitingForCorrectionRef = useRef<boolean>(false);

 const recordAttempt = (result: AttemptResult) => {
 attemptsRef.current += 1;
 if (result.ok && !waitingForCorrectionRef.current) {
 firstAttemptSuccessesRef.current += 1;
 return;
 }
 if (!result.ok && result.hadValidationErrors) {
 waitingForCorrectionRef.current = true;
 return;
 }
 if (result.ok && waitingForCorrectionRef.current) {
 firstAttemptCorrectionSuccessesRef.current += 1;
 waitingForCorrectionRef.current = false;
 }
 };

 const resetMetrics = () => {
 attemptsRef.current = 0;
 firstAttemptSuccessesRef.current = 0;
 firstAttemptCorrectionSuccessesRef.current = 0;
 waitingForCorrectionRef.current = false;
 };

 const getSnapshot = (): MetricsSnapshot => {
 const attempts = attemptsRef.current;
 const corrections = firstAttemptCorrectionSuccessesRef.current;
 return {
 totalSubmissions: attempts,
 firstAttemptSuccesses: firstAttemptSuccessesRef.current,
 firstAttemptCorrectionSuccesses: corrections,
 correctionRate: attempts > 0 ? corrections / attempts : 0,
 };
 };

 return {
 recordAttempt,
 resetMetrics,
 getSnapshot,
 snapshot: getSnapshot(),
 };
}
