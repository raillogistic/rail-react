import "@tanstack/react-form";

declare module "@tanstack/react-form" {
  export type UseFormReturn<TValues = Record<string, any>> = any;
}

