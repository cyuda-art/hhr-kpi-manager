// using native fetch

async function runTest() {
  const apiUrl = 'https://hhr-kpi-manager.vercel.app/api/reconstruct-tree';
  
  // テスト用のベースとなるKPIツリーデータ（最小構成）
  const baseKpiData = {
    "node_kgi": {
      id: "node_kgi",
      name: "営業利益",
      type: "KGI",
      targetValue: 1000,
      parentId: null
    },
    "node_sales": {
      id: "node_sales",
      name: "売上高",
      type: "KPI",
      targetValue: 5000,
      parentId: "node_kgi"
    }
  };

  console.log("=========================================");
  console.log("🧪 テスト1: 選択中KPIの「目標数値」の変更");
  console.log("選択中: [node_sales] 売上高");
  console.log("指示: 「目標数値を1億に変更して」");
  console.log("=========================================");
  
  try {
    const res1 = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: "目標数値を1億に変更して",
        selectedKpiId: "node_sales",
        selectedKpiName: "売上高",
        kpiData: baseKpiData,
        manifesto: "とにかく売上を伸ばす",
        swot: "",
        crossSwot: ""
      })
    });
    
    const data1 = await res1.json();
    if (data1.kpiData && data1.kpiData["node_sales"]) {
      console.log(`✅ 結果: 売上高の targetValue は ${data1.kpiData["node_sales"].targetValue} になりました。`);
    } else {
      console.log("❌ 失敗:", data1);
    }
  } catch(e) {
    console.error(e);
  }

  console.log("\n=========================================");
  console.log("🧪 テスト2: 選択中KPIの直下への「新規ノード追加」");
  console.log("選択中: [node_sales] 売上高");
  console.log("指示: 「このKPIの直下に『新規顧客開拓数』と『既存顧客リピート率』という要素を追加して」");
  console.log("=========================================");

  try {
    const res2 = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: "このKPIの直下に『新規顧客開拓数』と『既存顧客リピート率』という要素を追加して",
        selectedKpiId: "node_sales",
        selectedKpiName: "売上高",
        kpiData: baseKpiData,
        manifesto: "とにかく売上を伸ばす",
        swot: "",
        crossSwot: ""
      })
    });
    
    const data2 = await res2.json();
    if (data2.kpiData) {
      const nodes = Object.values(data2.kpiData);
      const newChildren = nodes.filter(n => n.parentId === "node_sales");
      console.log(`✅ 結果: node_sales の子ノードとして ${newChildren.length} 個の要素が生成されました。`);
      newChildren.forEach(child => {
        console.log(`   - [追加されたノード]: ${child.name} (type: ${child.type})`);
      });
    } else {
      console.log("❌ 失敗:", data2);
    }
  } catch(e) {
    console.error(e);
  }
}

runTest();
