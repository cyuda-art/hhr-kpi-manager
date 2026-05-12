import re

file_path = "src/app/[orgId]/settings/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace the icon imports to include the ones we need for the UI
content = content.replace(
    "import { Settings, Users, Link as LinkIcon, Check, Copy, Save, Building2, Globe, Sparkles, Loader2 } from 'lucide-react';",
    "import { Settings, Users, Link as LinkIcon, Check, Copy, Save, Building2, Globe, Sparkles, Loader2, Landmark, TrendingUp, Users2, Cpu, Swords, ShieldAlert, Replace, Truck, ShoppingCart, Gem, Star, Lock, LayoutTemplate } from 'lucide-react';"
)

old_ui = """            {currentOrg.pest && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 h-64 overflow-y-auto">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3 sticky top-0 bg-slate-50 dark:bg-slate-900 py-1 border-b border-slate-200 dark:border-slate-700">PEST分析</h3>
                  <div className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 font-medium">{currentOrg.pest}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 h-64 overflow-y-auto">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3 sticky top-0 bg-slate-50 dark:bg-slate-900 py-1 border-b border-slate-200 dark:border-slate-700">5フォース分析</h3>
                  <div className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 font-medium">{currentOrg.fiveForces}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 h-64 overflow-y-auto">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3 sticky top-0 bg-slate-50 dark:bg-slate-900 py-1 border-b border-slate-200 dark:border-slate-700">VRIO分析</h3>
                  <div className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 font-medium">{currentOrg.vrio}</div>
                </div>
              </div>
            )}"""

new_ui = """            {currentOrg.pest && (() => {
              const parseFramework = (dataStr: string | undefined) => {
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

              return (
                <div className="mt-10 space-y-12">
                  {/* PEST Analysis */}
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 border-b-2 border-primary-500 pb-2 inline-flex">
                      PEST分析 <span className="text-sm font-normal text-slate-500 ml-2">マクロ環境</span>
                    </h3>
                    {pest?.raw ? (
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                        {pest.raw}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-rose-50 dark:bg-rose-900/10 p-5 rounded-xl border border-rose-100 dark:border-rose-900/30">
                          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold mb-3"><Landmark size={18}/> Politics (政治)</div>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{pest?.politics}</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-900/30">
                          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold mb-3"><TrendingUp size={18}/> Economy (経済)</div>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{pest?.economy}</p>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold mb-3"><Users2 size={18}/> Society (社会)</div>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{pest?.society}</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/10 p-5 rounded-xl border border-purple-100 dark:border-purple-900/30">
                          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-bold mb-3"><Cpu size={18}/> Technology (技術)</div>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{pest?.technology}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 5 Forces Analysis */}
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 border-b-2 border-indigo-500 pb-2 inline-flex">
                      5フォース分析 <span className="text-sm font-normal text-slate-500 ml-2">業界構造</span>
                    </h3>
                    {fiveForces?.raw ? (
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                        {fiveForces.raw}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-start-2 bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/40 text-center relative z-10 shadow-sm">
                          <div className="flex items-center justify-center gap-2 text-indigo-800 dark:text-indigo-400 font-bold mb-2"><ShieldAlert size={16}/> 新規参入の脅威</div>
                          <p className="text-xs text-slate-700 dark:text-slate-300">{fiveForces?.newEntrants}</p>
                        </div>
                        
                        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold mb-2"><Truck size={16}/> 売り手の交渉力</div>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{fiveForces?.suppliers}</p>
                          </div>
                          <div className="bg-slate-800 dark:bg-slate-700 text-white p-5 rounded-xl shadow-md border border-slate-700 transform scale-105 z-20 flex flex-col justify-center">
                            <div className="flex items-center justify-center gap-2 font-bold mb-3 text-center"><Swords size={20} className="text-amber-400"/> 既存企業間の敵対関係</div>
                            <p className="text-xs text-slate-200 text-center">{fiveForces?.rivalry}</p>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold mb-2"><ShoppingCart size={16}/> 買い手の交渉力</div>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{fiveForces?.buyers}</p>
                          </div>
                        </div>

                        <div className="md:col-start-2 bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/40 text-center relative z-10 shadow-sm">
                          <div className="flex items-center justify-center gap-2 text-indigo-800 dark:text-indigo-400 font-bold mb-2"><Replace size={16}/> 代替品の脅威</div>
                          <p className="text-xs text-slate-700 dark:text-slate-300">{fiveForces?.substitutes}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* VRIO Analysis */}
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 border-b-2 border-teal-500 pb-2 inline-flex">
                      VRIO分析 <span className="text-sm font-normal text-slate-500 ml-2">競争優位性</span>
                    </h3>
                    {vrio?.raw ? (
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                        {vrio.raw}
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 bg-white dark:bg-slate-800 p-4 rounded-xl border-l-4 border-l-amber-400 shadow-sm">
                          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold mb-2"><Gem size={16}/> Value <span className="text-xs font-normal text-slate-400">(経済的価値)</span></div>
                          <p className="text-xs text-slate-700 dark:text-slate-300">{vrio?.value}</p>
                        </div>
                        <div className="flex-1 bg-white dark:bg-slate-800 p-4 rounded-xl border-l-4 border-l-rose-400 shadow-sm">
                          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold mb-2"><Star size={16}/> Rarity <span className="text-xs font-normal text-slate-400">(希少性)</span></div>
                          <p className="text-xs text-slate-700 dark:text-slate-300">{vrio?.rarity}</p>
                        </div>
                        <div className="flex-1 bg-white dark:bg-slate-800 p-4 rounded-xl border-l-4 border-l-purple-400 shadow-sm">
                          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold mb-2"><Lock size={16}/> Imitability <span className="text-xs font-normal text-slate-400">(模倣困難性)</span></div>
                          <p className="text-xs text-slate-700 dark:text-slate-300">{vrio?.imitability}</p>
                        </div>
                        <div className="flex-1 bg-white dark:bg-slate-800 p-4 rounded-xl border-l-4 border-l-blue-400 shadow-sm">
                          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold mb-2"><LayoutTemplate size={16}/> Organization <span className="text-xs font-normal text-slate-400">(組織)</span></div>
                          <p className="text-xs text-slate-700 dark:text-slate-300">{vrio?.organization}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}"""

content = content.replace(old_ui, new_ui)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
