import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, PlusCircle, FolderTree, Users, LogOut, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const links = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/articles', label: 'Manage Articles', icon: FileText },
    { path: '/admin/articles/create', label: 'Publish Article', icon: PlusCircle },
    { path: '/admin/categories', label: 'Categories', icon: FolderTree },
    { path: '/admin/users', label: 'Users & Roles', icon: Users },
  ];

  return (
    <aside className="w-64 bg-[#181a1b] text-gray-200 border-r border-gray-800 flex flex-col justify-between flex-shrink-0 min-h-screen">
      <div>
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <Link to="/" className="text-2xl font-display-lg font-bold text-primary dark:text-primary-container">
            Late Khabar
          </Link>
          <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-red-950 text-red-400 rounded">
            Admin
          </span>
        </div>

        <nav className="p-4 space-y-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-800 space-y-2">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-400 hover:text-white rounded hover:bg-gray-800 transition-colors"
        >
          <Home size={16} />
          <span>Back to Live Site</span>
        </Link>

        <button
          onClick={() => {
            signOut();
            navigate('/');
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 rounded hover:bg-red-950/40 transition-colors"
        >
          <LogOut size={16} />
          <span>Exit Admin</span>
        </button>
      </div>
    </aside>
  );
};
