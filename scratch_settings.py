import re

file_path = "src/app/[orgId]/settings/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add imports
content = content.replace(
    "import { Settings, Users, Link as LinkIcon, Check, Copy, Save, Building2 } from 'lucide-react';",
    "import { Settings, Users, Link as LinkIcon, Check, Copy, Save, Building2, Globe, Sparkles, Loader2 } from 'lucide-react';"
)

# Add states
state_addition = """  const [orgName, setOrgName] = useState('');
  const [masterMvv, setMasterMvv] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);"""
content = content.replace(
    "  const [orgName, setOrgName] = useState('');\n  const [masterMvv, setMasterMvv] = useState('');",
    state_addition
)

# Add effect
effect_addition = """  useEffect(() => {
    if (currentOrg) {
      setOrgName(currentOrg.name);
      setMasterMvv(currentOrg.masterMvv || '');
      setCompanyUrl(currentOrg.companyUrl || '');
    }
  }, [currentOrg]);"""
content = content.replace(
    """  useEffect(() => {
    if (currentOrg) {
      setOrgName(currentOrg.name);
      setMasterMvv(currentOrg.masterMvv || '');
    }
  }, [currentOrg]);""",
    effect_addition
)

# Add handleAnalyze function
handle_analyze = """  const { updateOrganizationFrameworks } = useOrgStore();

  const handleAnalyze = async () => {
    if (!companyUrl || !currentOrgId) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/generate-org-frameworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: companyUrl, companyName: orgName, masterMvv })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || '分析に失敗しました');

      await updateOrganizationFrameworks(currentOrgId, {
        companyUrl,
        pest: data.pest,
        fiveForces: data.fiveForces,
        vrio: data.vrio,
        industry: data.industry,
        lastCrawledAt: Date.now(),
        requiresStrategyReview: false
      });
      alert('マクロ環境のAI分析と保存が完了しました');
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {"""
content = content.replace(
    "  const handleSave = async (e: React.FormEvent) => {",
    handle_analyze
)

# Add AI Section
ai_section = """        {/* マクロ環境分析（羅針盤層） */}
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Globe size={20} className="text-blue-500" />
              マクロ環境分析 (AI推論)
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              企業のURLを入力すると、AIがWebサイトをクローリングし、マクロ環境（PEST, 5Forces, VRIO）を自動推論します。
            </p>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex gap-4 items-end max-w-2xl">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  企業サイトURL
                </label>
                <input
                  type="url"
                  value={companyUrl}
                  onChange={(e) => setCompanyUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !companyUrl}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-all shadow-sm"
              >
                {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                {isAnalyzing ? "分析中..." : "AI分析を実行"}
              </button>
            </div>

            {currentOrg.pest && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 h-64 overflow-y-auto">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3 sticky top-0 bg-slate-50 dark:bg-slate-900 py-1 border-b border-slate-200 dark:border-slate-700">PEST分析</h3>
                  <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: currentOrg.pest.replace(/\\n/g, '<br/>') }} />
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 h-64 overflow-y-auto">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3 sticky top-0 bg-slate-50 dark:bg-slate-900 py-1 border-b border-slate-200 dark:border-slate-700">5フォース分析</h3>
                  <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: currentOrg.fiveForces?.replace(/\\n/g, '<br/>') || '' }} />
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 h-64 overflow-y-auto">
                  <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3 sticky top-0 bg-slate-50 dark:bg-slate-900 py-1 border-b border-slate-200 dark:border-slate-700">VRIO分析</h3>
                  <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: currentOrg.vrio?.replace(/\\n/g, '<br/>') || '' }} />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 2. Members & Invites */}"""
content = content.replace(
    "        {/* 2. Members & Invites */}",
    ai_section
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
