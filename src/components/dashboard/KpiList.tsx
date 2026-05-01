"use client";

import { useState } from 'react';
import { useKpiStore } from '@/store/useKpiStore';
import { DashboardCard } from './DashboardCard';
import { DetailDrawer } from '@/components/ui/DetailDrawer';

export const KpiList = () => {
  const { kpiData } = useKpiStore();
  const [drawerKpiId, setDrawerKpiId] = useState<string | null>(null);

  const allNodes = Object.values(kpiData);
  const kgis = allNodes.filter(node => node.type === 'KGI' || node.parentId === null);
  const kpis = allNodes.filter(node => node.type === 'KPI' && node.parentId !== null);

  if (allNodes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
          全社重要指標 (KGI)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {kgis.map((kpi) => (
            <DashboardCard key={kpi.id} kpi={kpi} onClick={() => setDrawerKpiId(kpi.id)} />
          ))}
        </div>
      </div>

      {kpis.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
            現場指標 (KPI)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {kpis.map((kpi) => (
              <DashboardCard key={kpi.id} kpi={kpi} onClick={() => setDrawerKpiId(kpi.id)} />
            ))}
          </div>
        </div>
      )}

      <DetailDrawer 
        isOpen={drawerKpiId !== null}
        onClose={() => setDrawerKpiId(null)}
        kpi={drawerKpiId ? kpiData[drawerKpiId] : null}
      />
    </div>
  );
};
