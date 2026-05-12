"use client";

import { useProjectStore } from '@/store/useProjectStore';
import { useOrgStore } from '@/store/useOrgStore';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Printer, ChevronLeft, Building2, Target, Crosshair, BarChart, FileText, Landmark, TrendingUp, Users2, Cpu, Swords, ShieldAlert, Replace, Truck, ShoppingCart, Gem, Star, Lock, LayoutTemplate } from 'lucide-react';
import { useKpiStore } from '@/store/useKpiStore';

export default function StrategicReportPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const orgId = params.orgId as string;
  
  const { projects } = useProjectStore();
  const { organizations, currentOrgId } = useOrgStore();
  const { kpiData, initializeDB } = useKpiStore();
  
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (projectId && orgId) {
      initializeDB(projectId, orgId);
    }
  }, [projectId, orgId, initializeDB]);

  if (!isMounted) return null;

  const currentProject = projects.find(p => p.id === projectId);
  const currentOrg = organizations.find(o => o.id === (currentOrgId || orgId));

  if (!currentProject || !currentOrg) {
    return <div className="p-8 text-center">Loading Data...</div>;
  }

  const handlePrint = () => {
    window.print();
  };

  // KPIの中からKGIを抽出
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

const kgiNodes = Object.values(kpiData).filter(n => n.type === 'KGI');
  const mainKgi = kgiNodes.length > 0 ? kgiNodes[0] : null;

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white font-sans text-oxford-navy dark:text-slate-200">
      {/* 画面用ナビゲーションバー（印刷時は非表示） */}
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between print:hidden shadow-sm">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-logic-slate dark:text-slate-400 hover:text-oxford-navy dark:text-slate-200 font-medium transition-colors"
        >
          <ChevronLeft size={20} />
          戻る
        </button>
        <div className="flex items-center gap-4">
          <span className="text-sm text-logic-slate dark:text-slate-400">※A4サイズ・横向き・背景のグラフィックをONにして印刷してください</span>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#00205B] hover:bg-[#00153D] text-white rounded-lg font-bold transition-all shadow-md"
          >
            <Printer size={18} />
            PDFとして出力 (Print)
          </button>
        </div>
      </div>

      {/* レポート本文（印刷フォーマット） */}
      <div className="max-w-[1123px] mx-auto bg-white print:shadow-none shadow-xl my-8 print:my-0">
        
        {/* --- Page 1: Cover & Executive Summary --- */}
        <div className="page-break-after p-16 min-h-[794px] flex flex-col relative overflow-hidden bg-gradient-to-br from-[#00205B] to-[#003B73] text-white">
          {/* 装飾 */}
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <Building2 size={400} />
          </div>
          <div className="absolute bottom-0 left-0 p-12 opacity-10 pointer-events-none">
            <Target size={300} />
          </div>

          <div className="relative z-10 flex-1 flex flex-col justify-center">
            <div className="mb-8">
              <span className="px-4 py-1 border border-teal-400 text-teal-400 font-bold tracking-widest text-sm rounded-full">
                STRATEGIC MASTER PLAN
              </span>
            </div>
            <h1 className="text-5xl font-extrabold leading-tight mb-6">
              {currentProject.name} <br />
              <span className="text-[#00A3A1]">戦略再構築プロジェクト</span>
            </h1>
            <p className="text-xl text-slate-300 font-light mb-16 max-w-3xl">
              {currentProject.description || '本レポートは、マクロ環境からミクロの事業特性までを統合分析し、KGI達成に向けた具体的かつ数学的な戦略アプローチを定義するものです。'}
            </p>

            <div className="mt-auto grid grid-cols-2 gap-8 pt-8 border-t border-white/20">
              <div>
                <p className="text-sm text-slate-400 uppercase tracking-widest mb-1">Organization</p>
                <p className="text-xl font-bold">{currentOrg.name}</p>
                <p className="text-sm text-slate-300 mt-1">{currentOrg.industry}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 uppercase tracking-widest mb-1">Target KGI</p>
                <p className="text-xl font-bold">{mainKgi ? mainKgi.name : currentProject.kgiType}</p>
                <p className="text-2xl text-[#00A3A1] font-extrabold mt-1">
                  {mainKgi ? mainKgi.targetValue?.toLocaleString() : currentProject.kgiTargetValue?.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* --- Page 2: Macro Environment (Compass) --- */}
        <div className="page-break-after p-16 min-h-[794px] bg-white relative flex flex-col">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-[#00205B] shrink-0">
            <div className="w-12 h-12 bg-[#00205B] text-white flex items-center justify-center rounded-lg">
              <Crosshair size={24} />
            </div>
            <h2 className="text-3xl font-extrabold text-[#00205B]">経営環境と強みの源泉 (Compass)</h2>
          </div>

          <div className="space-y-6 flex-1 flex flex-col">
            <div className="bg-clean-canvas dark:bg-slate-900 p-4 rounded-xl border-l-4 border-[#00A3A1] shrink-0">
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
                  <div className="bg-clean-canvas dark:bg-slate-900 p-4 rounded-xl text-[12px] whitespace-pre-wrap flex-1">{pest.raw}</div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 flex-1">
                    <div className="bg-rose-50 p-3 rounded-lg border border-rose-100 flex flex-col">
                      <div className="flex items-center gap-1.5 text-rose-700 font-bold mb-1.5 text-[11px]"><Landmark size={14}/> Politics</div>
                      <p className="text-[10px] text-slate-700 leading-relaxed flex-1">{pest?.politics}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex flex-col">
                      <div className="flex items-center gap-1.5 text-strategic-teal font-bold mb-1.5 text-[11px]"><TrendingUp size={14}/> Economy</div>
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
                  <div className="bg-clean-canvas dark:bg-slate-900 p-4 rounded-xl text-[12px] whitespace-pre-wrap flex-1">{vrio.raw}</div>
                ) : (
                  <div className="flex flex-col gap-3 flex-1">
                    <div className="flex items-stretch bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-1">
                      <div className="w-12 bg-[#00205B] text-white flex items-center justify-center font-bold text-xl shrink-0">V</div>
                      <div className="p-3 flex-1 flex flex-col justify-center">
                        <div className="text-[10px] font-bold text-logic-slate dark:text-slate-400 mb-0.5">Value (経済的価値)</div>
                        <p className="text-[11px] text-oxford-navy dark:text-slate-200 leading-snug">{vrio?.value}</p>
                      </div>
                    </div>
                    <div className="flex items-stretch bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-1">
                      <div className="w-12 bg-[#003B73] text-white flex items-center justify-center font-bold text-xl shrink-0">R</div>
                      <div className="p-3 flex-1 flex flex-col justify-center">
                        <div className="text-[10px] font-bold text-logic-slate dark:text-slate-400 mb-0.5">Rarity (希少性)</div>
                        <p className="text-[11px] text-oxford-navy dark:text-slate-200 leading-snug">{vrio?.rarity}</p>
                      </div>
                    </div>
                    <div className="flex items-stretch bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-1">
                      <div className="w-12 bg-[#00A3A1] text-white flex items-center justify-center font-bold text-xl shrink-0">I</div>
                      <div className="p-3 flex-1 flex flex-col justify-center">
                        <div className="text-[10px] font-bold text-logic-slate dark:text-slate-400 mb-0.5">Imitability (模倣困難性)</div>
                        <p className="text-[11px] text-oxford-navy dark:text-slate-200 leading-snug">{vrio?.imitability}</p>
                      </div>
                    </div>
                    <div className="flex items-stretch bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-1">
                      <div className="w-12 bg-[#66C2C2] text-white flex items-center justify-center font-bold text-xl shrink-0">O</div>
                      <div className="p-3 flex-1 flex flex-col justify-center">
                        <div className="text-[10px] font-bold text-logic-slate dark:text-slate-400 mb-0.5">Organization (組織)</div>
                        <p className="text-[11px] text-oxford-navy dark:text-slate-200 leading-snug">{vrio?.organization}</p>
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
                 <div className="bg-clean-canvas dark:bg-slate-900 p-4 rounded-xl text-[12px] whitespace-pre-wrap">{fiveForces.raw}</div>
              ) : (
                 <div className="bg-clean-canvas dark:bg-slate-900 p-4 rounded-xl border border-slate-200">
                   <div className="grid grid-cols-3 gap-2">
                     <div className="col-start-2 bg-white p-2 rounded border border-slate-200 text-center shadow-sm">
                       <div className="text-[10px] font-bold text-logic-slate dark:text-slate-400 mb-1">新規参入の脅威</div>
                       <p className="text-[10px] leading-snug text-oxford-navy dark:text-slate-200">{fiveForces?.newEntrants}</p>
                     </div>
                     <div className="col-span-3 grid grid-cols-3 gap-2">
                       <div className="bg-white p-2 rounded border border-slate-200 shadow-sm flex flex-col justify-center">
                         <div className="text-[10px] font-bold text-logic-slate dark:text-slate-400 mb-1">売り手の交渉力</div>
                         <p className="text-[10px] leading-snug text-oxford-navy dark:text-slate-200">{fiveForces?.suppliers}</p>
                       </div>
                       <div className="bg-[#00205B] text-white p-3 rounded shadow-md flex flex-col justify-center text-center transform scale-105 z-10">
                         <div className="text-[11px] font-bold text-amber-400 mb-1">既存企業間の敵対関係</div>
                         <p className="text-[10px] leading-snug">{fiveForces?.rivalry}</p>
                       </div>
                       <div className="bg-white p-2 rounded border border-slate-200 shadow-sm flex flex-col justify-center">
                         <div className="text-[10px] font-bold text-logic-slate dark:text-slate-400 mb-1">買い手の交渉力</div>
                         <p className="text-[10px] leading-snug text-oxford-navy dark:text-slate-200">{fiveForces?.buyers}</p>
                       </div>
                     </div>
                     <div className="col-start-2 bg-white p-2 rounded border border-slate-200 text-center shadow-sm">
                       <div className="text-[10px] font-bold text-logic-slate dark:text-slate-400 mb-1">代替品の脅威</div>
                       <p className="text-[10px] leading-snug text-oxford-navy dark:text-slate-200">{fiveForces?.substitutes}</p>
                     </div>
                   </div>
                 </div>
              )}
            </div>
          </div>
        </div>

        {/* --- Page 3: Micro Environment & Strategy (Map) --- */}
        <div className="page-break-after p-16 min-h-[794px] bg-white relative">
          <div className="flex items-center gap-4 mb-10 pb-4 border-b-2 border-[#00205B]">
            <div className="w-12 h-12 bg-[#00205B] text-white flex items-center justify-center rounded-lg">
              <FileText size={24} />
            </div>
            <h2 className="text-3xl font-extrabold text-[#00205B]">事業特性と戦略マニフェスト (Map)</h2>
          </div>

          <div className="grid grid-cols-12 gap-8 h-full">
            {/* 左側: SWOT */}
            <div className="col-span-5 flex flex-col gap-6">
              <div className="flex-1 bg-clean-canvas dark:bg-slate-900 p-6 rounded-xl border border-slate-200">
                <h3 className="text-sm font-bold text-logic-slate dark:text-slate-400 uppercase tracking-widest mb-3">SWOT Analysis</h3>
                <div className="text-[12px] leading-relaxed whitespace-pre-wrap text-slate-700 h-[220px] overflow-hidden">
                  {currentProject.swot || 'SWOT分析データがありません'}
                </div>
              </div>
              <div className="flex-1 bg-[#00205B] text-white p-6 rounded-xl">
                <h3 className="text-sm font-bold text-[#00A3A1] uppercase tracking-widest mb-3">Cross-SWOT Directions</h3>
                <div className="text-[12px] leading-relaxed whitespace-pre-wrap text-slate-200 h-[220px] overflow-hidden">
                  {currentProject.crossSwot || 'クロスSWOTデータがありません'}
                </div>
              </div>
            </div>

            {/* 右側: Manifesto */}
            <div className="col-span-7 flex flex-col">
              <h3 className="text-xl font-bold text-[#00205B] mb-6 border-b border-slate-200 pb-2">採択された戦略シナリオ (Project Manifesto)</h3>
              
              {currentProject.manifesto ? (
                <div className="bg-gradient-to-br from-slate-50 to-teal-50 border-2 border-teal-100 p-8 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500 opacity-5 rounded-bl-full" />
                  
                  <div className="relative z-10">
                    <span className="inline-flex items-center justify-center px-3 py-1 bg-[#00A3A1] text-white text-[10px] font-bold uppercase tracking-widest rounded-full mb-4">
                      Primary Strategy
                    </span>
                    
                    <h4 className="text-2xl font-extrabold text-oxford-navy dark:text-slate-200 mb-4 leading-tight">
                      {currentProject.manifesto.split('\n')[0]}
                    </h4>
                    
                    <p className="text-[15px] leading-loose text-slate-700 font-medium whitespace-pre-wrap">
                      {currentProject.manifesto.split('\n').slice(1).join('\n')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-logic-slate dark:text-slate-400 bg-clean-canvas dark:bg-slate-900 rounded-xl">マニフェストが設定されていません</div>
              )}
            </div>
          </div>
        </div>

        {/* --- Page 4: KPI Dashboard Data List --- */}
        <div className="p-16 min-h-[794px] bg-white relative">
          <div className="flex items-center gap-4 mb-10 pb-4 border-b-2 border-[#00205B]">
            <div className="w-12 h-12 bg-[#00205B] text-white flex items-center justify-center rounded-lg">
              <Target size={24} />
            </div>
            <h2 className="text-3xl font-extrabold text-[#00205B]">重要管理指標リスト (Dashboard Base)</h2>
          </div>

          <div className="bg-clean-canvas dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-white uppercase bg-[#00205B]">
                <tr>
                  <th className="px-6 py-4 rounded-tl-xl">種別</th>
                  <th className="px-6 py-4">指標名</th>
                  <th className="px-6 py-4">定性目標</th>
                  <th className="px-6 py-4 text-right rounded-tr-xl">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                {Object.values(kpiData).filter(n => n.type === 'KGI').map(node => (
                  <tr key={node.id} className="bg-teal-50">
                    <td className="px-6 py-4 font-bold text-[#00A3A1]">KGI</td>
                    <td className="px-6 py-4 font-bold text-oxford-navy dark:text-slate-200">{node.name}</td>
                    <td className="px-6 py-4 text-xs">{node.qualitativeName || '-'}</td>
                    <td className="px-6 py-4 text-right font-bold">{node.targetValue?.toLocaleString()}{node.unit}</td>
                  </tr>
                ))}
                {Object.values(kpiData).filter(n => n.type === 'KPI').slice(0, 15).map(node => (
                  <tr key={node.id} className="hover:bg-slate-100 transition-colors">
                    <td className="px-6 py-3 font-bold text-logic-slate dark:text-slate-400">KPI</td>
                    <td className="px-6 py-3">{node.name}</td>
                    <td className="px-6 py-3 text-xs text-logic-slate dark:text-slate-400">{node.qualitativeName || '-'}</td>
                    <td className="px-6 py-3 text-right">{node.targetValue?.toLocaleString()}{node.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {Object.values(kpiData).length > 15 && (
              <div className="p-4 text-center text-xs text-logic-slate dark:text-slate-400 bg-white border-t border-slate-200">
                他 {Object.values(kpiData).length - 15} 件の指標が定義されています
              </div>
            )}
          </div>
          
          <div className="mt-12 p-6 bg-slate-100 rounded-xl flex items-center justify-between">
            <div className="text-sm font-bold text-logic-slate dark:text-slate-400">Generated by LogicTree Pro AI</div>
            <div className="text-sm font-bold text-logic-slate dark:text-slate-400">{new Date().toLocaleDateString('ja-JP')}</div>
          </div>
        </div>

      </div>

      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .page-break-after {
            page-break-after: always;
          }
          @page {
            size: A4 landscape;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
