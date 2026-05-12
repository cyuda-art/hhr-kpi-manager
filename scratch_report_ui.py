import re

file_path = "src/app/[orgId]/p/[projectId]/report/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add missing icons
content = content.replace(
    "import { Printer, ChevronLeft, Building2, Target, Crosshair, BarChart, FileText } from 'lucide-react';",
    "import { Printer, ChevronLeft, Building2, Target, Crosshair, BarChart, FileText, Landmark, TrendingUp, Users2, Cpu, Swords, ShieldAlert, Replace, Truck, ShoppingCart, Gem, Star, Lock, LayoutTemplate } from 'lucide-react';"
)

# Insert parseFramework
insert_index = content.find("const kgiNodes = Object.values(kpiData).filter(n => n.type === 'KGI');")
parse_fn = """  const parseFramework = (dataStr: string | undefined) => {
    if (!dataStr) return null;
    try {
      const parsed = JSON.parse(dataStr);
      return typeof parsed === 'object' && parsed !== null ? parsed : { raw: dataStr };
    } catch (e) {
      return { raw: dataStr };
    }
  };

  const pest = parseFramework(currentOrg.pest);
  const fiveForces = parseFramework(currentOrg.fiveForces);
  const vrio = parseFramework(currentOrg.vrio);

"""

content = content[:insert_index] + parse_fn + content[insert_index:]

# Page 2 Replacement
old_page2 = """        {/* --- Page 2: Macro Environment (Compass) --- */}
        <div className="page-break-after p-16 min-h-[794px] bg-white relative">
          <div className="flex items-center gap-4 mb-10 pb-4 border-b-2 border-[#00205B]">
            <div className="w-12 h-12 bg-[#00205B] text-white flex items-center justify-center rounded-lg">
              <Crosshair size={24} />
            </div>
            <h2 className="text-3xl font-extrabold text-[#00205B]">経営環境と強みの源泉 (Compass)</h2>
          </div>

          <div className="space-y-8">
            <div className="bg-slate-50 p-6 rounded-xl border-l-4 border-[#00A3A1]">
              <h3 className="text-lg font-bold text-[#00205B] mb-2 uppercase tracking-wide">Master MVV / Absolute Constraint</h3>
              <p className="text-slate-700 whitespace-pre-wrap font-medium">{currentOrg.masterMvv || '未設定'}</p>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-bold text-[#00205B] mb-4 flex items-center gap-2">
                  <BarChart size={20} className="text-[#00A3A1]" /> PEST Analysis
                </h3>
                <div className="prose prose-sm prose-slate max-w-none text-[13px] leading-relaxed whitespace-pre-wrap bg-slate-50 p-6 rounded-xl">
                  {currentOrg.pest || '分析データがありません'}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#00205B] mb-4 flex items-center gap-2">
                  <Target size={20} className="text-[#00A3A1]" /> VRIO Analysis
                </h3>
                <div className="prose prose-sm prose-slate max-w-none text-[13px] leading-relaxed whitespace-pre-wrap bg-slate-50 p-6 rounded-xl">
                  {currentOrg.vrio || '分析データがありません'}
                </div>
              </div>
            </div>
          </div>
        </div>"""

new_page2 = """        {/* --- Page 2: Macro Environment (Compass) --- */}
        <div className="page-break-after p-16 min-h-[794px] bg-white relative flex flex-col">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-[#00205B] shrink-0">
            <div className="w-12 h-12 bg-[#00205B] text-white flex items-center justify-center rounded-lg">
              <Crosshair size={24} />
            </div>
            <h2 className="text-3xl font-extrabold text-[#00205B]">経営環境と強みの源泉 (Compass)</h2>
          </div>

          <div className="space-y-6 flex-1 flex flex-col">
            <div className="bg-slate-50 p-4 rounded-xl border-l-4 border-[#00A3A1] shrink-0">
              <h3 className="text-sm font-bold text-[#00205B] mb-1 uppercase tracking-wide">Master MVV / Absolute Constraint</h3>
              <p className="text-slate-700 whitespace-pre-wrap font-medium text-sm">{currentOrg.masterMvv || '未設定'}</p>
            </div>

            <div className="grid grid-cols-2 gap-8 flex-1">
              {/* PEST Analysis */}
              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-[#00205B] mb-4 flex items-center gap-2 border-b-2 border-slate-200 pb-2 inline-flex self-start">
                  <BarChart size={20} className="text-[#00A3A1]" /> PEST Analysis
                </h3>
                {pest?.raw ? (
                  <div className="bg-slate-50 p-4 rounded-xl text-[12px] whitespace-pre-wrap flex-1">{pest.raw}</div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 flex-1">
                    <div className="bg-rose-50 p-3 rounded-lg border border-rose-100 flex flex-col">
                      <div className="flex items-center gap-1.5 text-rose-700 font-bold mb-1.5 text-[11px]"><Landmark size={14}/> Politics</div>
                      <p className="text-[10px] text-slate-700 leading-relaxed flex-1">{pest?.politics}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex flex-col">
                      <div className="flex items-center gap-1.5 text-blue-700 font-bold mb-1.5 text-[11px]"><TrendingUp size={14}/> Economy</div>
                      <p className="text-[10px] text-slate-700 leading-relaxed flex-1">{pest?.economy}</p>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 flex flex-col">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-bold mb-1.5 text-[11px]"><Users2 size={14}/> Society</div>
                      <p className="text-[10px] text-slate-700 leading-relaxed flex-1">{pest?.society}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 flex flex-col">
                      <div className="flex items-center gap-1.5 text-purple-700 font-bold mb-1.5 text-[11px]"><Cpu size={14}/> Technology</div>
                      <p className="text-[10px] text-slate-700 leading-relaxed flex-1">{pest?.technology}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* VRIO Analysis */}
              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-[#00205B] mb-4 flex items-center gap-2 border-b-2 border-slate-200 pb-2 inline-flex self-start">
                  <Target size={20} className="text-[#00A3A1]" /> VRIO Analysis
                </h3>
                {vrio?.raw ? (
                  <div className="bg-slate-50 p-4 rounded-xl text-[12px] whitespace-pre-wrap flex-1">{vrio.raw}</div>
                ) : (
                  <div className="flex flex-col gap-3 flex-1">
                    <div className="flex items-stretch bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-1">
                      <div className="w-12 bg-[#00205B] text-white flex items-center justify-center font-bold text-xl shrink-0">V</div>
                      <div className="p-3 flex-1 flex flex-col justify-center">
                        <div className="text-[10px] font-bold text-slate-500 mb-0.5">Value (経済的価値)</div>
                        <p className="text-[11px] text-slate-800 leading-snug">{vrio?.value}</p>
                      </div>
                    </div>
                    <div className="flex items-stretch bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-1">
                      <div className="w-12 bg-[#003B73] text-white flex items-center justify-center font-bold text-xl shrink-0">R</div>
                      <div className="p-3 flex-1 flex flex-col justify-center">
                        <div className="text-[10px] font-bold text-slate-500 mb-0.5">Rarity (希少性)</div>
                        <p className="text-[11px] text-slate-800 leading-snug">{vrio?.rarity}</p>
                      </div>
                    </div>
                    <div className="flex items-stretch bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-1">
                      <div className="w-12 bg-[#00A3A1] text-white flex items-center justify-center font-bold text-xl shrink-0">I</div>
                      <div className="p-3 flex-1 flex flex-col justify-center">
                        <div className="text-[10px] font-bold text-slate-500 mb-0.5">Imitability (模倣困難性)</div>
                        <p className="text-[11px] text-slate-800 leading-snug">{vrio?.imitability}</p>
                      </div>
                    </div>
                    <div className="flex items-stretch bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-1">
                      <div className="w-12 bg-[#66C2C2] text-white flex items-center justify-center font-bold text-xl shrink-0">O</div>
                      <div className="p-3 flex-1 flex flex-col justify-center">
                        <div className="text-[10px] font-bold text-slate-500 mb-0.5">Organization (組織)</div>
                        <p className="text-[11px] text-slate-800 leading-snug">{vrio?.organization}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* 5 Forces Analysis (Added to bottom of Page 2) */}
            <div className="shrink-0 mt-4">
              <h3 className="text-lg font-bold text-[#00205B] mb-4 flex items-center gap-2 border-b-2 border-slate-200 pb-2 inline-flex self-start">
                <Crosshair size={20} className="text-[#00A3A1]" /> 5 Forces Analysis
              </h3>
              {fiveForces?.raw ? (
                 <div className="bg-slate-50 p-4 rounded-xl text-[12px] whitespace-pre-wrap">{fiveForces.raw}</div>
              ) : (
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                   <div className="grid grid-cols-3 gap-2">
                     <div className="col-start-2 bg-white p-2 rounded border border-slate-200 text-center shadow-sm">
                       <div className="text-[10px] font-bold text-slate-500 mb-1">新規参入の脅威</div>
                       <p className="text-[10px] leading-snug text-slate-800">{fiveForces?.newEntrants}</p>
                     </div>
                     <div className="col-span-3 grid grid-cols-3 gap-2">
                       <div className="bg-white p-2 rounded border border-slate-200 shadow-sm flex flex-col justify-center">
                         <div className="text-[10px] font-bold text-slate-500 mb-1">売り手の交渉力</div>
                         <p className="text-[10px] leading-snug text-slate-800">{fiveForces?.suppliers}</p>
                       </div>
                       <div className="bg-[#00205B] text-white p-3 rounded shadow-md flex flex-col justify-center text-center transform scale-105 z-10">
                         <div className="text-[11px] font-bold text-amber-400 mb-1">既存企業間の敵対関係</div>
                         <p className="text-[10px] leading-snug">{fiveForces?.rivalry}</p>
                       </div>
                       <div className="bg-white p-2 rounded border border-slate-200 shadow-sm flex flex-col justify-center">
                         <div className="text-[10px] font-bold text-slate-500 mb-1">買い手の交渉力</div>
                         <p className="text-[10px] leading-snug text-slate-800">{fiveForces?.buyers}</p>
                       </div>
                     </div>
                     <div className="col-start-2 bg-white p-2 rounded border border-slate-200 text-center shadow-sm">
                       <div className="text-[10px] font-bold text-slate-500 mb-1">代替品の脅威</div>
                       <p className="text-[10px] leading-snug text-slate-800">{fiveForces?.substitutes}</p>
                     </div>
                   </div>
                 </div>
              )}
            </div>
          </div>
        </div>"""

content = content.replace(old_page2, new_page2)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
