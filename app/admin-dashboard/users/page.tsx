'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { FaTrash, FaBan, FaCommentDots, FaSearch, FaUserTie, FaUsers } from 'react-icons/fa'
import Image from 'next/image'

interface Profile {
  id: string
  first_name: string
  last_name: string
  email: string | null
  role: string
  phone: string | null
  is_blocked: boolean
  created_at: string
}

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchProfiles = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role, phone, is_blocked, created_at')
        .order('created_at', { ascending: false })

      if (error) throw error

      setProfiles(data || [])
    } catch (err: any) {
      console.error('Fetch profiles error:', err)
      toast.error('Failed to load users: ' + (err.message || 'Check console'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfiles()

    // Real-time updates
    const channel = supabase
      .channel('admin-users-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchProfiles()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filteredProfiles = profiles.filter(p =>
    `${p.first_name || ''} ${p.last_name || ''} ${p.email || ''} ${p.role || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  const toggleBlock = async (id: string, currentBlocked: boolean, name: string) => {
    if (!confirm(`${currentBlocked ? 'Unblock' : 'Block'} ${name}?`)) return

    const { error } = await supabase
      .from('profiles')
      .update({ is_blocked: !currentBlocked })
      .eq('id', id)

    if (error) {
      toast.error('Failed to update block status')
      console.error(error)
    } else {
      toast.success(currentBlocked ? 'User unblocked' : 'User blocked')
      fetchProfiles()
    }
  }

  const deleteUser = async (id: string, name: string, role: string) => {
    if (!confirm(`Permanently delete ${role} user ${name}? This cannot be undone.`)) return

    try {
      // Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)

      if (profileError) throw profileError

      // Delete auth user (admin API)
      const { error: authError } = await supabase.auth.admin.deleteUser(id)

      if (authError) throw authError

      toast.success(`${name} (${role}) deleted successfully`)
      fetchProfiles()
    } catch (err: any) {
      console.error('Delete error:', err)
      toast.error('Failed to delete user: ' + (err.message || 'Unknown error'))
    }
  }

//   const startChat = (userId: string, name: string) => {
//   window.location.href = `/admin-dashboard/chat/${userId}`
//   // or better: use Next.js router
//   // router.push(`/admin-dashboard/chat/${userId}`)
// }

  return (
    <div className="p-6 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--blue)]">Manage Users</h1>
            <p className="text-[var(--blue)] mt-1">
              View, block, delete, and chat with all customers and artisans
            </p>
          </div>
          <Link
            href="/admin-dashboard"
            className="px-6 py-3 bg-[var(--orange)] text-white rounded-xl hover:bg-orange-600 transition flex items-center gap-2 shadow-md"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6 relative max-w-md">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--blue)]" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-[var(--blue)] text-[var(--blue)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--orange)]"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden border border-[var(--blue)]">
          {loading ? (
            <div className="min-h-screen bg-gray-50/70 flex items-center justify-center ">
              <div className="relative flex items-center justify-center">
                {/* Outer spinning ring */}
                <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-orange-500 border-opacity-70 shadow-lg"></div>
                {/* Inner logo with pulse */}
                  <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                    <div className="bg-white rounded-full p-3 shadow-md">
                      <Image src="/log.png" width={56} height={56} priority alt="Loading..." className="object-contain" />
                    </div>
                  </div>
                </div>
              </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="p-12 text-center text-[var(--blue)]">
              No users found matching your search
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-[var(--blue)]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[var(--white)]">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[var(--white)]">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[var(--white)]">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[var(--white)]">Status</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-[var(--white)]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--orange)]">
                  {filteredProfiles.map(p => (
                    <tr key={p.id} className="hover:bg-[var(--blue)]/20">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-[var(--blue)]">
                          {p.first_name} {p.last_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--blue)]">
                        {p.email || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          p.role === 'artisan' 
                            ? 'bg-[var(--orange)] text-[var(--blue)]' 
                            : p.role === 'customer' 
                              ? 'bg-[var(--blue)] text-[var(--orange)]' 
                              : 'bg-[var(--orange)] text-[var(--blue)]'
                        }`}>
                          {p.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          p.is_blocked ? 'bg-yellow-100 text-yellow-500' : 'bg-green-100 text-green-800'
                        }`}>
                          {p.is_blocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-3 flex-wrap">
                          <button
                            onClick={() => toggleBlock(p.id, p.is_blocked, `${p.first_name} ${p.last_name}`)}
                            className={`px-3 py-1 rounded text-xs font-medium min-w-[80px] ${
                              p.is_blocked 
                                ? 'bg-green-600 hover:bg-green-700 text-white' 
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                          >
                            {p.is_blocked ? 'Unblock' : 'Block'}
                          </button>

                          {/* <button
                            onClick={() => startChat(p.id, `${p.first_name} ${p.last_name}`)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium min-w-[80px]"
                          >
                            <FaCommentDots className="inline mr-1" /> Chat
                          </button> */}

                          {p.role === 'artisan' && (
                            <button
                              onClick={() => deleteUser(p.id, `${p.first_name} ${p.last_name}`, p.role)}
                              className="px-3 py-1 bg-red-500 hover:bg-red-700 text-white rounded text-xs font-medium min-w-[80px]"
                            >
                              <FaTrash className="inline mr-1" /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <Link href="/admin-dashboard" className="text-[var(--orange)] hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}