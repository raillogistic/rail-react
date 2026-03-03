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
