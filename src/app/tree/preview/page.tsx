import { KpiTree } from '@/components/kpi-tree/KpiTree';

export default function TreePreviewPage() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <KpiTree previewMode={true} />
    </div>
  );
}
