import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, KeyRound, AlertCircle } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const { signInAsAdminMock } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@latekhabar.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      signInAsAdminMock();
      navigate('/admin');
    } else {
      setError('Please provide admin credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] px-4">
      <div className="w-full max-w-md bg-[#1c1c1c] rounded-2xl p-8 border border-gray-800 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-primary/20 text-primary mx-auto flex items-center justify-center">
            <Shield size={24} />
          </div>
          <span className="text-3xl font-display-lg font-bold text-primary">
            Late Khabar
          </span>
          <h2 className="text-xl font-bold font-headline-md text-white">
            Editorial Management Portal
          </h2>
          <p className="text-xs text-gray-400">
            Secure admin access for journalists and chief editors.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded text-xs flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">
              Admin Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-700 rounded-lg p-2.5 text-sm bg-gray-900 text-white outline-none focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-700 rounded-lg p-2.5 text-sm bg-gray-900 text-white outline-none focus:border-primary"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-container shadow-lg transition-all"
          >
            <KeyRound size={16} />
            <span>Enter Admin Dashboard</span>
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => {
              signInAsAdminMock();
              navigate('/admin');
            }}
            className="text-xs text-red-400 hover:underline"
          >
            Bypass for Demo (Instant Admin Login)
          </button>
        </div>
      </div>
    </div>
  );
};
