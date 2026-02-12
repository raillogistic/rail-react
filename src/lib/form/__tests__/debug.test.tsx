// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useForm } from "@tanstack/react-form";

const DebugComponent = () => {
  const form = useForm({
    defaultValues: { name: "test" },
    onSubmit: async () => {},
  });

  React.useEffect(() => {
    console.log("Form keys:", Object.keys(form));
    console.log("Form store keys:", form.store ? Object.keys(form.store) : "store is undefined");
    if (form.store) {
       console.log("Form store prototype:", Object.getPrototypeOf(form.store));
    }
  }, [form]);

  return <div>Debug</div>;
};

describe("Debug Form", () => {
  it("should log form structure", () => {
    render(<DebugComponent />);
    expect(true).toBe(true);
  });
});
