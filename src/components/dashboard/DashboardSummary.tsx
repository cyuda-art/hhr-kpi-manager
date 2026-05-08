"use client";

import { useKpiStore } from '@/store/useKpiStore';
import { useProjectStore } from '@/store/useProjectStore';
import { useOrgStore } from '@/store/useOrgStore';
import { DashboardCard } from './DashboardCard';
import { DetailDrawer } from '@/components/ui/DetailDrawer';
import { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Target, Activity, ChevronDown, ChevronUp, ListChecks, Sparkles } from 'lucide-react';

interface DashboardSummaryProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const DashboardSummary = ({ 
  isExpanded: controlledIsExpanded, 
  onToggleExpand 
}: DashboardSummaryProps = {}) => {
  const { kpiData, actions } = useKpiStore();
  const { currentProjectId, projects, updateProject } = useProjectStore();
  const { currentOrgId } = useOrgStore();
  const currentProject = projects.find(p => p.id === currentProjectId);

  const [drawerKpiId, setDrawerKpiId] = useState<string | null>(null);
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  const [aiThinking, setAiThinking] = useState<any>(null);

  // ローカルステートで入力値を管理（Firestoreへの過剰書き込みを防ぐため）
  const [localName, setLocalName] = useState('');
  const [localBusinessModel, setLocalBusinessModel] = useState('');
  const [localDescription, setLocalDescription] = useState('');

  // Firestoreのデータが降ってきたらローカルステートに同期（初期ロード時など）
  // 入力中の文字消えを防ぐため、現在のローカルステートとFirestoreの値が異なる場合のみ同期する
  useEffect(() => {
    if (currentProject) {
      if (localName === '' && currentProject.name) setLocalName(currentProject.name);
      if (localBusinessModel === '' && currentProject.businessModel) setLocalBusinessModel(currentProject.businessModel);
      if (localDescription === '' && currentProject.description) setLocalDescription(currentProject.description);
    }
  }, [currentProject]);

  // AIの推論プロセスを取得
  useEffect(() => {
    if (currentProjectId) {
      const stored = sessionStorage.getItem(`kpi_thinking_${currentProjectId}`);
      if (stored) {
        try {
          setAiThinking(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse AI thinking', e);
        }
      } else {
        setAiThinking(null);
      }
    }
  }, [currentProjectId]);

  // フォーカスが外れた（onBlur）タイミングで確実にFirestoreへ保存する
  const handleSaveToDB = () => {
    if (!currentProjectId || !currentProject) return;
    
    const updates: Partial<typeof currentProject> = {};
    let hasChanges = false;

    if (localName !== currentProject.name) {
      updates.name = localName;
      hasChanges = true;
    }
    if (localBusinessModel !== (currentProject.businessModel || '')) {
      updates.businessModel = localBusinessModel;
      hasChanges = true;
    }
    if (localDescription !== (currentProject.description || '')) {
      updates.description = localDescription;
      hasChanges = true;
    }

    if (hasChanges) {
      updateProject(currentProjectId, currentOrgId, updates);
    }
  };

  const isExpanded = controlledIsExpanded !== undefined ? controlledIsExpanded : internalIsExpanded;
  
  const handleToggle = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalIsExpanded(!internalIsExpanded);
    }
  };

  // データドリブンな集計
  const allNodes = Object.values(kpiData);
  
  if (allNodes.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center shadow-sm">
        <p className="text-slate-500 dark:text-slate-400">KPIデータがありません。オンボーディングまたはツリーからKPIを追加してください。</p>
      </div>
    );
  }

  // KGIとKPIを抽出
  const kgis = allNodes.filter(node => node.type === 'KGI' || node.parentId === null);
  const kpis = allNodes.filter(node => node.type === 'KPI' && node.parentId !== null);
  
  // 達成率が危険なKPIを抽出 (80%未満をアラートとする)
  const alertKpis = allNodes.filter(node => (node.achievementRate || 0) < 80);

  // 全体の平均達成率（KGIベース）
  const avgKgiAchievement = kgis.length > 0 
    ? kgis.reduce((sum, kgi) => sum + (kgi.achievementRate || 0), 0) / kgis.length
    : 0;

  // 部署別KSF(アクション)の集計
  // 部署別KSF(アクション)の集計
  const ksfByDept = actions.reduce((acc, action) => {
    const dept = action.department || '未設定';
    if (!acc[dept]) acc[dept] = { total: 0, done: 0 };
    acc[dept].total++;
    if (action.status === 'done') acc[dept].done++;
    return acc;
  }, {} as Record<string, { total: number; done: number }>);

  return (
    <div className="h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden transition-colors">
      {/* アコーディオンのヘッダー部分 */}
      <button 
        onClick={handleToggle}
        className="w-full flex-shrink-0 flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800/50"
      >
        <div className="flex items-center gap-6">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            ダッシュボード・サマリー
          </h2>
          
          {/* 折りたたみ時でも重要な指標だけは小さく見せる */}
          {!isExpanded && (
            <div className="flex items-center gap-6 text-xs font-bold animate-in fade-in">
              <div className="flex items-center gap-1.5 text-primary-600 dark:text-primary-400">
                <Target className="w-3.5 h-3.5" />
                <span>平均達成率: {Math.round(avgKgiAchievement)}%</span>
              </div>
              {alertKpis.length > 0 && (
                <div className="flex items-center gap-1.5 text-rose-500">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>要対応: {alertKpis.length}件</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="text-slate-400 hover:text-primary-600 transition-colors">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {/* 展開されるコンテンツ（高さを親に追従） */}
      <div className={`flex-1 min-h-0 overflow-y-auto transition-all duration-300 ease-in-out custom-scrollbar ${isExpanded ? 'opacity-100' : 'hidden'}`}>
        <div className="p-4 space-y-6">
          {/* プロジェクト・事業情報 */}
          <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
              <div className="w-1.5 h-4 bg-primary-500 rounded-full"></div>
              プロジェクト・事業情報
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">プロジェクト/事業名</label>
                <input 
                  type="text" 
                  value={localName} 
                  onChange={(e) => setLocalName(e.target.value)}
                  onBlur={handleSaveToDB}
                  placeholder="例：ホテル事業改革プロジェクト"
                  className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">ビジネスモデル/ターゲット層</label>
                <input 
                  type="text" 
                  value={localBusinessModel} 
                  onChange={(e) => setLocalBusinessModel(e.target.value)}
                  onBlur={handleSaveToDB}
                  placeholder="例：BtoC、富裕層向けインバウンド旅行客"
                  className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-slate-200"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">事業概要・特記事項（AIの分析精度を向上させます）</label>
                <textarea 
                  value={localDescription} 
                  onChange={(e) => setLocalDescription(e.target.value)}
                  onBlur={handleSaveToDB}
                  placeholder="例：現在、客単価は上がっているが稼働率が低下傾向にある。新規顧客の獲得が課題。"
                  rows={2}
                  className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-slate-200 resize-none"
                />
              </div>
            </div>
          </div>

          {/* AIの推論プロセス (存在する場合のみ) */}
          {aiThinking && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-5 border border-slate-700/50 shadow-lg text-slate-100">
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-primary-400">
                <Sparkles className="w-5 h-5" />
                AI戦略コンサルタントの推論レポート
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="bg-slate-800/50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                  <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">1. 環境認識（3Cの要約）</h4>
                  <p className="text-xs leading-relaxed text-slate-300">{aiThinking.environment_analysis || 'データなし'}</p>
                </div>
                <div className="bg-slate-800/50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                  <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">2. クロスSWOT分析の洞察</h4>
                  <p className="text-xs leading-relaxed text-slate-300">{aiThinking.cross_swot || 'データなし'}</p>
                </div>
                <div className="bg-slate-800/50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                  <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">3. KSF・KPI選定の理由</h4>
                  <p className="text-xs leading-relaxed text-slate-300">{aiThinking.ksf_reasons || 'データなし'}</p>
                </div>
              </div>
            </div>
          )}

          {/* サマリーハイライト */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-4 text-white shadow-lg shadow-primary-500/20">
              <div className="flex items-center gap-2 text-primary-100 mb-2">
                <Target className="w-5 h-5" />
                <span className="font-bold text-sm">主要KGI 平均達成率</span>
              </div>
              <div className="text-3xl font-black">{Math.round(avgKgiAchievement)}%</div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                <Activity className="w-4 h-4" />
                <span className="font-bold text-xs uppercase tracking-wider">総指標数</span>
              </div>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{allNodes.length} <span className="text-sm font-medium text-slate-400">ノード</span></div>
            </div>

            <div className={`rounded-2xl p-4 border flex flex-col justify-center ${alertKpis.length > 0 ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50'}`}>
              <div className={`flex items-center gap-2 mb-1 ${alertKpis.length > 0 ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>
                <AlertTriangle className="w-4 h-4" />
                <span className="font-bold text-xs uppercase tracking-wider">要対応（達成率80%未満）</span>
              </div>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{alertKpis.length} <span className="text-sm font-medium text-slate-400">件</span></div>
            </div>
          </div>

          {/* 指標カード一覧（横スクロール可能に） */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
              <div className="w-1.5 h-4 bg-primary-500 rounded-full"></div>
              すべての指標一覧
            </h3>
            <div className="flex overflow-x-auto pb-4 gap-4 snap-x custom-scrollbar">
              {/* KGIを先に、KPIを後に並べる */}
              {[...kgis, ...kpis].map((kpi) => (
                <div key={kpi.id} className="min-w-[280px] snap-start">
                  <DashboardCard kpi={kpi} onClick={() => setDrawerKpiId(kpi.id)} />
                </div>
              ))}
            </div>
          </div>

          {/* 部署別 KSF (重要施策) 進捗 */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-primary-500" />
              部署別 KSF (重要施策) 進捗状況
            </h3>
            
            {Object.keys(ksfByDept).length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">KSF(施策)がまだ登録されていません。ツリーからKPIを選択し、施策を追加してください。</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(ksfByDept).map(([dept, stats]) => {
                  const progress = Math.round((stats.done / stats.total) * 100) || 0;
                  return (
                    <div key={dept} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700/50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">{dept}</span>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{stats.done} / {stats.total} 完了</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mb-1">
                        <div 
                          className={`h-1.5 rounded-full ${progress === 100 ? 'bg-emerald-500' : progress >= 50 ? 'bg-primary-500' : 'bg-amber-500'}`} 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="text-right text-[10px] font-bold text-slate-400">{progress}%</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <DetailDrawer 
        isOpen={drawerKpiId !== null}
        onClose={() => setDrawerKpiId(null)}
        kpi={drawerKpiId ? kpiData[drawerKpiId] : null}
      />
    </div>
  );
};
