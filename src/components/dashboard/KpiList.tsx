"use client";

import { useState } from 'react';
import { useKpiStore } from '@/store/useKpiStore';
import { DashboardCard } from './DashboardCard';
import { DetailDrawer } from '@/components/ui/DetailDrawer';

export const KpiList = () => {
  const { kpiData } = useKpiStore();
  const [drawerKpiId, setDrawerKpiId] = useState<string | null>(null);

  const kgis = [
    kpiData['kgi_profit'],
    kpiData['kgi_sales_total'],
  ].filter(Boolean);

  const businessKgis = [
    kpiData['kgi_sales_hotel'],
    kpiData['kgi_sales_spa'],
    kpiData['kgi_sales_restaurant'],
    kpiData['kgi_sales_shop'],
    kpiData['kgi_sales_kitchen'],
  ].filter(Boolean);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
          全社重要指標 (KGI)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kgis.map((kpi) => (
            <DashboardCard key={kpi.id} kpi={kpi} onClick={() => setDrawerKpiId(kpi.id)} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
          事業別KGI
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {businessKgis.map((kpi) => (
            <DashboardCard key={kpi.id} kpi={kpi} onClick={() => setDrawerKpiId(kpi.id)} />
          ))}
        </div>
      </div>

      <DetailDrawer 
        isOpen={drawerKpiId !== null}
        onClose={() => setDrawerKpiId(null)}
        kpi={drawerKpiId ? kpiData[drawerKpiId] : null}
      />
    </div>
  );
};
