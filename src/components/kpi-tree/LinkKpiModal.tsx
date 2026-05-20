import { useState, useEffect } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { useKpiStore } from '@/store/useKpiStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useAuthStore } from '@/store/useAuthStore';
import { X, Link2, Search, Target, BarChart2 } from 'lucide-react';
import { formatDisplayValue } from '@/lib/kpi-utils';

interface LinkKpiModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetParentId: string; // リンクしたノードをぶら下げる親ノードのID
}

export const LinkKpiModal = ({ isOpen, onClose, targetParentId }: LinkKpiModalProps) => {
  const { currentProjectId, projects } = useProjectStore();
  const { addKpiNode, kpiData, currentOrgId } = useKpiStore();
  const { user } = useAuthStore();
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [targetNodes, setTargetNodes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // プロジェクトが選択されたらそのプロジェクトのKPI一覧を取得
  useEffect(() => {
    if (!selectedProjectId || !currentOrgId) {
      setTargetNodes([]);
      return;
    }

    const fetchProjectKpis = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/projects/${selectedProjectId}/nodes`);
        if (res.ok) {
          const data = await res.json();
          if (data.kpiData) {
            setTargetNodes(Object.values(data.kpiData));
          } else {
            setTargetNodes([]);
          }
        } else {
          setTargetNodes([]);
        }
      } catch (error) {
        console.error("Failed to fetch target KPIs", error);
        setTargetNodes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectKpis();
  }, [selectedProjectId, currentOrgId]);

  if (!isOpen) return null;

  // 自プロジェクト以外のプロジェクトをリストアップ
  const otherProjects = projects.filter(p => p.id !== currentProjectId);
  const parentNode = kpiData[targetParentId];

  const filteredNodes = targetNodes.filter(node => 
    node.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (node.qualitativeName && node.qualitativeName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleLinkNode = (node: any) => {
    if (!parentNode) return;

    const newKpiId = `kpi_link_${Math.random().toString(36).substr(2, 9)}`;
    
    addKpiNode({
      id: newKpiId,
      name: node.name,
      qualitativeName: node.qualitativeName || 'リンク指標',
      businessUnit: 'cross', // クロスプロジェクトであることを明示
      type: 'KPI',
      parentId: targetParentId,
      targetValue: node.targetValue || 0,
      actualValue: node.actualValue || 0,
      unit: node.unit || '',
      previousValue: 0,
      description: `【リンク元】${projects.find(p => p.id === selectedProjectId)?.name}\n${node.description || ''}`,
      isCalculated: false, // リンク先では計算ではなく同期値を使う
      linkedSource: {
        projectId: selectedProjectId,
        kpiId: node.id
      }
    });

    alert('他プロジェクトのKPIをリンクして追加しました。');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-oxford-navy dark:text-slate-200">
            <Link2 size={20} className="text-primary-500" />
            <h2 className="text-lg font-bold">他プロジェクトから指標をリンク</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
          {/* 親ノード確認 */}
          <div className="bg-clean-canvas dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-logic-slate dark:text-slate-400 mb-1">リンク先（親ノード）:</p>
            <p className="font-bold text-sm text-oxford-navy dark:text-slate-200">{parentNode?.name || '不明'}</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">1. 同期元のプロジェクトを選択</label>
            <select 
              value={selectedProjectId} 
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 text-oxford-navy dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-strategic-teal"
            >
              <option value="">プロジェクトを選択してください...</option>
              {otherProjects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {selectedProjectId && (
            <div className="flex flex-col gap-2 flex-1 min-h-[300px]">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">2. 同期する指標（KPI/KGI）を選択</label>
              
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
                {isLoading ? (
                  <div className="flex items-center justify-center h-32 text-sm text-logic-slate dark:text-slate-400">読み込み中...</div>
                ) : filteredNodes.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-sm text-logic-slate dark:text-slate-400">指標が見つかりません。</div>
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
                            実績: {formatDisplayValue(node.actualValue, node.unit)} {node.unit} / 目標: {formatDisplayValue(node.targetValue, node.unit)} {node.unit}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleLinkNode(node)}
                          className="shrink-0 px-3 py-1.5 bg-primary-50 text-strategic-teal hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50 rounded text-xs font-bold transition-colors opacity-0 group-hover:opacity-100"
                        >
                          この指標をリンク
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
