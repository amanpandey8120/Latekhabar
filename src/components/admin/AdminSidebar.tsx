import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  FolderTree,
  Users,
  LogOut,
  Home,
  BarChart3,
  ImageIcon,
  Newspaper,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStaffAccess } from '../../context/StaffAccessContext';

export const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { role } = useStaffAccess();

  const isFullAdmin = role === 'admin';

  const links = isFullAdmin
    ? [
        { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/news', label: 'News Feed', icon: Newspaper },
        { path: '/admin/articles', label: 'Manage Articles', icon: FileText },
        { path: '/admin/articles/create', label: 'Publish Article', icon: PlusCircle },
        { path: '/admin/categories', label: 'Categories', icon: FolderTree },
        { path: '/admin/media', label: 'Media', icon: ImageIcon },
        { path: '/admin/users', label: 'Users & Roles', icon: Users },
        { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      ]
    : [
        { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/articles', label: 'My Articles', icon: FileText },
        { path: '/admin/articles/create', label: 'Publish Article', icon: PlusCircle },
      ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login', { replace: true });
  };

  const getRoleBadgeStyle = () => {
    if (role === 'admin') return 'bg-red-950 text-red-400 border border-red-800/60';
    if (role === 'author') return 'bg-purple-950 text-purple-300 border border-purple-800/60';
    return 'bg-blue-950 text-blue-300 border border-blue-800/60';
  };

  const roleDisplayName = role === 'admin' ? 'Admin' : role === 'author' ? 'Author' : 'Writer';

  return (
    <aside className="w-64 bg-[#181a1b] text-gray-200 border-r border-gray-800 flex flex-col justify-between flex-shrink-0 min-h-screen">
      <div>
        {/* Logo + badge */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="Late Khabar" className="h-10 w-auto object-contain" />
          </Link>
          <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${getRoleBadgeStyle()}`}>
            {roleDisplayName}
          </span>
        </div>

        {/* Staff user info */}
        {user && (
          <div className="px-5 py-3 border-b border-gray-800/60 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full overflow-hidden bg-primary flex-shrink-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-200 truncate">{user.fullName}</p>
              <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="p-4 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.path === '/admin/dashboard'
                ? location.pathname === '/admin/dashboard' || location.pathname === '/admin'
                : location.pathname === link.path;
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
                <Icon size={16} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom actions */}
      <div className="p-4 border-t border-gray-800 space-y-1.5">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Home size={15} />
          <span>Back to Live Site</span>
        </Link>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 rounded-lg hover:bg-red-950/40 transition-colors cursor-pointer"
        >
          <LogOut size={15} />
          <span>Exit &amp; Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
