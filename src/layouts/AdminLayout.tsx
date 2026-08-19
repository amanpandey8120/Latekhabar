import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '../components/admin/AdminSidebar';

/**
 * AdminLayout
 *
 * Pure layout shell for the admin panel — sidebar + scrollable main area.
 * Authentication and role authorisation are handled exclusively by the
 * AdminRoute component that wraps every route rendered inside this layout.
 * Do NOT add auth checks here; that would create two competing guards.
 */
export const AdminLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-[#121212]">
      <AdminSidebar />
      <main className="flex-grow overflow-y-auto p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  );
};
