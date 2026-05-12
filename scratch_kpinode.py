import re

file_path = "src/components/kpi-tree/KpiNodeComponent.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update getStatusBorder and getStatusBg
content = content.replace(
"""  const getStatusBorder = (status: string) => {
    switch (status) {
      case 'good': return 'border-emerald-400';
      case 'warning': return 'border-amber-400';
      case 'danger': return 'border-rose-400';
      default: return 'border-slate-300';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'good': return 'bg-emerald-500';
      case 'warning': return 'bg-amber-500';
      case 'danger': return 'bg-rose-500';
      default: return 'bg-slate-500';
    }
  };""",
"""  const getStatusBorder = (status: string) => {
    switch (status) {
      case 'good': return 'border-strategic-teal/60';
      case 'warning': return 'border-amber-500/60';
      case 'danger': return 'border-red-600/60';
      default: return 'border-slate-300';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'good': return 'bg-strategic-teal text-white';
      case 'warning': return 'bg-amber-500 text-white';
      case 'danger': return 'bg-red-600 text-white';
      default: return 'bg-logic-slate text-white';
    }
  };"""
)

# 2. Update Main Container Classes
content = content.replace(
"""    <div className={cn(
      "w-64 bg-white dark:bg-[#2d2f31] rounded-[8px] shadow-sm border border-slate-200 dark:border-slate-600 p-4 transition-all hover:shadow-md hover:-translate-y-0.5 duration-300 relative",
      getStatusBorder(displayStatus),
      data.isSimulated && "shadow-[#8ab4f8]/20",
      isSelected && "ring-2 ring-[#8ab4f8] border-[#8ab4f8]",
      isAlert && "animate-pulse shadow-red-900/30 border-[#f28b82]",
      data.warning && "border-amber-500 shadow-amber-500/20 ring-1 ring-amber-500",
      isPredictionMode && "bg-slate-50 dark:bg-[#202124] border-[#8ab4f8]",
      data.isKsf && "ring-2 ring-amber-400 dark:ring-amber-500 shadow-[0_0_15px_rgba(251,191,36,0.4)] dark:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
    )}>""",
"""    <div className={cn(
      "w-64 bg-white rounded-lg shadow-sm border p-4 transition-all duration-300 relative overflow-hidden",
      getStatusBorder(displayStatus),
      isAlert ? "bg-red-50/50 border-red-600" : "",
      isSelected && "ring-2 ring-oxford-navy border-oxford-navy shadow-md",
      data.isKsf && "border-2 border-strategic-teal shadow-[0_0_12px_rgba(0,163,161,0.15)] ring-1 ring-strategic-teal/20"
    )}>"""
)

# 3. Update Progress Bar
content = content.replace(
"""      {/* Background Progress Bar Wrapper */}
      <div className="absolute inset-0 overflow-hidden rounded-[8px] pointer-events-none">
        <div 
          className={cn(
            "absolute top-0 left-0 h-full opacity-[0.15] dark:opacity-[0.25] transition-all duration-1000 ease-out",
            displayStatus === 'good' ? "bg-gradient-to-r from-emerald-100 to-emerald-500 dark:from-emerald-900 dark:to-emerald-500" :
            displayStatus === 'warning' ? "bg-gradient-to-r from-amber-100 to-amber-500 dark:from-amber-900 dark:to-amber-500" :
            "bg-gradient-to-r from-rose-100 to-rose-500 dark:from-rose-900 dark:to-rose-500"
          )}
          style={{ width: `${Math.min(100, Math.max(0, displayAchievementRate))}%` }}
        />
      </div>""",
"""      {/* Background Progress Bar Wrapper (Refined Gradient) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div 
          className={cn(
            "absolute top-0 left-0 h-full opacity-10 transition-all duration-1000 ease-out",
            displayStatus === 'good' ? "bg-gradient-to-r from-strategic-teal to-strategic-teal/60" :
            displayStatus === 'warning' ? "bg-gradient-to-r from-amber-500 to-amber-400" :
            "bg-gradient-to-r from-red-600 to-red-400"
          )}
          style={{ width: `${Math.min(100, Math.max(0, displayAchievementRate))}%` }}
        />
      </div>"""
)

# 4. Update Typography & Layout
content = content.replace(
"""          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span className="text-[10px] font-bold text-[#8ab4f8] uppercase tracking-wider">{data.businessUnit}</span>
            {data.linkedSource && (
              <span className="text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded-[2px] font-bold flex-shrink-0 flex items-center gap-0.5" title="他プロジェクトから同期中の指標">
                <Link2 size={10} /> LINKED
              </span>
            )}
            {data.warning && (
              <span className="text-[9px] bg-amber-500/20 text-amber-600 px-1.5 py-0.5 rounded-[2px] font-bold flex-shrink-0 animate-pulse" title={data.warning}>
                ⚠️ 数式リセット
              </span>
            )}
            {data.type === 'KGI' ? (
              <span className="text-[9px] bg-[#c58af9]/20 text-[#c58af9] px-1.5 py-0.5 rounded-[2px] font-bold flex-shrink-0">Goal & KGI</span>
            ) : level === 1 ? (
              <span className="text-[9px] bg-[#fbbc04]/20 text-[#fbbc04] px-1.5 py-0.5 rounded-[2px] font-bold flex-shrink-0">KSF & KPI</span>
            ) : (
              <span className="text-[9px] bg-[#8ab4f8]/20 text-[#8ab4f8] px-1.5 py-0.5 rounded-[2px] font-bold flex-shrink-0">Process & KPI</span>
            )}
          </div>
          
          <div className="flex flex-col gap-2.5">
            {/* 定性（Goal/KSF）部分 */}
            {(data.qualitativeName || data.type === 'KGI') && (
              <div>
                <p className={cn(
                  "text-[10px] font-bold mb-0.5 flex items-center gap-1",
                  data.isKsf ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-[#9aa0a6]"
                )}>
                  <Target size={10} /> 
                  {data.isKsf ? "Key Success Factor" : getQualitativeLabel()}
                  {data.isKsf && <Sparkles size={10} className="text-amber-500 animate-pulse ml-0.5" />}
                </p>
                <p className={cn(
                  "font-bold text-[14px] leading-tight break-words",
                  data.isKsf ? "text-amber-700 dark:text-amber-300" : "text-slate-800 dark:text-[#e8eaed]"
                )}>
                  {(data.qualitativeName || '未設定').replace(/^(KSF|プロセス|Goal|Process)[:：\s]*/i, '')}
                </p>
              </div>
            )}
            
            {/* 定量（KGI/KPI）部分 */}
            <div>
              <p className="text-[10px] text-slate-500 dark:text-[#9aa0a6] font-bold mb-0.5 flex items-center gap-1">{data.type === 'KGI' ? <><BarChart2 size={10} /> KGI (定量指標)</> : <><BarChart2 size={10} /> KPI (定量指標)</>}</p>
              <p className="font-bold text-slate-800 dark:text-[#e8eaed] text-[13px] leading-tight break-words">{data.name}</p>
            </div>
          </div>""",
"""          <div className="flex items-center gap-1.5 mb-2 flex-wrap font-poppins">
            <span className="text-[9px] font-bold text-strategic-teal uppercase tracking-widest">{data.businessUnit}</span>
            {data.linkedSource && (
              <span className="text-[8px] bg-logic-slate/10 text-logic-slate px-1.5 py-0.5 rounded-[2px] font-bold flex-shrink-0 flex items-center gap-0.5 tracking-wider">
                <Link2 size={10} /> LINKED
              </span>
            )}
            {data.warning && (
              <span className="text-[8px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-[2px] font-bold flex-shrink-0 animate-pulse tracking-wider">
                ⚠️ RESET
              </span>
            )}
            <span className="text-[8px] bg-logic-slate/5 text-logic-slate px-1.5 py-0.5 rounded-[2px] font-bold flex-shrink-0 tracking-wider">
              {data.type === 'KGI' ? 'GOAL / KGI' : level === 1 ? 'KSF / KPI' : 'PROCESS / KPI'}
            </span>
          </div>
          
          <div className="flex flex-col gap-2.5">
            {/* 定性（Goal/KSF）部分 */}
            {(data.qualitativeName || data.type === 'KGI') && (
              <div>
                <p className={cn(
                  "text-[9px] font-bold mb-0.5 flex items-center gap-1 font-poppins tracking-wider uppercase",
                  data.isKsf ? "text-strategic-teal" : "text-logic-slate/70"
                )}>
                  <Target size={10} /> 
                  {data.isKsf ? "Key Success Factor" : getQualitativeLabel()}
                </p>
                <p className={cn(
                  "font-bold text-[13px] leading-snug break-words font-sans",
                  data.isKsf ? "text-oxford-navy" : "text-oxford-navy/90"
                )}>
                  {(data.qualitativeName || '未設定').replace(/^(KSF|プロセス|Goal|Process)[:：\s]*/i, '')}
                </p>
              </div>
            )}
            
            {/* 定量（KGI/KPI）部分 */}
            <div>
              <p className="text-[9px] text-logic-slate/70 font-bold mb-0.5 flex items-center gap-1 font-poppins tracking-wider uppercase"><BarChart2 size={10} /> {data.type === 'KGI' ? 'Quantitative KGI' : 'Quantitative KPI'}</p>
              <p className="font-bold text-oxford-navy text-[12px] leading-snug break-words font-sans">{data.name}</p>
            </div>
          </div>"""
)

# 5. Bottom area
content = content.replace(
"""        <div className="flex justify-between text-[12px] items-center">
          <span className={cn(
            "flex items-center gap-1",
            isPredictionMode ? "text-[#8ab4f8] font-medium" : "text-slate-500 dark:text-[#9aa0a6]"
          )}>
            {isPredictionMode && <Sparkles size={12} />}
            {isPast && !isPredictionMode && <History size={12} />}
            {data.isCalculated && <span title="自動計算項目"><Calculator size={12} className="text-primary-500" /></span>}
            {displayLabel}
          </span>
          <span className={cn(
            "font-medium",
            isPredictionMode ? "text-slate-800 dark:text-[#e8eaed]" : "text-slate-900 dark:text-[#f1f3f4]"
          )}>
            {displayActual.toLocaleString()} {data.unit}
            {data.linkedSource && <span title="他プロジェクトと同期されています"><Link2 size={10} className="inline ml-1 text-slate-400" /></span>}
          </span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-slate-500 dark:text-[#9aa0a6]">目標</span>
          <span className="text-slate-500 dark:text-[#9aa0a6]">{displayTarget.toLocaleString()} {data.unit}</span>
        </div>

        {readableFormula && (
          <div className="mt-2 pt-2 border-t border-dashed border-slate-200 dark:border-[#5f6368]/50">
            <div className="text-[10px] text-slate-500 dark:text-[#9aa0a6] bg-slate-50 dark:bg-[#202124] p-1.5 rounded border border-slate-100 dark:border-slate-700/50 break-words">
              <div className="flex items-center gap-1 mb-0.5 text-primary-600 dark:text-primary-400 font-bold">
                <Calculator size={10} /> 計算式
              </div>
              <div className="font-mono leading-tight text-[9px] text-slate-700 dark:text-slate-300">
                = {readableFormula}
              </div>
            </div>
          </div>
        )}""",
"""        <div className="flex justify-between text-[11px] items-center font-lato">
          <span className="flex items-center gap-1 text-logic-slate font-bold">
            {data.isCalculated && <span title="自動計算項目"><Calculator size={11} className="text-strategic-teal" /></span>}
            {displayLabel}
          </span>
          <span className="font-bold text-oxford-navy">
            {displayActual.toLocaleString()} {data.unit}
          </span>
        </div>
        <div className="flex justify-between text-[11px] font-lato">
          <span className="text-logic-slate/70 font-bold">目標</span>
          <span className="text-logic-slate/70 font-bold">{displayTarget.toLocaleString()} {data.unit}</span>
        </div>

        {readableFormula && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <div className="text-[10px] bg-clean-canvas p-1.5 rounded-md border border-slate-100 break-words font-formula italic text-logic-slate">
              {readableFormula}
            </div>
          </div>
        )}"""
)

# 6. Change chevron button
content = content.replace(
"""          className={cn(
            "absolute w-6 h-6 bg-white dark:bg-slate-800 border-2 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all z-20 shadow-sm",
            displayStatus === 'good' ? "border-emerald-400 hover:ring-2 hover:ring-emerald-400/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/30" :
            displayStatus === 'warning' ? "border-amber-400 hover:ring-2 hover:ring-amber-400/50 hover:bg-amber-50 dark:hover:bg-amber-900/30" :
            displayStatus === 'danger' ? "border-rose-400 hover:ring-2 hover:ring-rose-400/50 hover:bg-rose-50 dark:hover:bg-rose-900/30" :
            "border-slate-300",
            sourcePosition === Position.Right ? "-right-3 top-1/2 -translate-y-1/2" : "-bottom-3 left-1/2 -translate-x-1/2"
          )}""",
"""          className={cn(
            "absolute w-5 h-5 bg-white border rounded-full flex items-center justify-center text-logic-slate hover:text-oxford-navy hover:border-oxford-navy transition-all z-20 shadow-sm",
            getStatusBorder(displayStatus),
            sourcePosition === Position.Right ? "-right-2.5 top-1/2 -translate-y-1/2" : "-bottom-2.5 left-1/2 -translate-x-1/2"
          )}"""
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
