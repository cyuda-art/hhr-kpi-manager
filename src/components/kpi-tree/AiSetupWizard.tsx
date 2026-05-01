import { useState } from 'react';
import { useKpiStore } from '@/store/useKpiStore';
import { Sparkles, UploadCloud, MessageSquare, ArrowRight, Loader2 } from 'lucide-react';

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

  return (
    <div className="absolute inset-0 z-50 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
              <Sparkles size={24} className="text-white" />
            </div>
            <h2 className="text-xl font-bold">AI オンボーディング</h2>
          </div>
          <p className="text-indigo-100 text-sm">
            あなたの事業内容や目標を教えてください。AIが最適なKPIツリー構造を自動設計します。
          </p>
        </div>

        {/* コンテンツ */}
        <div className="p-6 space-y-6">
          {/* ドラッグ＆ドロップエリア (モック) */}
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <UploadCloud size={24} />
            </div>
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-1">ファイルをドラッグ＆ドロップ</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              PDF（事業計画書）やCSV（過去データ）を読み込ませることも可能です<br/>
              ※現在プロトタイプのためテキスト入力をお使いください
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-400 font-medium">
            <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
            またはテキストで入力
            <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
          </div>

          {/* テキストエリア */}
          <div className="relative">
            <MessageSquare className="absolute top-3 left-3 text-slate-400" size={18} />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例：都内でリゾートホテルを3店舗運営しています。来期の目標は全社売上を20%アップさせることです。宿泊部門だけでなく、併設するスパやレストランのクロスセルも強化したいと考えています..."
              className="w-full h-32 pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
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
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
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
