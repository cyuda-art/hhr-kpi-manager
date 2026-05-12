import re

file_path = "src/store/useKpiStore.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_code = """      while ((match = regex.exec(node.formula)) !== null) {
        const depId = match[1];
        if (draft[depId]) {
          graph[depId].push(node.id); // depIdが更新されたら、node.idを更新する必要がある
          inDegree[node.id] = (inDegree[node.id] || 0) + 1;
        }
      }"""

new_code = """      while ((match = regex.exec(node.formula)) !== null) {
        const depId = match[1];
        if (draft[depId]) {
          // depIdも計算ノードである場合のみ、その完了を待つ必要がある（末端ノードの場合は値が確定済みのため待たない）
          if (draft[depId].isCalculated && draft[depId].formula) {
            graph[depId].push(node.id); // depIdが更新されたら、node.idを更新する必要がある
            inDegree[node.id] = (inDegree[node.id] || 0) + 1;
          }
        }
      }"""

content = content.replace(old_code, new_code)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
