import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const MainLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="pl-64">
        <Header />
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
