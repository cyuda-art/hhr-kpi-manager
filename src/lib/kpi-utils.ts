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

  // Check for quarters and half-years (e.g. Q1-2026)
  let targetMonths: string[] = [];
  if (currentPeriod.match(/^\d{4}-\d{2}$/)) {
    targetMonths = [currentPeriod];
  } else if (currentPeriod.match(/^(Q[1-4]|H[1-2])-(\d{4})$/)) {
    const match = currentPeriod.match(/^(Q[1-4]|H[1-2])-(\d{4})$/);
    if (match) {
      const type = match[1];
      const year = match[2];
      const nextYear = (parseInt(year) + 1).toString();
      if (type === 'Q1') targetMonths = [`${year}-04`, `${year}-05`, `${year}-06`];
      if (type === 'Q2') targetMonths = [`${year}-07`, `${year}-08`, `${year}-09`];
      if (type === 'Q3') targetMonths = [`${year}-10`, `${year}-11`, `${year}-12`];
      if (type === 'Q4') targetMonths = [`${nextYear}-01`, `${nextYear}-02`, `${nextYear}-03`];
      if (type === 'H1') targetMonths = [`${year}-04`, `${year}-05`, `${year}-06`, `${year}-07`, `${year}-08`, `${year}-09`];
      if (type === 'H2') targetMonths = [`${year}-10`, `${year}-11`, `${year}-12`, `${nextYear}-01`, `${nextYear}-02`, `${nextYear}-03`];
    }
  } else if (currentPeriod === 'today') {
    // If today is requested, we map it to the current month, then divide by days.
    const today = new Date();
    const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    targetMonths = [monthStr];
  }

  if (targetMonths.length > 0) {
    if (fieldKey && node.monthlyData) {
      let sum = 0;
      let validMonths = 0;
      for (const m of targetMonths) {
        if (node.monthlyData[m] && node.monthlyData[m][fieldKey] !== undefined) {
          sum += node.monthlyData[m][fieldKey] as number;
          validMonths++;
        }
      }
      // If we have some data, we use it. For missing months, we assume 0 or fallback.
      // Let's assume if at least one month is there, we use the sum.
      if (validMonths > 0) {
        if (!shouldScaleWithPeriod(node as Partial<KpiNodeData>)) {
          // Average for non-cumulative
          return sum / validMonths;
        }
        
        // If today, divide by days in month
        if (currentPeriod === 'today') {
          const todayDate = new Date();
          const daysInMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0).getDate();
          return sum / daysInMonth;
        }

        return sum;
      }
    }
    
    // Fallback: scale the annual value if no monthly data exists
    if (!shouldScaleWithPeriod(node as Partial<KpiNodeData>)) return value;
    
    if (currentPeriod === 'today') return value / 365;
    return value * (targetMonths.length / 12);
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
  _fieldKey?: keyof MonthlyData
): number => {
  if (currentPeriod.match(/^\d{4}-\d{2}$/)) {
    return displayValue;
  }

  // If trying to save a grouped period, it's generally not recommended, but we can scale it to annual.
  let targetMonthsLength = 0;
  if (currentPeriod.match(/^(Q[1-4]|H[1-2])-(\d{4})$/)) {
    targetMonthsLength = currentPeriod.startsWith('Q') ? 3 : 6;
  } else if (currentPeriod === 'today') {
    targetMonthsLength = 1 / 30; // Approximation
  }

  if (targetMonthsLength > 0) {
    if (!shouldScaleWithPeriod(node as Partial<KpiNodeData>)) return displayValue;
    return displayValue * (12 / targetMonthsLength);
  }

  if (currentPeriod === 'year' || !shouldScaleWithPeriod(node as Partial<KpiNodeData>)) {
    return displayValue;
  }
  return displayValue / getPeriodMultiplier(currentPeriod);
};

/**
 * 画面表示用に数値をフォーマットする（小数点以下の桁数制御）
 */
export const formatDisplayValue = (value: number, unit?: string): string => {
  if (value === undefined || value === null || isNaN(value)) return '0';
  
  if (unit === '%' || unit === '％' || unit === 'pt') {
    return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
  }
  
  // 円、人、件などは整数
  return Math.round(value).toLocaleString();
};

