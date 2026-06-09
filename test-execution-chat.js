

async function runTest() {
  const apiUrl = 'https://hhr-kpi-manager.vercel.app/api/kpi-execution-chat';
  
  const payload = {
    message: "売上高を3500万円に、原価を1200万円に目標設定して",
    kpiContext: {
      id: "kpi_kgi",
      name: "営業利益",
      targetValue: 10000000,
      actualValue: 0,
      unit: "円",
      isCalculated: true,
      formula: "#{kpi_sales} - #{kpi_cost}"
    },
    childKpis: [
      { id: "kpi_sales", name: "売上高", targetValue: 30000000, actualValue: 0, unit: "円" },
      { id: "kpi_cost", name: "原価", targetValue: 20000000, actualValue: 0, unit: "円" }
    ],
    history: []
  };

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    console.log("=== Response Text ===");
    console.log(data.text);
    console.log("\n=== System Actions ===");
    console.log(JSON.stringify(data.systemActions, null, 2));
    
  } catch (err) {
    console.error(err);
  }
}

runTest();
