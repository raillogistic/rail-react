const fs = require('fs');

const path = 'e:/Projects/PRIVATE/transtev/rail-react/src/widgets/model-table/components/DynamicModelTable.tsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

let propsIndex = -1;
let innerIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith('type DynamicBaseTableContentProps')) {
    propsIndex = i;
  }
  if (lines[i].startsWith('const DynamicModelTableInner')) {
    innerIndex = i;
  }
}

if (propsIndex === -1 || innerIndex === -1) {
  console.error("Could not find delimiters");
  process.exit(1);
}

const imports = lines.slice(0, propsIndex);
const baseTableContentLines = lines.slice(propsIndex, innerIndex);
let baseTableContentStr = baseTableContentLines.join('\n');
baseTableContentStr = baseTableContentStr.replace('function DynamicBaseTableContent<', 'export function DynamicBaseTableContent<');

fs.writeFileSync(
  'e:/Projects/PRIVATE/transtev/rail-react/src/widgets/model-table/components/DynamicBaseTableContent.tsx',
  imports.join('\n') + '\n' + baseTableContentStr
);

const wrapperLines = lines.slice(innerIndex);
const wrapperStr = imports.join('\n') + '\n' +
  'import { DynamicBaseTableContent } from "./DynamicBaseTableContent";\n' +
  'import type { DynamicBaseTableContentProps } from "./DynamicBaseTableContent";\n\n' +
  wrapperLines.join('\n');

fs.writeFileSync(path, wrapperStr);

console.log("Splitting finished");
