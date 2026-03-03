import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useGeneratedModelForm } from "../hooks/useGeneratedModelForm";
import { sampleModelFormContract } from "./fixtures/modelFormContract";

function createDeferred<T>() {
 let resolve!: (value: T) => void;
 const promise = new Promise<T>((res) => {
 resolve = res;
 });
 return { promise, resolve };
}

describe("generated submit loading lifecycle", () => {
 it("transitions loading/disabled state consistently for in-flight submit", async () => {
 const deferred = createDeferred<{
 ok: boolean;
 errors: unknown[];
 conflict: boolean;
 formErrorKey: string;
 }>();
 const executeMutation = vi.fn().mockImplementation(() => deferred.promise);

 const { result } = renderHook(() =>
 useGeneratedModelForm({
 generatedEnabled: true,
 contract: sampleModelFormContract,
 submitMode: "CREATE",
 executeMutation,
 }),
 );

 let inFlight: Promise<unknown> = Promise.resolve();
 act(() => {
 inFlight = result.current.submit({ name: "Loading", price: 10 });
 });

 await waitFor(() => {
 expect(result.current.submitState.isSubmitting).toBe(true);
 expect(result.current.submitState.status).toBe("SUBMITTING");
 });

 let reentrant: Awaited<ReturnType<typeof result.current.submit>> | null = null;
 await act(async () => {
 reentrant = await result.current.submit({ name: "Loading", price: 10 });
 });
 expect(reentrant?.ok).toBe(false);
 expect(reentrant?.errors[0]?.message).toMatch(
 /(already in progress|envoi\s+d[eé]j[àa]\s+en\s+cours)/i,
 );

 deferred.resolve({
 ok: true,
 errors: [],
 conflict: false,
 formErrorKey: "__all__",
 });

 await act(async () => {
 await inFlight;
 });

 expect(result.current.submitState.isSubmitting).toBe(false);
 expect(result.current.submitState.status).toBe("SUCCEEDED");
 });
});
