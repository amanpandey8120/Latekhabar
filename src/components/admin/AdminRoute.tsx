import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2, ShieldOff } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { StaffAccessProvider } from '../../context/StaffAccessContext';

/**
 * AdminRoute / StaffRoute
 *
 * Gate for all /admin/* routes. Performs a fresh, independent check on
 * every mount (login, page-refresh, direct URL navigation, post-logout):
 *
 *   1. getSession()  — verifies a live Supabase session exists.
 *   2. profiles query — fetches profiles.role for the authenticated user ID.
 *
 * Outcomes:
 *   • No session                         → <Navigate to="/admin/login" />
 *   • Profile missing                    → <Navigate to="/" />           (safe deny)
 *   • role NOT IN ('admin','author','writer') → Access Denied UI
 *   • role IN ('admin','author','writer')     → Provides StaffAccessContext & renders <Outlet />
 */

type CheckState = 'loading' | 'allowed' | 'denied_not_staff' | 'denied_no_session' | 'denied_no_profile';

export const AdminRoute: React.FC = () => {
  const [state, setCheckState] = useState<CheckState>('loading');
  const [staffInfo, setStaffInfo] = useState<{ role: 'admin' | 'author' | 'writer'; userId: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      if (!isSupabaseConfigured()) {
        if (!cancelled) setCheckState('denied_no_session');
        return;
      }

      // Step 1: verify an active session exists
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session?.user) {
        if (!cancelled) setCheckState('denied_no_session');
        return;
      }

      const userId = sessionData.session.user.id;

      // Step 2: fetch role directly from public.profiles
      const { data: profileRow, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (cancelled) return;

      if (profileError || !profileRow) {
        setCheckState('denied_no_profile');
        return;
      }

      const role = profileRow.role;
      if (role === 'admin' || role === 'author' || role === 'writer') {
        setStaffInfo({ role, userId });
        setCheckState('allowed');
      } else {
        setCheckState('denied_not_staff');
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  // ── No session → admin login ─────────────────────────────────────────────
  if (state === 'denied_no_session') {
    return <Navigate to="/admin/login" replace />;
  }

  // ── Profile row missing → home (safe deny) ───────────────────────────────
  if (state === 'denied_no_profile') {
    return <Navigate to="/" replace />;
  }

  // ── Authenticated but role is not staff (admin/author/writer) ────────────
  if (state === 'denied_not_staff' || !staffInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#121212] text-center px-6 gap-4">
        <ShieldOff size={48} className="text-red-500" />
        <h1 className="text-2xl font-bold text-white">Access Denied</h1>
        <p className="text-gray-400 text-sm max-w-sm">
          You do not have staff privileges. Access requires an authorized account
          (Admin, Author, or Writer) verified in the database.
        </p>
        <a
          href="/"
          className="mt-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
        >
          Return to Homepage
        </a>
      </div>
    );
  }

  // ── Staff allowed → render child routes with StaffAccessContext ───────────
  return (
    <StaffAccessProvider value={staffInfo}>
      <Outlet />
    </StaffAccessProvider>
  );
};

export const StaffRoute = AdminRoute;
export default AdminRoute;
