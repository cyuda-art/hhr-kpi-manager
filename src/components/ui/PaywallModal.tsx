import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CreditCard, X, Zap, ShieldCheck } from 'lucide-react';
import { usePaywallStore } from '@/store/usePaywallStore';
import { useOrgStore } from '@/store/useOrgStore';

export const PaywallModal = () => {
  const { isOpen, closePaywall, featureName, requiredCredits } = usePaywallStore();
  const { currentOrgId, organizations, updateOrganizationFrameworks } = useOrgStore();
  
  const currentOrg = organizations.find(o => o.id === currentOrgId);

  if (!isOpen) return null;

  const handleTopUp = async (amount: number) => {
    // 実際の運用ではここでStripe Checkoutへリダイレクトします
    // 今回はデモとして即座にクレジットを追加します
    if (currentOrgId && currentOrg) {
      await updateOrganizationFrameworks(currentOrgId, {
        aiCreditBalance: (currentOrg.aiCreditBalance || 0) + amount
      });
      closePaywall();
      alert(`Stripe決済（モック）が完了しました。\n${amount} AIクレジットが追加されました！`);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* 背景のブラー */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closePaywall}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white dark:bg-[#1a1d21] shadow-2xl border border-slate-200 dark:border-slate-800"
        >
          {/* 上部の装飾グラデーション */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />
          
          <button 
            onClick={closePaywall}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>

          <div className="p-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-500/20 dark:to-orange-500/20 flex items-center justify-center border border-amber-200 dark:border-amber-700/50 shadow-inner">
                <Sparkles size={32} className="text-amber-500" />
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-3">
                AIクレジットが不足しています
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                「{featureName}」を実行するには <span className="font-bold text-amber-600 dark:text-amber-400">{requiredCredits} クレジット</span> 必要ですが、現在の残高は <span className="font-bold text-rose-500">{currentOrg?.aiCreditBalance || 0}</span> です。
              </p>
              <div className="inline-flex items-center gap-2 text-xs text-strategic-teal dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-3 py-1.5 rounded-full">
                <ShieldCheck size={14} />
                無制限利用による不要なコスト爆発（クラウド破産）を防ぐための安全措置です。
              </div>
            </div>

            {/* プラン選択カード */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 都度チャージ */}
              <div className="relative p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 transition-colors group cursor-pointer" onClick={() => handleTopUp(5000)}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200">従量チャージ</h3>
                  <Zap size={16} className="text-amber-500" />
                </div>
                <div className="mb-4">
                  <span className="text-2xl font-black text-slate-800 dark:text-white">¥1,980</span>
                </div>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 mb-6">
                  <li className="flex items-center gap-1.5"><Sparkles size={12} className="text-amber-500"/> 5,000 AIクレジット追加</li>
                  <li className="flex items-center gap-1.5"><Sparkles size={12} className="text-amber-500"/> 有効期限なし</li>
                </ul>
                <button className="w-full py-2.5 rounded-lg text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-amber-50 dark:group-hover:bg-amber-900/30 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors flex items-center justify-center gap-2">
                  <CreditCard size={16} /> チャージする
                </button>
              </div>

              {/* サブスクリプション */}
              <div className="relative p-5 rounded-xl border-2 border-amber-400 dark:border-amber-500 bg-amber-50/50 dark:bg-amber-900/10 cursor-pointer overflow-hidden group" onClick={() => handleTopUp(50000)}>
                <div className="absolute top-0 right-0 bg-amber-400 text-white text-[10px] font-black px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                  Recommended
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-amber-900 dark:text-amber-400">Pro プラン</h3>
                </div>
                <div className="mb-4 flex items-end gap-1">
                  <span className="text-2xl font-black text-slate-800 dark:text-white">¥9,800</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mb-1">/ 月</span>
                </div>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 mb-6">
                  <li className="flex items-center gap-1.5"><Sparkles size={12} className="text-amber-500"/> 毎月 50,000 クレジット付与</li>
                  <li className="flex items-center gap-1.5"><Sparkles size={12} className="text-amber-500"/> 自律型エージェントの並列実行</li>
                  <li className="flex items-center gap-1.5"><Sparkles size={12} className="text-amber-500"/> Salesforce / Hubspot 連携</li>
                </ul>
                <button className="w-full py-2.5 rounded-lg text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition-all shadow-md flex items-center justify-center gap-2">
                  <CreditCard size={16} /> Proプランにアップグレード
                </button>
              </div>
            </div>
            
            <p className="text-center text-[10px] text-slate-400 mt-6">
              Stripeによる安全な決済が実行されます。料金プランの詳細は<a href="#" className="underline">こちら</a>をご覧ください。
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
