import re

# Fix generate-kpi-tree
file_path_1 = "src/app/api/generate-kpi-tree/route.ts"
with open(file_path_1, "r", encoding="utf-8") as f:
    content1 = f.read()

content1 = content1.replace(
    """  - 子ノードを持つすべての親ノードは、必ず isCalculated: true とし、子ノードのIDを用いた正しい formula (例: "#{id1} * #{id2}" や "#{id1} / #{id2} * 100") を設定してください。""",
    """  - 子ノードを持つすべての親ノードは、必ず isCalculated: true とし、子ノードのIDを用いた正しい formula (例: "#{id1} * #{id2}" や "#{id1} / #{id2} * 100") を設定してください。
  - 【警告】formula には、絶対にノードの「名前（日本語など）」を含めてはいけません。必ず #{node_id} のようにIDを指定してください。 例: [×間違い] #{売上高} * #{客数} -> [○正解] #{kpi_1} * #{kpi_2}"""
)

with open(file_path_1, "w", encoding="utf-8") as f:
    f.write(content1)

# Fix reconstruct-tree
file_path_2 = "src/app/api/reconstruct-tree/route.ts"
with open(file_path_2, "r", encoding="utf-8") as f:
    content2 = f.read()

content2 = content2.replace(
    """3. 計算式（formula）がある場合は、依存関係（#{nodeId}）が正しく機能するようにしてください。""",
    """3. 計算式（formula）がある場合は、依存関係（#{nodeId}）が正しく機能するようにしてください。
   【警告】formula には、絶対にノードの「名前（日本語など）」を含めてはいけません。必ず #{node_id} のようにIDを指定してください。 例: [×間違い] #{売上高} * #{客数} -> [○正解] #{kpi_1} * #{kpi_2}"""
)

with open(file_path_2, "w", encoding="utf-8") as f:
    f.write(content2)

