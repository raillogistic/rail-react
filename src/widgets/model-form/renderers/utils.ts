export function buildResponsiveGridClass(columns: number) {
  const normalized = Math.max(1, Math.min(columns, 6));
  const classes = ["grid-cols-1"];

  if (normalized >= 2) classes.push("sm:grid-cols-2");
  if (normalized >= 3) classes.push("md:grid-cols-3");
  if (normalized >= 4) classes.push("lg:grid-cols-4");
  if (normalized >= 5) classes.push("xl:grid-cols-5");
  if (normalized >= 6) classes.push("2xl:grid-cols-6");

  return classes.join(" ");
}

const COL_SPANS: Record<string, Record<number, string>> = {
  xs: {
    1: "col-span-1",
    2: "col-span-2",
    3: "col-span-3",
    4: "col-span-4",
    5: "col-span-5",
    6: "col-span-6",
  },
  sm: {
    1: "sm:col-span-1",
    2: "sm:col-span-2",
    3: "sm:col-span-3",
    4: "sm:col-span-4",
    5: "sm:col-span-5",
    6: "sm:col-span-6",
  },
  md: {
    1: "md:col-span-1",
    2: "md:col-span-2",
    3: "md:col-span-3",
    4: "md:col-span-4",
    5: "md:col-span-5",
    6: "md:col-span-6",
  },
  lg: {
    1: "lg:col-span-1",
    2: "lg:col-span-2",
    3: "lg:col-span-3",
    4: "lg:col-span-4",
    5: "lg:col-span-5",
    6: "lg:col-span-6",
  },
  xl: {
    1: "xl:col-span-1",
    2: "xl:col-span-2",
    3: "xl:col-span-3",
    4: "xl:col-span-4",
    5: "xl:col-span-5",
    6: "xl:col-span-6",
  },
  "2xl": {
    1: "2xl:col-span-1",
    2: "2xl:col-span-2",
    3: "2xl:col-span-3",
    4: "2xl:col-span-4",
    5: "2xl:col-span-5",
    6: "2xl:col-span-6",
  },
};

export function buildResponsiveColSpanClass(colSpan: number, columns: number) {
  const span = Math.max(1, Math.min(colSpan, columns));
  const classes = [COL_SPANS.xs[1]]; // On mobile (xs), it always collapses to exactly one column (col-span-1)

  if (columns >= 2) {
    const smSpan = Math.min(span, 2);
    classes.push(COL_SPANS.sm[smSpan]);
  }
  if (columns >= 3) {
    const mdSpan = Math.min(span, 3);
    classes.push(COL_SPANS.md[mdSpan]);
  }
  if (columns >= 4) {
    const lgSpan = Math.min(span, 4);
    classes.push(COL_SPANS.lg[lgSpan]);
  }
  if (columns >= 5) {
    const xlSpan = Math.min(span, 5);
    classes.push(COL_SPANS.xl[xlSpan]);
  }
  if (columns >= 6) {
    const xxlSpan = Math.min(span, 6);
    classes.push(COL_SPANS["2xl"][xxlSpan]);
  }

  return classes.filter(Boolean).join(" ");
}
