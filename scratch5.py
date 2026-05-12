import re

file_path = "src/components/kpi-tree/KpiTree.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace edge colors in getEdgeStyle
content = content.replace("strokeColor = 'url(#edge-gradient-danger)'; // rose-500", "strokeColor = `url(#edge-progress-${targetId})`;")
content = content.replace("strokeColor = 'url(#edge-gradient-warning)'; // amber-400", "strokeColor = `url(#edge-progress-${targetId})`;")
content = content.replace("strokeColor = 'url(#edge-gradient-good)'; // emerald-400", "strokeColor = `url(#edge-progress-${targetId})`;")

# Inject dynamic <svg><defs> inside <ReactFlow>
svg_defs_old = """          <svg style={{ position: 'absolute', width: 0, height: 0 }}>
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
          </svg>"""

svg_defs_new = """          <svg style={{ position: 'absolute', width: 0, height: 0 }}>
            <defs>
              {Object.keys(kpiData).map(id => {
                const data = kpiData[id];
                if (!data || !data.parentId) return null;
                const displayTarget = data.targetValue || 0;
                const displayActual = isPredictionMode && data.simulatedValue !== undefined ? data.simulatedValue : (data.actualValue || 0);
                const achievementRate = displayTarget > 0 ? Math.min(100, Math.max(0, (displayActual / displayTarget) * 100)) : 0;
                
                const status = isPredictionMode ? (data.simulatedStatus || data.status) : data.status;
                const color = status === 'good' ? '#10b981' : status === 'warning' ? '#fbbf24' : '#f43f5e';

                return (
                  <linearGradient key={`grad-${id}`} id={`edge-progress-${id}`} x1="0%" y1="0%" x2={layoutDirection === 'LR' ? '100%' : '0%'} y2={layoutDirection === 'LR' ? '0%' : '100%'}>
                    <stop offset="0%" stopColor={color} />
                    <stop offset={`${achievementRate}%`} stopColor={color} />
                    <stop offset={`${achievementRate}%`} stopColor="#cbd5e1" />
                    <stop offset="100%" stopColor="#cbd5e1" />
                  </linearGradient>
                );
              })}
            </defs>
          </svg>"""

content = content.replace(svg_defs_old, svg_defs_new)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

