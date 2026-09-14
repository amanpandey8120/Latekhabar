import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useStaffAccess } from '../../context/StaffAccessContext';

interface AdminOnlyRouteProps {
  children: React.ReactNode;
}

export const AdminOnlyRoute: React.FC<AdminOnlyRouteProps> = ({ children }) => {
  const { role } = useStaffAccess();

  if (role !== 'admin') {
    return (
      <div className="bg-[#1c1c1c] border border-gray-800 rounded-2xl p-8 text-center max-w-lg mx-auto my-12 space-y-4 shadow-xl">
        <div className="w-14 h-14 bg-red-950/60 border border-red-800 text-red-400 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert size={28} />
        </div>
        <h2 className="text-xl font-bold text-white">Administrator Access Required</h2>
        <p className="text-xs text-gray-400 leading-relaxed">
          Your current role (<span className="capitalize font-semibold text-gray-200">{role}</span>) does not have permission to access this administration section.
        </p>
        <div className="pt-2">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-xl transition-all shadow-md"
          >
            <ArrowLeft size={15} />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminOnlyRoute;
