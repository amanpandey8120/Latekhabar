import React, { useState, useEffect, useRef } from 'react';
import { LOCATIONS_DATA } from '../../constants/locations';
import { adminCreateUser } from '../../services/adminService';
import type { CreateUserPayload } from '../../services/adminService';
import {
  X,
  User,
  Mail,
  Lock,
  MapPin,
  ShieldCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ChevronDown,
} from 'lucide-react';

interface AddUserModalProps {
  /** Called when the modal should close */
  onClose: () => void;
  /** Called after a user is successfully created — triggers list refresh */
  onSuccess: () => void;
}

const EMPTY_FORM: CreateUserPayload = {
  fullName: '',
  email: '',
  password: '',
  role: 'user',
  state: '',
  city: '',
};

export const AddUserModal: React.FC<AddUserModalProps> = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState<CreateUserPayload>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Trap focus inside modal
  const firstInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const availableCities =
    LOCATIONS_DATA.find((l) => l.state === form.state)?.cities ?? [];

  const setField = <K extends keyof CreateUserPayload>(
    key: K,
    value: CreateUserPayload[K]
  ) => {
    setError('');
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleStateChange = (state: string) => {
    setError('');
    setForm((prev) => ({ ...prev, state, city: '' }));
  };

  const validate = (): string | null => {
    if (!form.fullName.trim()) return 'Full name is required.';
    if (!form.email.trim())    return 'Email address is required.';
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(form.email.trim())) return 'Enter a valid email address.';
    if (!form.password)        return 'Temporary password is required.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setSubmitting(true);
    try {
      const result = await adminCreateUser({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        state: form.state || undefined,
        city: form.city || undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.warning) {
        // Auth user created but profile had an issue — still a partial success
        setSuccess(`User created with a warning: ${result.warning}`);
      } else {
        const name = result.user?.full_name ?? form.email;
        setSuccess(`User "${name}" created successfully.`);
      }

      // Refresh the user list, then close after a short delay
      onSuccess();
      setTimeout(onClose, 1800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  // Input class helper
  const inputCls =
    'w-full border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-sm ' +
    'bg-gray-900 text-white placeholder-gray-500 outline-none ' +
    'focus:border-primary transition-colors disabled:opacity-60';

  const selectCls =
    'w-full appearance-none border border-gray-700 rounded-xl py-2.5 pl-10 pr-8 text-sm ' +
    'bg-gray-900 text-white outline-none focus:border-primary transition-colors disabled:opacity-60';

  return (
    /* ── Backdrop ── */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-user-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* ── Modal panel ── */}
      <div className="w-full max-w-md bg-[#1c1c1c] rounded-2xl border border-gray-800 shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <User size={18} className="text-primary" />
            <h2 id="add-user-title" className="text-base font-bold text-white">
              Add New User
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">

          {/* Alerts */}
          {error && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          <form id="add-user-form" onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                Full Name <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <input
                  ref={firstInputRef}
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setField('fullName', e.target.value)}
                  placeholder="e.g. Ravi Kumar"
                  disabled={submitting}
                  className={inputCls}
                  autoComplete="off"
                />
                <User size={14} className="absolute left-3.5 top-3 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                Email Address <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  placeholder="user@example.com"
                  disabled={submitting}
                  className={inputCls}
                  autoComplete="off"
                />
                <Mail size={14} className="absolute left-3.5 top-3 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* Temporary Password */}
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                Temporary Password <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  placeholder="Min. 6 characters"
                  disabled={submitting}
                  className={`${inputCls} pr-10`}
                  autoComplete="new-password"
                />
                <Lock size={14} className="absolute left-3.5 top-3 text-gray-500 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300 cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-[11px] text-gray-600 mt-1">
                The user can change this after first login.
              </p>
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                Role <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <select
                  value={form.role}
                  onChange={(e) => setField('role', e.target.value as 'user' | 'admin')}
                  disabled={submitting}
                  className={selectCls}
                >
                  <option value="user">Reader (user)</option>
                  <option value="admin">Administrator (admin)</option>
                </select>
                <ShieldCheck size={14} className="absolute left-3.5 top-3 text-gray-500 pointer-events-none" />
                <ChevronDown size={13} className="absolute right-3 top-3 text-gray-500 pointer-events-none" />
              </div>
              {form.role === 'admin' && (
                <p className="text-[11px] text-amber-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} />
                  This user will have full admin portal access.
                </p>
              )}
            </div>

            {/* State */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                  State
                </label>
                <div className="relative">
                  <select
                    value={form.state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    disabled={submitting}
                    className={selectCls}
                  >
                    <option value="">— Select —</option>
                    {LOCATIONS_DATA.map((l) => (
                      <option key={l.state} value={l.state}>{l.state}</option>
                    ))}
                  </select>
                  <MapPin size={14} className="absolute left-3.5 top-3 text-gray-500 pointer-events-none" />
                  <ChevronDown size={13} className="absolute right-3 top-3 text-gray-500 pointer-events-none" />
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                  City
                </label>
                <div className="relative">
                  <select
                    value={form.city}
                    onChange={(e) => setField('city', e.target.value)}
                    disabled={submitting || !form.state}
                    className={selectCls}
                  >
                    <option value="">— Select —</option>
                    {availableCities.map((c) => (
                      <option key={c.nameEn} value={c.nameEn}>{c.nameEn}</option>
                    ))}
                  </select>
                  <MapPin size={14} className="absolute left-3.5 top-3 text-gray-500 pointer-events-none" />
                  <ChevronDown size={13} className="absolute right-3 top-3 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-user-form"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-primary text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60 shadow-lg cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <User size={13} />
                Create User
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
