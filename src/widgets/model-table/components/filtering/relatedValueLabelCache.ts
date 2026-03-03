const cache = new Map<string, Map<string, string>>();

export const registerRelatedValueLabel = ({
 fieldName,
 value,
 label,
}: {
 fieldName: string;
 value: string | number;
 label: string;
}) => {
 let fieldCache = cache.get(fieldName);
 if (!fieldCache) {
 fieldCache = new Map<string, string>();
 cache.set(fieldName, fieldCache);
 }
 fieldCache.set(String(value), label);
};

export const findRelatedValueLabel = (
 fieldName: string,
 value: string | number
): string | undefined => cache.get(fieldName)?.get(String(value));

export const clearRelatedValueLabels = (fieldName: string) => {
 cache.delete(fieldName);
};

