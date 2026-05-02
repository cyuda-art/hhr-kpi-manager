"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/store/useProjectStore';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Target, TrendingUp, CheckCircle, ArrowRight, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { KpiNodeData } from '@/types';

// 入力用の一時データ型
interface MetricInput {
  id: string;
  name: string;
  targetValue: number;
  actualValue: number;
  unit: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { currentProjectId } = useProjectStore();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // KGIデータ
  const [kgi, setKgi] = useState<MetricInput>({
    id: 'kgi_main',
    name: '月間売上',
    targetValue: 10000000,
    actualValue: 0,
    unit: '円'
  });

  // KPIデータ（初期状態で2つ用意）
  const [kpis, setKpis] = useState<MetricInput[]>([]);

  const applyTemplate = (type: 'retail' | 'saas') => {
    if (type === 'retail') {
      setKgi({ id: 'kgi_main', name: '月間店舗売上', targetValue: 5000000, actualValue: 0, unit: '円' });
      setKpis([
        { id: 'kpi_1', name: '来店客数', targetValue: 1000, actualValue: 0, unit: '人' },
        { id: 'kpi_2', name: '客単価', targetValue: 5000, actualValue: 0, unit: '円' }
      ]);
    } else if (type === 'saas') {
      setKgi({ id: 'kgi_main', name: 'MRR (月次経常収益)', targetValue: 10000000, actualValue: 0, unit: '円' });
      setKpis([
        { id: 'kpi_1', name: '新規獲得件数', targetValue: 50, actualValue: 0, unit: '件' },
        { id: 'kpi_2', name: '平均顧客単価', targetValue: 200000, actualValue: 0, unit: '円' },
        { id: 'kpi_3', name: '解約率 (Churn)', targetValue: 1, actualValue: 0, unit: '%' }
      ]);
    }
    setStep(1);
  };

  useEffect(() => {
    if (!currentProjectId) {
      router.push('/projects');
    }
  }, [currentProjectId, router]);

  const addKpi = () => {
    setKpis([
      ...kpis,
      { id: `kpi_${Date.now()}`, name: '', targetValue: 0, actualValue: 0, unit: '' }
    ]);
  };

  const removeKpi = (id: string) => {
    setKpis(kpis.filter(kpi => kpi.id !== id));
  };

  const updateKpi = (id: string, field: keyof MetricInput, value: string | number) => {
    setKpis(kpis.map(kpi => kpi.id === id ? { ...kpi, [field]: value } : kpi));
  };

  const handleComplete = async () => {
    if (!currentProjectId) return;
    setIsSaving(true);

    // KGIとKPIをFirestore保存用のフォーマットに変換
    const kpiData: Record<string, any> = {};

    // KGIの追加
    kpiData[kgi.id] = {
      id: kgi.id,
      name: kgi.name,
      type: 'KGI',
      parentId: null,
      targetValue: kgi.targetValue,
      actualValue: kgi.actualValue,
      unit: kgi.unit,
      businessUnit: 'company',
      achievementRate: kgi.targetValue > 0 ? (kgi.actualValue / kgi.targetValue) * 100 : 0,
      status: kgi.actualValue >= kgi.targetValue ? 'good' : 'warning',
      initialActualValue: kgi.actualValue,
      isSimulated: false
    };

    // KPIの追加
    kpis.forEach(kpi => {
      kpiData[kpi.id] = {
        id: kpi.id,
        name: kpi.name || '未設定のKPI',
        type: 'KPI',
        parentId: kgi.id,
        targetValue: kpi.targetValue,
        actualValue: kpi.actualValue,
        unit: kpi.unit || kgi.unit,
        businessUnit: 'company',
        achievementRate: kpi.targetValue > 0 ? (kpi.actualValue / kpi.targetValue) * 100 : 0,
        status: kpi.actualValue >= kpi.targetValue ? 'good' : 'warning',
        initialActualValue: kpi.actualValue,
        isSimulated: false
      };
    });

    try {
      await setDoc(doc(db, 'projects', currentProjectId, 'kpiData', 'main'), {
        kpiData,
        actions: []
      });
      router.push('/');
    } catch (error: any) {
      console.error("Failed to save initial tree", error);
      alert(`保存に失敗しました: ${error.message}`);
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-colors">
        {/* Header */}
        <div className="bg-primary-600 dark:bg-primary-900 p-8 text-white relative overflow-hidden transition-colors">
          <div className="relative z-10">
            <h1 className="text-2xl font-bold mb-2">プロジェクトのセットアップ</h1>
            <p className="text-primary-100">KPIツリーの骨組みをステップバイステップで作成します</p>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-8 flex items-center justify-between relative z-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2 relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                  step >= i ? 'bg-white text-primary-600' : 'bg-primary-500/50 text-primary-200'
                }`}>
                  {step > i ? <CheckCircle size={20} /> : i}
                </div>
                <span className={`text-xs ${step >= i ? 'text-white font-medium' : 'text-primary-200'}`}>
                  {i === 1 && 'KGIの設定'}
                  {i === 2 && '主要KPIの追加'}
                  {i === 3 && '確認'}
                </span>
              </div>
            ))}
            {/* Progress Line */}
            <div className="absolute top-5 left-0 w-full h-1 bg-primary-500/50 -z-10 rounded-full">
              <div 
                className="h-full bg-white rounded-full transition-all duration-300" 
                style={{ width: `${((step - 1) / 2) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content Area - 2 Columns */}
        <div className="flex flex-col md:flex-row h-full max-h-[80vh] overflow-hidden">
          
          {/* Left Column: Form */}
          <div className="p-8 md:w-1/2 overflow-y-auto border-r border-slate-100 dark:border-slate-800">
            
            {/* Step 1: KGI */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">💡 テンプレートから始める</p>
                  <div className="flex gap-2">
                    <button onClick={() => applyTemplate('retail')} className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs hover:border-primary-400 transition-colors">店舗・小売</button>
                    <button onClick={() => applyTemplate('saas')} className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs hover:border-primary-400 transition-colors">B2B SaaS</button>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-800 dark:text-slate-100 mb-6">
                <Target className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                <h2 className="text-xl font-bold">最終目標（KGI）の設定</h2>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                このプロジェクトで達成したい最も重要な目標を1つ設定してください。
                （例：月間売上、年間利益、MRRなど）
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">指標名</label>
                  <input
                    type="text"
                    value={kgi.name}
                    onChange={(e) => setKgi({ ...kgi, name: e.target.value })}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-colors"
                    placeholder="例: 月間売上"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">目標値</label>
                    <input
                      type="number"
                      value={kgi.targetValue || ''}
                      onChange={(e) => setKgi({ ...kgi, targetValue: Number(e.target.value) })}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">単位</label>
                    <input
                      type="text"
                      value={kgi.unit}
                      onChange={(e) => setKgi({ ...kgi, unit: e.target.value })}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-colors"
                      placeholder="例: 円, 人, %"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">現在の実績値（任意）</label>
                  <input
                    type="number"
                    value={kgi.actualValue || ''}
                    onChange={(e) => setKgi({ ...kgi, actualValue: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: KPIs */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 text-slate-800 dark:text-slate-100 mb-6">
                <TrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                <h2 className="text-xl font-bold">主要KPIの追加</h2>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                「{kgi.name}」を達成するために、直下に紐づく主要なKPI（要素）を追加してください。
                （例：売上であれば「客数」と「客単価」など）
              </p>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {kpis.map((kpi, index) => (
                  <div key={kpi.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl relative group transition-colors">
                    <div className="absolute -left-3 -top-3 w-6 h-6 bg-slate-800 dark:bg-slate-700 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                      {index + 1}
                    </div>
                    {kpis.length > 1 && (
                      <button 
                        onClick={() => removeKpi(kpi.id)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">KPI名</label>
                        <input
                          type="text"
                          value={kpi.name}
                          onChange={(e) => updateKpi(kpi.id, 'name', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-primary-500 outline-none text-sm transition-colors"
                          placeholder="例: 客数"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">目標値</label>
                        <input
                          type="number"
                          value={kpi.targetValue || ''}
                          onChange={(e) => updateKpi(kpi.id, 'targetValue', Number(e.target.value))}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-primary-500 outline-none text-sm transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">単位</label>
                        <input
                          type="text"
                          value={kpi.unit}
                          onChange={(e) => updateKpi(kpi.id, 'unit', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-md focus:ring-2 focus:ring-primary-500 outline-none text-sm transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button 
                  onClick={addKpi}
                  className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl flex items-center justify-center gap-2 hover:border-primary-400 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <Plus size={18} />
                  <span>KPIを追加する</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 text-slate-800 dark:text-slate-100 mb-6">
                <CheckCircle className="w-6 h-6 text-green-500 dark:text-green-400" />
                <h2 className="text-xl font-bold">設定内容の確認</h2>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                以下の構成でKPIツリーを作成します。作成後もダッシュボードから自由に追加・編集が可能です。
              </p>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 relative overflow-hidden transition-colors">
                {/* KGI Box */}
                <div className="bg-primary-600 dark:bg-primary-700 text-white p-4 rounded-lg shadow-md mb-8 relative z-10 mx-auto w-3/4 text-center">
                  <div className="text-xs text-primary-200 font-bold mb-1">KGI</div>
                  <div className="font-bold text-lg">{kgi.name}</div>
                  <div className="text-sm mt-1">{kgi.targetValue.toLocaleString()} {kgi.unit}</div>
                </div>

                {/* Connecting Lines */}
                <div className="absolute top-20 left-1/2 w-px h-8 bg-slate-300 dark:bg-slate-600 -translate-x-1/2 z-0"></div>
                <div className="absolute top-28 left-1/4 right-1/4 h-px bg-slate-300 dark:bg-slate-600 z-0"></div>

                {/* KPI Boxes */}
                <div className="flex justify-center gap-4 relative z-10 flex-wrap">
                  {kpis.map((kpi, idx) => (
                    <div key={kpi.id} className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-3 rounded-lg shadow-sm flex-1 min-w-[120px] text-center relative transition-colors">
                      <div className="absolute -top-4 left-1/2 w-px h-4 bg-slate-300 dark:bg-slate-600 -translate-x-1/2"></div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 font-bold mb-1">KPI</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">{kpi.name || '未設定'}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{kpi.targetValue.toLocaleString()} {kpi.unit}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Footer Navigation */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between transition-colors">
            <button
              onClick={() => step > 1 ? setStep(step - 1) : router.push('/projects')}
              className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium transition-colors flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              {step === 1 ? 'プロジェクト一覧へ戻る' : '戻る'}
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && !kgi.name}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                次へ
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={isSaving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? '作成中...' : 'ツリーを作成して開始'}
                {!isSaving && <CheckCircle size={16} />}
              </button>
            )}
          </div>
          </div>
          
          {/* Right Column: Live Preview */}
          <div className="hidden md:block md:w-1/2 bg-slate-50/50 dark:bg-slate-900/20 p-8 overflow-y-auto flex items-center justify-center">
            <div className="w-full flex flex-col items-center">
              <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 mb-8 uppercase tracking-wider">Live Preview</h3>
              
              <div className="bg-primary-600 dark:bg-primary-700 text-white p-4 rounded-xl shadow-lg mb-8 relative z-10 w-full max-w-[240px] text-center border-2 border-primary-400 dark:border-primary-500/50">
                <div className="text-xs text-primary-200 font-bold mb-1">KGI</div>
                <div className="font-bold text-lg">{kgi.name || '未設定'}</div>
                <div className="text-sm mt-1 text-primary-100">{kgi.targetValue ? kgi.targetValue.toLocaleString() : '-'} {kgi.unit}</div>
              </div>

              {kpis.length > 0 && (
                <div className="relative w-full flex justify-center gap-4 flex-wrap">
                  <div className="absolute -top-8 left-1/2 w-px h-8 bg-slate-300 dark:bg-slate-600 -translate-x-1/2 z-0"></div>
                  {kpis.length > 1 && <div className="absolute -top-4 left-[20%] right-[20%] h-px bg-slate-300 dark:bg-slate-600 z-0"></div>}
                  
                  {kpis.map((kpi, idx) => (
                    <div key={kpi.id} className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-4 rounded-xl shadow-md w-[140px] text-center relative z-10 transition-all hover:-translate-y-1">
                      <div className="absolute -top-4 left-1/2 w-px h-4 bg-slate-300 dark:bg-slate-600 -translate-x-1/2"></div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mb-1">KPI</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{kpi.name || '未設定'}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{kpi.targetValue ? kpi.targetValue.toLocaleString() : '-'} {kpi.unit}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
