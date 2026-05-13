import { KpiNodeData, MonthlyData } from '@/types';

/**
 * 期間（Period）に応じた係数を取得する。
 * ベースのDB保存値は「1年（year）」を前提とする。
 */
export const getPeriodMultiplier = (period: string): number => {
  switch (period) {
    case 'year': return 1;
    case 'half': return 1 / 2;
    case 'quarter': return 1 / 4;
    case 'month': return 1 / 12;
    case 'day': return 1 / 365;
    default: return 1;
  }
};

/**
 * KPIが「期間に比例してスケールする累積値」か「スケールしない率・単価・平均」かを判定する。
 */
export const shouldScaleWithPeriod = (node: Partial<KpiNodeData>): boolean => {
  if (!node) return true;
  
  const name = node.name || '';
  const unit = node.unit || '';

  // スケールしない（率、パーセントなど）
  if (unit === '%' || unit === '％' || unit === 'pt' || unit === 'ポイント') return false;
  if (name.includes('率') || name.includes('割合') || name.includes('レート') || name.includes('rate')) return false;

  // スケールしない（単価、LTVなど）
  if (unit === '円' && (name.includes('単価') || name.includes('LTV') || name.includes('コスト') || name.includes('原価'))) return false;

  // それ以外（売上高、件数、人数、回数などはスケールする）
  return true;
};


/**
 * UI表示用に数値を期間換算する。
 */
export const getDisplayValue = (
  value: number | undefined, 
  node: Partial<KpiNodeData & { monthlyData?: Record<string, MonthlyData> }>, 
  currentPeriod: string,
  fieldKey?: keyof MonthlyData
): number => {
  if (value === undefined || value === null) return 0;

  if (currentPeriod.match(/^\d{4}-\d{2}$/)) {
    if (fieldKey && node.monthlyData && node.monthlyData[currentPeriod]) {
      const val = node.monthlyData[currentPeriod][fieldKey];
      if (val !== undefined && typeof val === 'number') return val;
    }
    // Fallback: scale the annual value if no monthly data exists
    if (!shouldScaleWithPeriod(node as Partial<KpiNodeData>)) return value;
    return value / 12;
  }

  if (currentPeriod === 'year' || !shouldScaleWithPeriod(node as Partial<KpiNodeData>)) {
    return value;
  }
  return value * getPeriodMultiplier(currentPeriod);
};

/**
 * UIの入力値をDB保存用に「年間基準」に逆換算する。
 */
export const getStorageValue = (
  displayValue: number, 
  node: Partial<KpiNodeData & { monthlyData?: Record<string, MonthlyData> }>, 
  currentPeriod: string,
  fieldKey?: keyof MonthlyData
): number => {
  if (currentPeriod.match(/^\d{4}-\d{2}$/)) {
    // If it's a specific month, and we're editing it, the display value IS the storage value for that month.
    // However, if the caller is trying to save it as the ANNUAL value, we should multiply it.
    // Wait, the new architecture means if we are editing '2026-05', we just save it into monthlyData['2026-05'].
    // So no scaling is needed!
    return displayValue;
  }

  if (currentPeriod === 'year' || !shouldScaleWithPeriod(node as Partial<KpiNodeData>)) {
    return displayValue;
  }
  return displayValue / getPeriodMultiplier(currentPeriod);
};
