"use client";

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrgStore } from '@/store/useOrgStore';
import { useProjectStore } from '@/store/useProjectStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useKpiStore } from '@/store/useKpiStore';
import { Users, Shield, Link2, Copy, Check } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { organizations, currentOrgId } = useOrgStore();
  const { projects } = useProjectStore();
  
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'project-info' | 'members' | 'theme'>('project-info');
  
  const currentOrg = organizations.find(org => org.id === currentOrgId);
  const { currentProjectId, updateProject } = useProjectStore();
  const currentProject = projects.find(p => p.id === currentProjectId);

  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectMvv, setProjectMvv] = useState('');
  const [goodThreshold, setGoodThreshold] = useState(100);
  const [warningThreshold, setWarningThreshold] = useState(80);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (currentProject) {
      setProjectName(currentProject.name || '');
      setProjectDesc(currentProject.description || '');
      setProjectMvv(currentProject.mvv || '');
      if (currentProject.statusThresholds) {
        setGoodThreshold(currentProject.statusThresholds.good);
        setWarningThreshold(currentProject.statusThresholds.warning);
      }
    }
  }, [currentProject]);

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProjectId || !currentOrgId) return;
    setIsUpdating(true);
    try {
      await updateProject(currentProjectId, currentOrgId, {
        name: projectName,
        description: projectDesc,
        mvv: projectMvv,
        statusThresholds: {
          good: goodThreshold,
          warning: warningThreshold
        }
      });
      useKpiStore.getState().setProjectInfo({
        name: projectName,
        description: projectDesc,
        mvv: projectMvv,
        statusThresholds: {
          good: goodThreshold,
          warning: warningThreshold
        }
      });
      alert('プロジェクト情報を更新しました');
    } catch (error) {
      console.error(error);
      alert('更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };
  const { themeColor, setThemeColor } = useLayoutStore();

  const themes = [
    { id: 'indigo', name: 'デフォルト (Indigo)', colors: ['#eef2ff', '#a5b4fc', '#6366f1', '#3730a3'] },
    { id: 'ocean', name: 'オーシャン (Cyan/Blue)', colors: ['#ecfeff', '#67e8f9', '#06b6d4', '#155e75'] },
    { id: 'forest', name: 'フォレスト (Emerald)', colors: ['#ecfdf5', '#6ee7b7', '#10b981', '#065f46'] },
    { id: 'sunset', name: 'サンセット (Rose/Orange)', colors: ['#fff1f2', '#fda4af', '#f43f5e', '#9f1239'] },
    { id: 'midnight', name: 'ミッドナイト (Fuchsia)', colors: ['#fdf4ff', '#f0abfc', '#d946ef', '#86198f'] },
  ];

  const handleCopyInviteLink = () => {
    if (!currentOrgId) return;
    const url = `${window.location.origin}/invite-org/${currentOrgId}`;
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  if (!currentOrg) {
    return <div className="p-8">組織情報を読み込み中...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-300">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-oxford-navy dark:text-slate-200">組織設定</h1>
        <p className="text-logic-slate dark:text-slate-400 mt-1">「{currentOrg.name}」のメンバーと権限を管理します</p>
      </div>

      <div className="flex gap-4 mb-8 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('project-info')}
          className={`pb-4 px-4 font-bold text-sm transition-colors whitespace-nowrap border-b-2 ${activeTab === 'project-info' ? 'border-strategic-teal text-strategic-teal dark:border-primary-400 dark:text-primary-400' : 'border-transparent text-logic-slate dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          プロジェクト基本情報
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`pb-4 px-4 font-bold text-sm transition-colors whitespace-nowrap border-b-2 ${activeTab === 'members' ? 'border-strategic-teal text-strategic-teal dark:border-primary-400 dark:text-primary-400' : 'border-transparent text-logic-slate dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          メンバー管理
        </button>
        <button
          onClick={() => setActiveTab('theme')}
          className={`pb-4 px-4 font-bold text-sm transition-colors whitespace-nowrap border-b-2 ${activeTab === 'theme' ? 'border-strategic-teal text-strategic-teal dark:border-primary-400 dark:text-primary-400' : 'border-transparent text-logic-slate dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          テーマカラー
        </button>
      </div>

      {activeTab === 'project-info' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-6 md:p-8">
          <h2 className="text-lg font-bold text-oxford-navy dark:text-slate-200 mb-6">プロジェクト基本情報の更新</h2>
          <form onSubmit={handleUpdateProject} className="space-y-6 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">プロジェクト名</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-4 py-2 bg-clean-canvas dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-strategic-teal"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">説明（任意）</label>
              <textarea
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                className="w-full px-4 py-2 bg-clean-canvas dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-strategic-teal resize-none h-24"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">MVV・制約条件</label>
              <textarea
                value={projectMvv}
                onChange={(e) => setProjectMvv(e.target.value)}
                className="w-full px-4 py-2 bg-clean-canvas dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-strategic-teal resize-none h-24"
              />
              <p className="text-xs text-logic-slate dark:text-slate-400 mt-2">※ここを変更しても、すでに生成されたKPIツリーには反映されません。今後新しくKPIをAI生成する際の基準として保存されます。</p>
            </div>
            
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">ステータス表示の基準値 (%)</h3>
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-2">
                    <div className="w-3 h-1 bg-[#34d399] rounded-full"></div>順調 (Good)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={goodThreshold}
                      onChange={(e) => setGoodThreshold(Number(e.target.value))}
                      className="w-full px-4 py-2 bg-clean-canvas dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-strategic-teal"
                      required
                    />
                    <span className="text-sm font-bold text-slate-500">% 以上</span>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-2">
                    <div className="w-3 h-1 bg-[#fbbf24] rounded-full"></div>注意 (Warning)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={warningThreshold}
                      onChange={(e) => setWarningThreshold(Number(e.target.value))}
                      className="w-full px-4 py-2 bg-clean-canvas dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-strategic-teal"
                      required
                    />
                    <span className="text-sm font-bold text-slate-500">% 以上</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-logic-slate dark:text-slate-400 mt-2">
                ※「順調」と「注意」の基準値を設定します。「注意」未満の場合は自動的に「ボトルネック（赤）」となります。
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="submit"
                disabled={isUpdating}
                className="px-6 py-2.5 bg-strategic-teal hover:bg-strategic-teal text-white rounded-lg font-bold transition-all disabled:opacity-50"
              >
                {isUpdating ? '保存中...' : '変更を保存'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-clean-canvas dark:bg-slate-900/50 dark:bg-slate-800/50 flex justify-between items-center">
                <h2 className="font-bold text-oxford-navy dark:text-slate-200 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-500" />
                  組織メンバー ({currentOrg.members.length}名)
                </h2>
              </div>
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentOrg.members.map((member, idx) => (
                  <li key={idx} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-strategic-teal dark:text-primary-300 font-bold">
                        {member.userId === user?.uid ? 'You' : 'M'}
                      </div>
                      <div>
                        <p className="font-bold text-oxford-navy dark:text-slate-200 text-sm">
                          {member.userId === user?.uid ? 'あなた' : `User (${member.userId.substring(0, 8)}...)`}
                        </p>
                        <p className="text-xs text-logic-slate dark:text-slate-400">参加日: {new Date(member.joinedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${member.role === 'admin' ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800' : 'bg-slate-100 text-logic-slate dark:text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}>
                        {member.role.toUpperCase()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-6 border border-primary-100 dark:border-primary-800/50">
              <h3 className="font-bold text-primary-900 dark:text-primary-100 mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary-500" />
                新しいメンバーを招待
              </h3>
              <p className="text-sm text-strategic-teal/80 dark:text-primary-300/80 mb-6">
                招待リンクをコピーして、チームメンバーに共有してください。リンクから参加したユーザーは初期権限として「Viewer」になります。
              </p>
              <button
                onClick={handleCopyInviteLink}
                className="w-full flex items-center justify-center gap-2 bg-strategic-teal hover:bg-strategic-teal text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary-600/30"
              >
                {isCopied ? <Check size={18} /> : <Copy size={18} />}
                {isCopied ? 'コピー完了！' : '招待リンクをコピー'}
              </button>
            </div>
          </div>
        </div>
      )}



      {activeTab === 'theme' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-clean-canvas dark:bg-slate-900/50 dark:bg-slate-800/50">
              <h2 className="font-bold text-oxford-navy dark:text-slate-200">テーマカラーを選択</h2>
              <p className="text-xs text-logic-slate dark:text-slate-400 mt-1">Colorion風のカラーパレットからお好みのスタイルを選択してください。</p>
            </div>
            <div className="p-6 space-y-6">
              {themes.map(theme => (
                <div 
                  key={theme.id}
                  onClick={() => setThemeColor(theme.id)}
                  className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border-2 ${
                    themeColor === theme.id 
                      ? 'border-strategic-teal bg-primary-50 dark:bg-primary-900/20' 
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      {theme.colors.map((color, i) => (
                        <div 
                          key={i} 
                          className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{theme.name}</span>
                  </div>
                  {themeColor === theme.id && (
                    <div className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center">
                      <Check size={14} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h3 className="font-bold text-oxford-navy dark:text-slate-200 mb-4">プレビュー</h3>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800">
                  <h4 className="text-primary-800 dark:text-primary-200 font-bold text-sm mb-1">プライマリー背景</h4>
                  <p className="text-strategic-teal dark:text-primary-400 text-xs">テキストの視認性を確認します。</p>
                </div>
                
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-primary-500 hover:bg-strategic-teal text-white rounded-lg font-bold text-sm transition-colors shadow-lg shadow-primary-500/30">
                    メインボタン
                  </button>
                  <button className="px-4 py-2 bg-primary-100 dark:bg-primary-900/50 text-strategic-teal dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800/50 rounded-lg font-bold text-sm transition-colors">
                    サブボタン
                  </button>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300">達成率</span>
                    <span className="text-strategic-teal dark:text-primary-400 font-bold">75%</span>
                  </div>
                  <div className="w-full bg-clean-canvas dark:bg-slate-800 rounded-full h-2">
                    <div className="bg-primary-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
