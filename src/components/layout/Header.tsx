"use client";

import { Bell, Search, User, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export const Header = () => {
  const { user, logout } = useAuthStore();

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
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={16} className="text-indigo-600" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-700">
              {user?.displayName || user?.email?.split('@')[0] || 'ゲスト'}
            </span>
            <span className="text-xs text-slate-400">経営管理部</span>
          </div>
          <button 
            onClick={logout}
            title="ログアウト"
            className="ml-2 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
