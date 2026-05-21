'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { FaTrash, FaUser, FaCalendar } from 'react-icons/fa';

const DeletedAccounts = () => {
  const [deletions, setDeletions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeletedAccounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('account_deletions')
        .select(`
          *,
          profiles!inner(first_name, last_name, role, email)
        `)
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      setDeletions(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load deleted accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedAccounts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--blue)]">Deleted Accounts</h1>
            <p className="text-gray-600">View all accounts that have been deleted by users</p>
          </div>
          <button
            onClick={fetchDeletedAccounts}
            className="px-5 py-2 bg-[var(--blue)] text-white rounded-lg hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-center py-12">Loading deleted accounts...</p>
        ) : deletions.length === 0 ? (
          <p className="text-center py-12 text-gray-500">No deleted accounts yet.</p>
        ) : (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left">User</th>
                  <th className="px-6 py-4 text-left">Role</th>
                  <th className="px-6 py-4 text-left">Reason</th>
                  <th className="px-6 py-4 text-left">Deleted At</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {deletions.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FaUser className="text-gray-400" />
                        <div>
                          <p className="font-medium">
                            {item.profiles?.first_name} {item.profiles?.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{item.profiles?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize px-3 py-1 bg-gray-100 rounded-full text-sm">
                        {item.profiles?.role || item.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {item.reason || 'No reason provided'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(item.deleted_at).toLocaleDateString()} <br />
                      <span className="text-xs">
                        {new Date(item.deleted_at).toLocaleTimeString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeletedAccounts;