import re

file_path = "src/components/kpi-tree/KpiTree.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix targetStatus in getEdgeStyle to compute dynamically
get_edge_style_old = """    const getEdgeStyle = (targetId: string) => {
      const targetData = kpiData[targetId];
      const isSimulated = targetData?.isSimulated || false;
      const targetStatus = isPredictionMode 
        ? (targetData?.simulatedStatus || targetData?.status) 
        : targetData?.status;"""

get_edge_style_new = """    const getEdgeStyle = (targetId: string) => {
      const targetData = kpiData[targetId];
      const isSimulated = targetData?.isSimulated || false;
      let targetStatus = 'danger';
      
      if (targetData) {
        const displayTarget = targetData.targetValue || 0;
        const displayActual = isPredictionMode && targetData.simulatedValue !== undefined ? targetData.simulatedValue : (targetData.actualValue || 0);
        const achievementRate = displayTarget > 0 ? (displayActual / displayTarget) * 100 : 0;
        targetStatus = isPredictionMode && targetData.simulatedStatus ? targetData.simulatedStatus : (achievementRate >= 100 ? 'good' : achievementRate >= 80 ? 'warning' : 'danger');
      }
"""

content = content.replace(get_edge_style_old, get_edge_style_new)

# Fix status in svg defs
svg_status_old = """                const status = isPredictionMode ? (data.simulatedStatus || data.status) : data.status;"""
svg_status_new = """                const status = isPredictionMode && data.simulatedStatus ? data.simulatedStatus : (achievementRate >= 100 ? 'good' : achievementRate >= 80 ? 'warning' : 'danger');"""

content = content.replace(svg_status_old, svg_status_new)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

