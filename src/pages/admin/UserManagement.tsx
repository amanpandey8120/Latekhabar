import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { DbProfile } from '../../types/database';
import { AddUserModal } from '../../components/admin/AddUserModal';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';
import { adminDeleteUser, adminUpdateUserRole } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  ShieldCheck,
  User as UserIcon,
  PenLine,
  BookOpen,
  Loader2,
  AlertCircle,
  RefreshCw,
  MapPin,
  Globe,
  UserPlus,
  Trash2,
  Check,
  X,
} from 'lucide-react';

type UserRole = 'user' | 'admin' | 'author' | 'writer';

/** Role badge styling */
const ROLE_META: Record<UserRole, { label: string; badgeClass: string; Icon: React.ElementType }> = {
  admin:  { label: 'Admin',  badgeClass: 'bg-red-950 text-red-400',      Icon: ShieldCheck },
  author: { label: 'Author', badgeClass: 'bg-blue-950 text-blue-400',    Icon: BookOpen },
  writer: { label: 'Writer', badgeClass: 'bg-violet-950 text-violet-400', Icon: PenLine },
  user:   { label: 'User',   badgeClass: 'bg-gray-800 text-gray-400',    Icon: UserIcon },
};

/**
 * UserManagement â€” /admin/users
 *
 * Lists public.profiles via Supabase (RLS-gated â€” only rows the admin's
 * policy permits are returned). Provides "Add User", "Change Role", and
 * "Delete User" flows. Role changes go directly to public.profiles â€” the
 * protect_profile_role() trigger + RLS ensures only admins can do this.
 * User creation and deletion call Edge Functions â€” the service-role key
 * never touches the browser.
 */
export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [profiles, setProfiles] = useState<DbProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Delete User modal states
  const [userToDelete, setUserToDelete] = useState<DbProfile | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Inline role-edit states
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<UserRole>('user');
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    setLoading(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      setProfiles([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error: dbErr } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, role, language, state, city, created_at')
        .order('created_at', { ascending: false });

      if (dbErr) {
        console.warn('UserManagement fetch error:', dbErr);
        setError(dbErr.message || 'Failed to load users.');
        setProfiles([]);
      } else {
        setProfiles((data ?? []) as DbProfile[]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeletingId(userToDelete.id);
    setDeleteError(null);

    const result = await adminDeleteUser(userToDelete.id);

    if (result.error) {
      setDeleteError(result.error);
      setDeletingId(null);
    } else {
      setProfiles((prev) => prev.filter((p) => p.id !== userToDelete.id));
      setDeletingId(null);
      setUserToDelete(null);
      setDeleteError(null);
      fetchProfiles();
    }
  };

  const startEditRole = (p: DbProfile) => {
    setEditingRoleId(p.id);
    setPendingRole((p.role ?? 'user') as UserRole);
    setRoleError(null);
  };

  const cancelEditRole = () => {
    setEditingRoleId(null);
    setRoleError(null);
  };

  const saveRole = async (targetId: string) => {
    setSavingRoleId(targetId);
    setRoleError(null);

    const result = await adminUpdateUserRole(targetId, pendingRole);

    if (result.error) {
      setRoleError(result.error);
    } else {
      setProfiles((prev) =>
        prev.map((p) => (p.id === targetId ? { ...p, role: pendingRole } : p))
      );
      setEditingRoleId(null);
    }

    setSavingRoleId(null);
  };

  const filtered = profiles.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (p.full_name ?? '').toLowerCase().includes(q) ||
      (p.email ?? '').toLowerCase().includes(q) ||
      (p.state ?? '').toLowerCase().includes(q) ||
      (p.city ?? '').toLowerCase().includes(q)
    );
  });

  const adminCount  = profiles.filter((p) => p.role === 'admin').length;
  const authorCount = profiles.filter((p) => p.role === 'author').length;
  const writerCount = profiles.filter((p) => p.role === 'writer').length;
  const userCount   = profiles.filter((p) => p.role === 'user').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* â”€â”€ Page header â”€â”€ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-headline-md text-white flex items-center gap-2">
            <Users size={22} className="text-primary" />
            User Management
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            View, create, change roles, and delete users.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSupabaseConfigured() && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors shadow-lg cursor-pointer"
            >
              <UserPlus size={14} />
              Add User
            </button>
          )}

          <button
            onClick={fetchProfiles}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* â”€â”€ Summary pills â”€â”€ */}
      {!loading && !error && (
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1c1c1c] border border-gray-800 rounded-lg text-xs">
            <Users size={13} className="text-blue-400" />
            <span className="text-gray-400">Total:</span>
            <span className="font-bold text-white">{profiles.length}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1c1c1c] border border-gray-800 rounded-lg text-xs">
            <ShieldCheck size={13} className="text-red-400" />
            <span className="text-gray-400">Admins:</span>
            <span className="font-bold text-red-300">{adminCount}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1c1c1c] border border-gray-800 rounded-lg text-xs">
            <BookOpen size={13} className="text-blue-400" />
            <span className="text-gray-400">Authors:</span>
            <span className="font-bold text-blue-300">{authorCount}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1c1c1c] border border-gray-800 rounded-lg text-xs">
            <PenLine size={13} className="text-violet-400" />
            <span className="text-gray-400">Writers:</span>
            <span className="font-bold text-violet-300">{writerCount}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1c1c1c] border border-gray-800 rounded-lg text-xs">
            <UserIcon size={13} className="text-gray-400" />
            <span className="text-gray-400">Readers:</span>
            <span className="font-bold text-white">{userCount}</span>
          </div>
        </div>
      )}

      {/* â”€â”€ Search â”€â”€ */}
      {!loading && !error && profiles.length > 0 && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or locationâ€¦"
          className="w-full max-w-sm border border-gray-700 rounded-lg px-4 py-2 text-sm bg-[#1c1c1c] text-white placeholder-gray-500 outline-none focus:border-primary"
        />
      )}

      {/* â”€â”€ Role error banner â”€â”€ */}
      {roleError && (
        <div className="flex items-center gap-3 p-3 bg-red-950/40 border border-red-800 rounded-xl text-red-300 text-xs">
          <AlertCircle size={15} className="flex-shrink-0" />
          <p>{roleError}</p>
          <button onClick={() => setRoleError(null)} className="ml-auto text-red-400 hover:text-red-200">
            <X size={13} />
          </button>
        </div>
      )}

      {/* â”€â”€ Loading â”€â”€ */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-500 gap-3">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Loading usersâ€¦</span>
        </div>
      )}

      {/* â”€â”€ DB error â”€â”€ */}
      {!loading && error && (
        <div className="flex items-center gap-3 p-4 bg-red-950/40 border border-red-800 rounded-xl text-red-300 text-sm">
          <AlertCircle size={18} className="flex-shrink-0" />
          <div>
            <p className="font-semibold">Failed to load users</p>
            <p className="text-xs text-red-400 mt-0.5">{error}</p>
            <p className="text-xs text-red-500 mt-1">
              Ensure the admin RLS policy on <code>public.profiles</code> allows SELECT for role = 'admin'.
            </p>
          </div>
        </div>
      )}

      {/* â”€â”€ Unconfigured Supabase warning â”€â”€ */}
      {!loading && !error && !isSupabaseConfigured() && (
        <div className="flex items-center gap-3 p-4 bg-yellow-950/40 border border-yellow-800 rounded-xl text-yellow-300 text-sm">
          <AlertCircle size={18} className="flex-shrink-0" />
          <p>
            Supabase is not configured. Set <code>VITE_SUPABASE_URL</code> and{' '}
            <code>VITE_SUPABASE_ANON_KEY</code> in your <code>.env</code> file.
          </p>
        </div>
      )}

      {/* â”€â”€ Empty state â”€â”€ */}
      {!loading && !error && isSupabaseConfigured() && filtered.length === 0 && (
        <div className="py-12 text-center text-gray-500 text-sm">
          {search ? 'No users match your search.' : 'No users found.'}
        </div>
      )}

      {/* â”€â”€ Users table â”€â”€ */}
      {!loading && !error && filtered.length > 0 && (
        <div className="bg-[#1c1c1c] rounded-2xl border border-gray-800 overflow-x-auto shadow-xl">
          <table className="w-full text-left text-xs text-gray-300 min-w-[640px]">
            <thead className="bg-[#141414] text-gray-400 font-bold uppercase tracking-wider border-b border-gray-800">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Email</th>
                <th className="p-4">Location</th>
                <th className="p-4">Language</th>
                <th className="p-4">Role</th>
                <th className="p-4">Joined</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((p) => {
                const role = (p.role ?? 'user') as UserRole;
                const meta = ROLE_META[role] ?? ROLE_META.user;
                const RoleIcon = meta.Icon;
                const isEditingThis = editingRoleId === p.id;
                const isSavingThis  = savingRoleId === p.id;
                const isSelf        = p.id === currentUser?.id;

                return (
                  <tr key={p.id} className="hover:bg-gray-800/40 transition-colors">

                    {/* User */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {p.avatar_url ? (
                          <img
                            src={p.avatar_url}
                            alt={p.full_name ?? ''}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0 bg-gray-700"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <UserIcon size={14} className="text-primary" />
                          </div>
                        )}
                        <span className="font-semibold text-white truncate max-w-[140px]">
                          {p.full_name || 'â€”'}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="p-4 text-gray-400 truncate max-w-[180px]">
                      {p.email || 'â€”'}
                    </td>

                    {/* Location */}
                    <td className="p-4">
                      {p.city || p.state ? (
                        <span className="flex items-center gap-1 text-gray-400">
                          <MapPin size={11} className="flex-shrink-0" />
                          {[p.city, p.state].filter(Boolean).join(', ')}
                        </span>
                      ) : (
                        <span className="text-gray-600">â€”</span>
                      )}
                    </td>

                    {/* Language */}
                    <td className="p-4">
                      {p.language ? (
                        <span className="flex items-center gap-1 text-gray-400">
                          <Globe size={11} />
                          {p.language === 'hi' ? 'à¤¹à¤¿à¤‚à¤¦à¥€' : 'EN'}
                        </span>
                      ) : (
                        <span className="text-gray-600">â€”</span>
                      )}
                    </td>

                    {/* Role â€” inline editable for non-self rows */}
                    <td className="p-4">
                      {isEditingThis ? (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={pendingRole}
                            onChange={(e) => setPendingRole(e.target.value as UserRole)}
                            className="text-[11px] bg-[#111] border border-gray-700 rounded px-2 py-1 text-white outline-none focus:border-primary cursor-pointer"
                            disabled={isSavingThis}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="author">Author</option>
                            <option value="writer">Writer</option>
                          </select>
                          <button
                            onClick={() => saveRole(p.id)}
                            disabled={isSavingThis}
                            className="p-1 text-green-400 hover:text-green-300 hover:bg-green-950/40 rounded transition-colors disabled:opacity-50 cursor-pointer"
                            title="Save role"
                          >
                            {isSavingThis ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                          </button>
                          <button
                            onClick={cancelEditRole}
                            disabled={isSavingThis}
                            className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded transition-colors disabled:opacity-50 cursor-pointer"
                            title="Cancel"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => !isSelf && startEditRole(p)}
                          disabled={isSelf}
                          title={isSelf ? 'Cannot change your own role' : `Change role for ${p.full_name || p.email}`}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${meta.badgeClass} ${!isSelf ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default opacity-70'}`}
                        >
                          <RoleIcon size={10} />
                          {meta.label}
                        </button>
                      )}
                    </td>

                    {/* Joined */}
                    <td className="p-4 text-gray-500">
                      {p.created_at
                        ? new Date(p.created_at).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })
                        : 'â€”'}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      {isSelf ? (
                        <span className="inline-block text-[11px] text-gray-500 font-medium italic px-2 py-1 bg-gray-800/50 rounded">
                          (Your Account)
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setUserToDelete(p);
                            setDeleteError(null);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                          title={`Delete user ${p.full_name || p.email}`}
                          aria-label={`Delete user ${p.full_name || p.email}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* â”€â”€ Security note â”€â”€ */}
      {!loading && !error && profiles.length > 0 && (
        <p className="text-xs text-gray-600 text-center">
          Role changes are gated by RLS and the protect_profile_role() trigger â€” only admins can promote roles.
          User creation and deletion are executed via secure Edge Functions â€” the service-role key never leaves the server.
        </p>
      )}

      {/* â”€â”€ Add User Modal â”€â”€ */}
      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchProfiles}
        />
      )}

      {/* â”€â”€ Delete Confirmation Modal â”€â”€ */}
      {userToDelete && (
        <DeleteConfirmModal
          userName={userToDelete.full_name || ''}
          userEmail={userToDelete.email || ''}
          deleting={deletingId === userToDelete.id}
          error={deleteError || ''}
          onCancel={() => {
            if (deletingId) return;
            setUserToDelete(null);
            setDeleteError(null);
          }}
          onConfirm={handleDeleteUser}
        />
      )}
    </div>
  );
};
