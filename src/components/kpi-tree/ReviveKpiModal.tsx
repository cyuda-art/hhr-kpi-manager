import { useState } from 'react';
import { useKpiStore } from '@/store/useKpiStore';
import { X, Search, Target, BarChart2, ArchiveRestore } from 'lucide-react';
import { formatDisplayValue } from '@/lib/kpi-utils';

interface ReviveKpiModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetParentId: string; // 復活させたノードをぶら下げる親ノードのID
}

export const ReviveKpiModal = ({ isOpen, onClose, targetParentId }: ReviveKpiModalProps) => {
  const { kpiData, reviveKpiNode } = useKpiStore();
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const parentNode = kpiData[targetParentId];
  
  // ストアからアーカイブ済みのKPIのみを抽出
  const archivedNodes = Object.values(kpiData).filter(node => node.isArchived);

  const filteredNodes = archivedNodes.filter(node => 
    node.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (node.qualitativeName && node.qualitativeName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleReviveNode = (node: any) => {
    if (!parentNode) return;
    
    // ストアの reviveKpiNode を呼び出して復活させる
    reviveKpiNode(node.id, targetParentId);
    
    alert(`「${node.name}」をアーカイブから復活させました。`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-oxford-navy dark:text-slate-200">
            <ArchiveRestore size={20} className="text-amber-500" />
            <h2 className="text-lg font-bold">アーカイブからKPIを復活させる</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
          {/* 親ノード確認 */}
          <div className="bg-clean-canvas dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-logic-slate dark:text-slate-400 mb-1">復活先（親ノード）:</p>
            <p className="font-bold text-sm text-oxford-navy dark:text-slate-200">{parentNode?.name || '不明'}</p>
          </div>

          <div className="flex flex-col gap-2 flex-1 min-h-[300px]">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">過去のアーカイブデータ（履歴）を選択して引き継ぐ</label>
            
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="指標名で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 text-sm text-oxford-navy dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-strategic-teal"
              />
            </div>

            <div className="mt-2 flex-1 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-md bg-clean-canvas dark:bg-slate-900/50">
              {archivedNodes.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-sm text-logic-slate dark:text-slate-400">アーカイブされたKPIはありません。</div>
              ) : filteredNodes.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-sm text-logic-slate dark:text-slate-400">条件に一致するKPIが見つかりません。</div>
              ) : (
                <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredNodes.map(node => (
                    <li key={node.id} className="p-3 hover:bg-white dark:hover:bg-slate-800 transition-colors flex items-center justify-between group">
                      <div className="flex flex-col pr-4">
                        {node.qualitativeName && (
                          <span className="text-[10px] text-logic-slate dark:text-slate-400 font-bold mb-0.5 flex items-center gap-1">
                            <Target size={10} /> {node.qualitativeName}
                          </span>
                        )}
                        <span className="text-sm font-bold text-oxford-navy dark:text-slate-200 flex items-center gap-1">
                          <BarChart2 size={12} className={node.type === 'KGI' ? 'text-primary-500' : 'text-slate-400'} />
                          {node.name}
                        </span>
                        <span className="text-xs text-logic-slate dark:text-slate-400 mt-1">
                          最新実績: {formatDisplayValue(node.actualValue, node.unit)} {node.unit} / 目標: {formatDisplayValue(node.targetValue, node.unit)} {node.unit}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleReviveNode(node)}
                        className="shrink-0 px-3 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 rounded text-xs font-bold transition-colors opacity-0 group-hover:opacity-100"
                      >
                        このKPIを復活
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
