/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');

const dump = JSON.parse(fs.readFileSync('dump.json', 'utf8'));
const kpiData = dump.kpiData;
const draft = { ...kpiData };
const allMonths = [
  "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09",
  "2026-10", "2026-11", "2026-12", "2027-01", "2027-02", "2027-03"
];

try {
  Object.values(draft).forEach(node => {
    const isPercentage = node.unit === '%' || node.unit === '％';
    const monthlyData = {};
    allMonths.forEach(m => {
      monthlyData[m] = {
        targetValue: isPercentage ? (node.targetValue || 0) : ((node.targetValue || 0) / 12),
        actualValue: 0
      };
    });
    
    // Extract end-of-month cumulative values from history
    if (node.history && Array.isArray(node.history)) {
      const sortedHistory = [...node.history].sort((a, b) => a.date.localeCompare(b.date));
      const endOfMonthValues = {};
      sortedHistory.forEach(record => {
        const m = record.date.substring(0, 7);
        endOfMonthValues[m] = record.actualValue; // will overwrite, leaving the last day's value
      });
      
      let previousCumValue = 0;
      allMonths.forEach(m => {
        if (endOfMonthValues[m] !== undefined) {
          const cumValue = endOfMonthValues[m];
          if (isPercentage) {
            monthlyData[m].actualValue = cumValue;
          } else {
            monthlyData[m].actualValue = Math.max(0, cumValue - previousCumValue);
          }
          previousCumValue = cumValue;
        }
      });
    }
    draft[node.id] = { ...node, monthlyData };
  });

  console.log("Success! KGI Target for 2026-04:", draft['kgi_main'].monthlyData['2026-04'].targetValue);
  fs.writeFileSync('draft_output.json', JSON.stringify(draft, null, 2));
} catch (err) {
  console.error("Error running debug tool:", err);
}
