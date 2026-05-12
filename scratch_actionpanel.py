import re

file_path = "src/components/kpi-tree/ActionPanel.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace Bot import if missing
content = content.replace(
    "import { Sparkles, Trash2, Edit2, CheckCircle2, Circle, AlertTriangle, Lightbulb, Calculator, Link2, ArchiveRestore } from 'lucide-react';",
    "import { Sparkles, Trash2, Edit2, CheckCircle2, Circle, AlertTriangle, Lightbulb, Calculator, Link2, ArchiveRestore, MessageSquare, Bot, Loader2 } from 'lucide-react';"
)

# Replace activeTab state
content = content.replace(
    "const [activeTab, setActiveTab] = useState<'details' | 'tasks'>('details');",
    "const [activeTab, setActiveTab] = useState<'details' | 'tasks' | 'ai'>('details');"
)

# Replace tab buttons
old_tabs = """        <div className="flex bg-slate-100 dark:bg-[#202124] p-1 mx-4 mt-4 rounded-lg">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'details' ? 'bg-white dark:bg-[#3c4043] text-primary-600 dark:text-[#8ab4f8] shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-[#9aa0a6] dark:hover:text-[#e8eaed]'}`}
          >
            詳細 (Details)
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'tasks' ? 'bg-white dark:bg-[#3c4043] text-primary-600 dark:text-[#8ab4f8] shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-[#9aa0a6] dark:hover:text-[#e8eaed]'}`}
          >
            マイタスク
            {selectedKpiTasks.length > 0 && (
              <span className="bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 px-1.5 py-0.5 rounded-full text-[10px]">
                {selectedKpiTasks.filter(t => t.status === 'todo').length}
              </span>
            )}
          </button>
        </div>"""

new_tabs = """        <div className="flex bg-slate-100 dark:bg-[#202124] p-1 mx-4 mt-4 rounded-lg overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 whitespace-nowrap py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'details' ? 'bg-white dark:bg-[#3c4043] text-primary-600 dark:text-[#8ab4f8] shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-[#9aa0a6] dark:hover:text-[#e8eaed]'}`}
          >
            詳細 (Details)
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 whitespace-nowrap flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'tasks' ? 'bg-white dark:bg-[#3c4043] text-primary-600 dark:text-[#8ab4f8] shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-[#9aa0a6] dark:hover:text-[#e8eaed]'}`}
          >
            マイタスク
            {selectedKpiTasks.length > 0 && (
              <span className="bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 px-1.5 py-0.5 rounded-full text-[10px]">
                {selectedKpiTasks.filter(t => t.status === 'todo').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 whitespace-nowrap flex items-center justify-center gap-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'ai' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-[#9aa0a6] dark:hover:text-[#e8eaed]'}`}
          >
            <Sparkles size={12} />
            AI Copilot
          </button>
        </div>"""

content = content.replace(old_tabs, new_tabs)

# Add AI Tab content logic
# First find where the tabs are rendered. It's inside `<div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6">`
# Let's add state for AI Chat
ai_states = """  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const handleAiReconstruct = async () => {
    if (!aiPrompt.trim() || !currentProject) return;
    setIsAiProcessing(true);
    try {
      const res = await fetch('/api/reconstruct-tree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          kpiData: kpiData,
          manifesto: currentProject.manifesto,
          swot: currentProject.swot,
          crossSwot: currentProject.crossSwot
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // 取得した新しいKPIデータを一括更新
      // （※本来はstoreにsetKpiDataBulkなどを生やすべきですが、今回は簡易的に全消し＆追加か、個別にupdateをかけます。
      // ただしuseKpiStore.setState()が使えないため、一旦storeに追加するなどの対応が必要です。
      // ここではstoreのkpiDataを直接書き換えるためのメソッドを呼ぶ想定ですが、ActionPanelから直接変更する方法として、
      // ひとまず `useKpiStore.getState().kpiData = data.kpiData; useKpiStore.getState().recalculateTree...` は直接触れないので、
      // storeに `overwriteKpiData` メソッドを追加して呼び出すようにします）
      useKpiStore.setState({ kpiData: data.kpiData });
      alert('AIによるツリーの再構築が完了しました！');
      setAiPrompt('');
    } catch (error: any) {
      console.error(error);
      alert('再構築に失敗しました: ' + error.message);
    } finally {
      setIsAiProcessing(false);
    }
  };"""

content = content.replace(
    "const [isReviveModalOpen, setIsReviveModalOpen] = useState(false);",
    "const [isReviveModalOpen, setIsReviveModalOpen] = useState(false);\n" + ai_states
)

ai_tab_ui = """        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">AI Strategy Copilot</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    現在のツリー構成やSWOT分析に基づいて、ツリーの動的な再編（再構築）を行います。
                    例：「もっと攻めの戦略に変えて」「プロセス階層を顧客体験中心に再編して」
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="AIへの指示を記述してください..."
                className="w-full h-32 p-3 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none"
              />
              <button
                onClick={handleAiReconstruct}
                disabled={isAiProcessing || !aiPrompt.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
              >
                {isAiProcessing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {isAiProcessing ? 'AIがツリーを再構築中...' : 'ツリーを再編する'}
              </button>
            </div>
          </div>
        )}"""

content = content.replace(
    "{activeTab === 'details' && (",
    ai_tab_ui + "\n        {activeTab === 'details' && ("
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
