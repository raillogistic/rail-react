export type FlattenedRow = 
  | { type: "group"; groupKey: string; label: string; rows: any[] }
  | { type: "data"; row: any; rowIndex: number; groupKey?: string };

export function flattenGroupedData(
  groupedData: Array<{ key: string; label: string; rows: any[] }>,
  groupCollapsed: Record<string, boolean>
): FlattenedRow[] {
  const flattened: FlattenedRow[] = [];
  
  groupedData.forEach(group => {
    flattened.push({ 
      type: "group", 
      groupKey: group.key, 
      label: group.label, 
      rows: group.rows 
    });
    
    if (!groupCollapsed[group.key]) {
      group.rows.forEach((row, idx) => {
        flattened.push({ 
          type: "data", 
          row, 
          rowIndex: idx, 
          groupKey: group.key 
        });
      });
    }
  });
  
  return flattened;
}
