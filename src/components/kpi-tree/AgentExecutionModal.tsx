import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, X, Zap, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { useKpiStore } from '../../store/useKpiStore';

interface AgentExecutionModalProps {
  actionId: string;
  onClose: () => void;
}

export const AgentExecutionModal: React.FC<AgentExecutionModalProps> = ({ actionId, onClose }) => {
  const { actions, kpiData, currentProjectInfo, updateAction } = useKpiStore();
  const action = actions.find(a => a.id === actionId);
  const targetKpi = action ? kpiData[action.kpiId] : null;

  const [isExecuting, setIsExecuting] = useState(false);
  const [log, setLog] = useState('');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const [typedLog, setTypedLog] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!action || !targetKpi) return;

    const executeAgent = async () => {
      setIsExecuting(true);
      setError('');
      try {
        const res = await fetch('/api/agent-execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskTitle: action.title,
            taskDescription: action.description,
            kpiContext: {
              name: targetKpi.name,
              targetValue: targetKpi.targetValue,
              actualValue: targetKpi.actualValue,
              unit: targetKpi.unit,
            },
            manifesto: currentProjectInfo?.manifesto || currentProjectInfo?.mvv || ''
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Execution failed');

        setLog(data.log || '> System: Execution completed with unknown logs.');
        setSummary(data.summary || 'タスクが完了しました。');
        
        // Update store
        updateAction(actionId, {
          agentStatus: 'SUCCESS',
          agentLog: data.log,
        });

        // Start typing effect for logs
        setIsTyping(true);

      } catch (err: any) {
        setError(err.message);
        updateAction(actionId, { agentStatus: 'FAILED' });
      } finally {
        setIsExecuting(false);
      }
    };

    executeAgent();
  }, [actionId]);

  // Typing effect for the log
  useEffect(() => {
    if (!isTyping || !log) return;
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      setTypedLog(log.slice(0, currentIndex));
      currentIndex++;
      if (currentIndex > log.length) {
        clearInterval(interval);
        setIsTyping(false);
        // マーク as Done after typing finishes
        updateAction(actionId, { status: 'done' });
      }
    }, 10); // Very fast typing

    return () => clearInterval(interval);
  }, [isTyping, log, actionId]);

  if (!action || !targetKpi) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-black border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Cyberpunk Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2 text-emerald-400">
            <Terminal size={18} />
            <span className="font-mono text-sm font-bold tracking-wider">HHR-AGENT // EXECUTION_PROTOCOL</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Task Info */}
        <div className="p-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              {isExecuting ? (
                <Loader2 size={18} className="text-blue-400 animate-spin" />
              ) : error ? (
                <AlertTriangle size={18} className="text-rose-500" />
              ) : (
                <CheckCircle2 size={18} className="text-emerald-500" />
              )}
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">{action.title}</h3>
              <p className="text-slate-400 text-sm mt-1">ターゲットKPI: {targetKpi.name}</p>
            </div>
          </div>
        </div>

        {/* Terminal Window */}
        <div className="flex-1 overflow-y-auto p-4 bg-black font-mono text-sm text-emerald-500 custom-scrollbar leading-relaxed">
          <AnimatePresence>
            {isExecuting && !log && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-slate-500">
                <span className="animate-pulse">_</span> Initializing neural link and preparing execution environment...
              </motion.div>
            )}
          </AnimatePresence>
          <div className="whitespace-pre-wrap">
            {typedLog}
            {isTyping && <span className="animate-pulse bg-emerald-500 text-black">█</span>}
          </div>
          {error && (
            <div className="text-rose-500 mt-4 whitespace-pre-wrap">
              [CRITICAL ERROR] {error}
            </div>
          )}
        </div>

        {/* Summary Footer */}
        <AnimatePresence>
          {!isTyping && summary && !error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-slate-900 border-t border-slate-800"
            >
              <div className="flex items-start gap-3">
                <Zap className="text-yellow-400 shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="text-white font-bold mb-1">Execution Summary</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">{summary}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
