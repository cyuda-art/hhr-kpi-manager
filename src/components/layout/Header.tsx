import { Bell, Search, User } from 'lucide-react';

export const Header = () => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center bg-slate-100 rounded-full px-4 py-2 w-96">
        <Search size={18} className="text-slate-400 mr-2" />
        <input 
          type="text" 
          placeholder="指標を検索..." 
          className="bg-transparent border-none outline-none text-sm w-full text-slate-700"
        />
      </div>
      <div className="flex items-center gap-6">
        <button className="relative text-slate-500 hover:text-slate-700 transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            3
          </span>
        </button>
        <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
            <User size={16} className="text-slate-500" />
          </div>
          <span className="text-sm font-medium text-slate-700">経営管理部</span>
        </div>
      </div>
    </header>
  );
};
