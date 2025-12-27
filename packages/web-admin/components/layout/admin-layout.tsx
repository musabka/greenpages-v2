'use client';

import { Sidebar } from './sidebar';
import { Header } from './header';
import { User } from '@/lib/auth';
import { getRolePermissions } from '@/lib/permissions';

interface AdminLayoutProps {
  children: React.ReactNode;
  user: User;
}

export function AdminLayout({ children, user }: AdminLayoutProps) {
  const userPermissions = getRolePermissions(user.role);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userPermissions={userPermissions} />
      <div className="mr-64">
        <Header user={user} />
        <main className="mt-16 p-6">{children}</main>
      </div>
    </div>
  );
}
