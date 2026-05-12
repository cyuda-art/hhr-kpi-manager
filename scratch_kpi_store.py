import re

file_path = "src/store/useKpiStore.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace recalculateTree function
old_recalculate_tree = """const recalculateTree = (draft: Record<string, KpiNodeWithComputedAndInit>, valueType: 'actualValue' | 'targetValue' | 'simulatedValue') => {
  let hasChanged = true;
  let maxIterations = 5; // ループ上限
  
  while (hasChanged && maxIterations > 0) {
    hasChanged = false;
    maxIterations--;
    
    Object.values(draft).forEach(node => {
      if (node.isCalculated && node.formula) {
        const newValue = evaluateFormula(node.formula, draft, valueType);
        if (newValue !== null && !isNaN(newValue) && isFinite(newValue)) {
          const currentValue = valueType === 'simulatedValue' && node.simulatedValue !== undefined 
            ? node.simulatedValue 
            : node[valueType === 'simulatedValue' ? 'actualValue' : valueType];
          
          if (Math.abs(newValue - currentValue) > 0.01) { // 誤差許容
            hasChanged = true;
            if (valueType === 'simulatedValue') {
              draft[node.id] = calculateComputed({ ...draft[node.id], simulatedValue: newValue, isSimulated: true });
            } else if (valueType === 'targetValue') {
              draft[node.id] = calculateComputed({ ...draft[node.id], targetValue: newValue });
            } else {
              draft[node.id] = calculateComputed({ ...draft[node.id], actualValue: newValue, initialActualValue: newValue });
            }
          }
        }
      }
    });
  }
};"""

new_recalculate_tree = """// トポロジカルソートを用いた計算ツリーの再計算
const recalculateTree = (draft: Record<string, KpiNodeWithComputedAndInit>, valueType: 'actualValue' | 'targetValue' | 'simulatedValue') => {
  const inDegree: Record<string, number> = {};
  const graph: Record<string, string[]> = {};
  const nodesWithFormula: string[] = [];

  // 初期化
  Object.keys(draft).forEach(id => {
    inDegree[id] = 0;
    graph[id] = [];
  });

  // 依存関係（DAG）の構築
  Object.values(draft).forEach(node => {
    if (node.isCalculated && node.formula) {
      nodesWithFormula.push(node.id);
      const regex = /#\\{([^}]+)\\}/g;
      let match;
      while ((match = regex.exec(node.formula)) !== null) {
        const depId = match[1];
        if (draft[depId]) {
          graph[depId].push(node.id); // depIdが更新されたら、node.idを更新する必要がある
          inDegree[node.id] = (inDegree[node.id] || 0) + 1;
        }
      }
    }
  });

  // inDegreeが0の（他への依存がない）数式ノードからQueueに追加
  const queue: string[] = [];
  nodesWithFormula.forEach(id => {
    if (inDegree[id] === 0) queue.push(id);
  });

  let processedCount = 0;

  while (queue.length > 0) {
    const currId = queue.shift()!;
    processedCount++;

    const node = draft[currId];
    if (node && node.isCalculated && node.formula) {
      const newValue = evaluateFormula(node.formula, draft, valueType);
      if (newValue !== null && !isNaN(newValue) && isFinite(newValue)) {
        if (valueType === 'simulatedValue') {
          draft[node.id] = calculateComputed({ ...draft[node.id], simulatedValue: newValue, isSimulated: true });
        } else if (valueType === 'targetValue') {
          draft[node.id] = calculateComputed({ ...draft[node.id], targetValue: newValue });
        } else {
          draft[node.id] = calculateComputed({ ...draft[node.id], actualValue: newValue, initialActualValue: newValue });
        }
      }
    }

    // 依存しているノードのinDegreeを減らす
    graph[currId].forEach(dependentId => {
      inDegree[dependentId]--;
      if (inDegree[dependentId] === 0) {
        queue.push(dependentId);
      }
    });
  }

  // 循環参照エラー（Cycle Detection）
  if (processedCount < nodesWithFormula.length) {
    console.warn("⚠️ 循環参照が検出されたため、一部の計算式がスキップされました。");
  }
};"""

content = content.replace(old_recalculate_tree, new_recalculate_tree)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
