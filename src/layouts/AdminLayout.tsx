import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AdminSidebar } from '../components/admin/AdminSidebar';

export const AdminLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212] text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Admin access protection
  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-background dark:bg-[#121212]">
      <AdminSidebar />
      <main className="flex-grow p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
