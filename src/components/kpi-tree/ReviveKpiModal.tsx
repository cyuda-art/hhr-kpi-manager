import React from 'react';

interface ReviveKpiModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetParentId: string;
}

export const ReviveKpiModal = ({ isOpen, onClose, targetParentId }: ReviveKpiModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-6">
        <h2 className="text-lg font-bold mb-4">機能準備中</h2>
        <p className="text-sm mb-4">アーカイブデータの引き継ぎ機能は現在開発中です。</p>
        <button onClick={onClose} className="px-4 py-2 bg-slate-200 rounded">閉じる</button>
      </div>
    </div>
  );
};
