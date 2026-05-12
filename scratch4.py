import re

file_path = "src/components/kpi-tree/KpiTree.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace edge colors in getEdgeStyle
content = content.replace("strokeColor = '#f43f5e';", "strokeColor = 'url(#edge-gradient-danger)';")
content = content.replace("strokeColor = '#fbbf24';", "strokeColor = 'url(#edge-gradient-warning)';")
content = content.replace("strokeColor = '#34d399';", "strokeColor = 'url(#edge-gradient-good)';")

# Inject <svg><defs> inside <ReactFlow>
svg_defs = """
          <svg style={{ position: 'absolute', width: 0, height: 0 }}>
            <defs>
              <linearGradient id="edge-gradient-good" x1="0%" y1="0%" x2={layoutDirection === 'LR' ? '100%' : '0%'} y2={layoutDirection === 'LR' ? '0%' : '100%'}>
                <stop offset="0%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <linearGradient id="edge-gradient-warning" x1="0%" y1="0%" x2={layoutDirection === 'LR' ? '100%' : '0%'} y2={layoutDirection === 'LR' ? '0%' : '100%'}>
                <stop offset="0%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
              <linearGradient id="edge-gradient-danger" x1="0%" y1="0%" x2={layoutDirection === 'LR' ? '100%' : '0%'} y2={layoutDirection === 'LR' ? '0%' : '100%'}>
                <stop offset="0%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>
            </defs>
          </svg>
          <Background"""

content = content.replace("<Background", svg_defs)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

