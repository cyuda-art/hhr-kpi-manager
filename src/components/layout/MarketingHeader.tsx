"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Network, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useOrgStore } from '@/store/useOrgStore';

export const MarketingHeader = () => {
  const pathname = usePathname();
  const { user, isLoading } = useAuthStore();
  const { currentOrgId } = useOrgStore();

  const navLinks = [
    { href: '/product', label: '製品' },
    { href: '/use-cases', label: '活用シーン' },
    { href: '/pricing', label: '料金' },
    { href: '/tutorial', label: 'チュートリアル' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/20 dark:bg-black/20 backdrop-blur-xl border-b border-white/40 dark:border-white/10 transition-all duration-300">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-black text-xl tracking-widest font-poppins text-slate-900 dark:text-white uppercase group">
          <Network className="w-5 h-5 text-strategic-teal group-hover:scale-110 transition-transform" />
          Gnu.
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-800 dark:text-slate-200">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className={`transition-colors ${pathname === link.href ? 'text-strategic-teal' : 'hover:text-strategic-teal'}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
            <>
              <a href="/login" className="text-sm font-bold font-poppins text-slate-800 dark:text-slate-200 hover:text-strategic-teal dark:hover:text-strategic-teal transition-colors">
                ログイン
              </a>
              <a href="/login" className="text-xs font-bold font-poppins tracking-wider bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-full hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-sm">
                無料トライアル
              </a>
            </>
        </div>
      </div>
    </header>
  );
};
