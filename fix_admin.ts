import fs from "fs";

const file = "src/routes/_authenticated/admin.tsx";
let content = fs.readFileSync(file, "utf-8");

const startStr = "<select\n            value={selectedSlug}";
const endStr = "</select>";

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr, startIndex) + endStr.length;

if (startIndex === -1 || endIndex < startIndex) {
  console.error("Could not find admin.tsx bounds");
  process.exit(1);
}

const oldSelect = content.substring(startIndex, endIndex);

const newSelect = oldSelect.replace(
  "{jyotirlingas.map((j) => (",
  "<option value=\"random\">✨ Random Shrine + New Concept</option>\n            {jyotirlingas.map((j) => ("
);

content = content.substring(0, startIndex) + newSelect + content.substring(endIndex);
fs.writeFileSync(file, content);
console.log("Updated admin.tsx");
