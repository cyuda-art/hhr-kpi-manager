import re

file_path = "src/store/useKpiStore.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add sanitizeKpiData
insert_pos = content.find("const evaluateFormula = ")

sanitize_fn = """// 数式のAIブレを吸収するサニタイズ関数（名前ベースで数式が書かれていた場合にIDに自動置換する）
const sanitizeKpiData = (draft: Record<string, KpiNodeWithComputedAndInit>) => {
  const nameToIdMap: Record<string, string> = {};
  Object.values(draft).forEach(node => {
    nameToIdMap[node.name] = node.id;
  });

  Object.values(draft).forEach(node => {
    if (node.isCalculated && node.formula) {
      let newFormula = node.formula;
      
      // 1. #{名前} のパターンを補正
      newFormula = newFormula.replace(/#\\{([^}]+)\\}/g, (match, nameOrId) => {
        if (draft[nameOrId]) return match; // 既にIDならOK
        if (nameToIdMap[nameOrId]) return `#{${nameToIdMap[nameOrId]}}`;
        return match;
      });

      // 2. [名前] のパターンを補正（AIがよく間違う）
      newFormula = newFormula.replace(/\\[([^\\]]+)\\]/g, (match, nameOrId) => {
        if (draft[nameOrId]) return `#{${nameOrId}}`;
        if (nameToIdMap[nameOrId]) return `#{${nameToIdMap[nameOrId]}}`;
        return match;
      });
      
      node.formula = newFormula;
    }
  });
};

"""

content = content[:insert_pos] + sanitize_fn + content[insert_pos:]

# Add sanitizeKpiData to overwriteKpiData
content = content.replace(
    """  overwriteKpiData: (newKpiData) => set((state) => {
    state.saveHistory();
    const draft = { ...newKpiData };
    recalculateTree(draft, 'actualValue');""",
    """  overwriteKpiData: (newKpiData) => set((state) => {
    state.saveHistory();
    const draft = { ...newKpiData };
    sanitizeKpiData(draft);
    recalculateTree(draft, 'actualValue');"""
)

# And to setKpiDataBulk
content = content.replace(
    """      setKpiDataBulk: (nodes) => set((state) => {
        state.saveHistory();
        const draft = { ...state.kpiData };
        nodes.forEach(n => {
          draft[n.id] = calculateComputed({ ...n, initialActualValue: n.actualValue || 0 });
        });
        recalculateTree(draft, 'actualValue');""",
    """      setKpiDataBulk: (nodes) => set((state) => {
        state.saveHistory();
        const draft = { ...state.kpiData };
        nodes.forEach(n => {
          draft[n.id] = calculateComputed({ ...n, initialActualValue: n.actualValue || 0 });
        });
        sanitizeKpiData(draft);
        recalculateTree(draft, 'actualValue');"""
)

# Also let's run it on DB initialize to fix existing broken trees!
# In initializeDB:
content = content.replace(
    """            // 各KPIのhistoryをサブコレクションから取得して結合する
            if (Object.keys(kpiData).length > 0) {""",
    """            sanitizeKpiData(kpiData as Record<string, KpiNodeWithComputedAndInit>);
            recalculateTree(kpiData as Record<string, KpiNodeWithComputedAndInit>, 'actualValue');
            recalculateTree(kpiData as Record<string, KpiNodeWithComputedAndInit>, 'targetValue');
            
            // 各KPIのhistoryをサブコレクションから取得して結合する
            if (Object.keys(kpiData).length > 0) {"""
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
