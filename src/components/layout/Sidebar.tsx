import Link from 'next/link';
import { LayoutDashboard, Network, Settings, Building2, Utensils, ShoppingBag, ChefHat, Bath, Database } from 'lucide-react';

export const Sidebar = () => {
  const menuItems = [
    { name: 'ダッシュボード', icon: LayoutDashboard, path: '/' },
    { name: 'KPIツリー', icon: Network, path: '/tree' },
    { name: 'データ入力', icon: Database, path: '/data-entry' },
  ];

  const businessUnits = [
    { name: '宿泊', icon: Building2 },
    { name: '温浴', icon: Bath },
    { name: '飲食', icon: Utensils },
    { name: '物販', icon: ShoppingBag },
    { name: 'セントラルキッチン', icon: ChefHat },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white tracking-wider">HHR-KPI MANAGER</h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        <div className="mb-8">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Main</p>
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.path}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
            >
              <item.icon size={20} />
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
        
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Business Units</p>
          {businessUnits.map((item) => (
            <button
              key={item.name}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors text-left"
            >
              <item.icon size={18} className="text-slate-400" />
              <span className="text-sm">{item.name}</span>
            </button>
          ))}
        </div>
      </nav>
      <div className="p-4 border-t border-slate-800">
        <button className="flex items-center gap-3 px-3 py-2 w-full rounded-lg hover:bg-slate-800 hover:text-white transition-colors text-left">
          <Settings size={20} />
          <span>設定</span>
        </button>
      </div>
    </aside>
  );
};
