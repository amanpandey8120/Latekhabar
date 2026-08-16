import React, { useState } from 'react';
import type { UserProfile } from '../../types';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([
    {
      id: 'usr-1',
      email: 'admin@latekhabar.com',
      fullName: 'Editorial Admin',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
      role: 'admin',
      language: 'en',
      preferredCategories: ['cat-1', 'cat-3'],
      state: 'Delhi',
      city: 'New Delhi',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'usr-2',
      email: 'reader.demo@example.com',
      fullName: 'Demo Reader',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
      role: 'user',
      language: 'hi',
      preferredCategories: ['cat-1', 'cat-4'],
      state: 'Maharashtra',
      city: 'Mumbai',
      createdAt: '2026-03-15T00:00:00Z',
    },
  ]);

  const toggleRole = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, role: u.role === 'admin' ? 'user' : 'admin' } : u
      )
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-bold font-headline-md text-white">User & Role Management</h1>
        <p className="text-xs text-gray-400">View registered subscribers and promote journalists to Admin status.</p>
      </div>

      <div className="bg-[#1c1c1c] rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs text-gray-300">
          <thead className="bg-[#141414] text-gray-400 font-bold uppercase tracking-wider border-b border-gray-800">
            <tr>
              <th className="p-4">User Details</th>
              <th className="p-4">Email</th>
              <th className="p-4">Location</th>
              <th className="p-4">Role</th>
              <th className="p-4 text-right">Toggle Permission</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-800/40">
                <td className="p-4 flex items-center gap-3">
                  <img src={u.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                  <span className="font-bold text-white">{u.fullName}</span>
                </td>
                <td className="p-4 text-gray-400">{u.email}</td>
                <td className="p-4">{u.city || '-'}, {u.state || '-'}</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      u.role === 'admin' ? 'bg-red-950 text-red-400' : 'bg-gray-800 text-gray-300'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => toggleRole(u.id)}
                    className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded text-xs font-semibold"
                  >
                    Set as {u.role === 'admin' ? 'Reader' : 'Admin'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
