import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, AlertCircle, Loader2, Mail, Lock } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const { user, loading, signInWithEmail } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // If already authenticated AS ADMIN, skip the form and go straight to dashboard.
  // If authenticated as a regular user, do nothing — let them submit the form
  // which will show "Access denied" rather than silently redirecting away.
  useEffect(() => {
    if (!loading && user && user.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const { user: signedInUser, profile, error: signInErr } = await signInWithEmail(email.trim(), password);

      if (signInErr) {
        const errMsg = (signInErr instanceof Error ? signInErr.message : String(signInErr)).toLowerCase();
        if (errMsg.includes('invalid login credentials') || errMsg.includes('invalid credentials')) {
          setError('Invalid email or password.');
        } else if (errMsg.includes('user not found')) {
          setError('No account found with this email.');
        } else {
          setError((signInErr instanceof Error ? signInErr.message : null) || 'An error occurred. Please try again.');
        }
        return;
      }

      if (!signedInUser) {
        setError('Login failed. Please try again.');
        return;
      }

      // Check role from profile — role === 'admin' is the only gate
      const role = profile?.role || 'user';
      if (role !== 'admin') {
        setError('Access denied. This portal is restricted to administrators only.');
        return;
      }

      navigate('/admin/dashboard', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  // Show spinner while checking existing session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] px-4">
      <div className="w-full max-w-md bg-[#1c1c1c] rounded-2xl p-8 border border-gray-800 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-3 flex flex-col items-center">
          <img
            src="/logo.png"
            alt="Late Khabar"
            className="h-20 w-auto object-contain drop-shadow-md mx-auto"
          />
          <h1 className="text-xl font-bold font-headline-md text-white">
            Editorial Management Portal
          </h1>
          <p className="text-xs text-gray-400">
            Secure admin access for journalists and chief editors.
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs flex items-center gap-2.5">
            <AlertCircle size={16} className="flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
              Admin Email
            </label>
            <div className="relative">
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email"
                disabled={submitting}
                className="w-full border border-gray-700 rounded-xl p-2.5 pl-10 text-sm bg-gray-900 text-white outline-none focus:border-primary transition-colors disabled:opacity-60"
                required
                autoComplete="email"
              />
              <Mail size={15} className="absolute left-3.5 top-3 text-gray-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                disabled={submitting}
                className="w-full border border-gray-700 rounded-xl p-2.5 pl-10 text-sm bg-gray-900 text-white outline-none focus:border-primary transition-colors disabled:opacity-60"
                required
                autoComplete="current-password"
              />
              <Lock size={15} className="absolute left-3.5 top-3 text-gray-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-red-700 shadow-lg transition-all disabled:opacity-60 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <KeyRound size={16} />
                <span>Enter Admin Dashboard</span>
              </>
            )}
          </button>
        </form>

        {/* Links */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
          <Link
            to="/forgot-password"
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Forgot password?
          </Link>
          <Link
            to="/"
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            ← Back to site
          </Link>
        </div>
      </div>
    </div>
  );
};
