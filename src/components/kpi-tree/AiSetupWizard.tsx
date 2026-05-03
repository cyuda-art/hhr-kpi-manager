import { useState } from 'react';
import { useKpiStore } from '@/store/useKpiStore';
import { Sparkles, UploadCloud, MessageSquare, ArrowRight, Loader2, Hotel, Utensils, Store } from 'lucide-react';
import { TEMPLATES } from '@/lib/templates';

export const AiSetupWizard = () => {
  const { setKpiDataBulk } = useKpiStore();
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!description.trim()) return;
    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/gemini/generate-tree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessDescription: description }),
      });

      if (!response.ok) {
        throw new Error('KPIツリーの生成に失敗しました');
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      if (data.nodes && Array.isArray(data.nodes)) {
        setKpiDataBulk(data.nodes);
      } else {
        throw new Error('AIが不正なデータを返しました');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || '予期せぬエラーが発生しました');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyTemplate = async (type: keyof typeof TEMPLATES) => {
    setIsGenerating(true);
    // 擬似的なAI生成時間（SaaSとしての演出）
    await new Promise(resolve => setTimeout(resolve, 1500));
    setKpiDataBulk(TEMPLATES[type]);
    setIsGenerating(false);
  };

  return (
    <div className="absolute inset-0 z-50 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-primary-500 to-purple-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
              <Sparkles size={24} className="text-white" />
            </div>
            <h2 className="text-xl font-bold">AI オンボーディング</h2>
          </div>
          <p className="text-primary-100 text-sm">
            あなたの事業内容や目標を教えてください。AIが最適なKPIツリー構造を自動設計します。
          </p>
        </div>

        {/* コンテンツ */}
        <div className="p-6 space-y-6">
          {/* 業種別テンプレートセクション */}
          <div>
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3 text-sm flex items-center gap-2">
              <span className="w-1.5 h-4 bg-primary-500 rounded-full"></span>
              おすすめ: 業種テンプレートから1秒で生成
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => handleApplyTemplate('hotel')}
                disabled={isGenerating}
                className="flex flex-col items-center justify-center gap-2 p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-900 transition-colors">
                  <Hotel size={20} className="text-slate-600 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">ホテル・宿泊業</span>
              </button>
              
              <button
                onClick={() => handleApplyTemplate('restaurant')}
                disabled={isGenerating}
                className="flex flex-col items-center justify-center gap-2 p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900 transition-colors">
                  <Utensils size={20} className="text-slate-600 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">飲食・レストラン</span>
              </button>

              <button
                onClick={() => handleApplyTemplate('retail')}
                disabled={isGenerating}
                className="flex flex-col items-center justify-center gap-2 p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors">
                  <Store size={20} className="text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">小売・店舗運営</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-400 font-medium">
            <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
            またはテキストやファイルからAI生成
            <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
          </div>

          {/* テキストエリア */}
          <div className="relative">
            <MessageSquare className="absolute top-3 left-3 text-slate-400" size={18} />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例：都内でリゾートホテルを3店舗運営しています。来期の目標は全社売上を20%アップさせることです。宿泊部門だけでなく、併設するスパやレストランのクロスセルも強化したいと考えています..."
              className="w-full h-32 pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          {error && (
            <p className="text-rose-500 text-xs font-bold bg-rose-50 dark:bg-rose-900/20 p-3 rounded-lg">
              {error}
            </p>
          )}

          {/* ボタン */}
          <button
            onClick={handleGenerate}
            disabled={!description.trim() || isGenerating}
            className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                AIがKPIツリーを構築中...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                この内容でKPIツリーを自動生成
                <ArrowRight size={18} className="ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
