import type { ReactNode } from 'react';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';

interface AppShellProps {
  children: ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className="min-h-screen bg-[var(--color-artificio-blue)] text-white flex flex-col">
      <SiteHeader />
      <div className="flex-1 pt-6">
        {children}
      </div>
      <SiteFooter />
    </div>
  );
};
