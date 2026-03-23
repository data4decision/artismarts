'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  FaSpinner, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaRedo, 
  FaImage, 
  FaUserTie, 
  FaUsers, 
  FaCalendarAlt,
  FaEye,
  FaFilter
} from 'react-icons/fa'
import Link from 'next/link'
import Image from 'next/image'

interface CompletedJob {
  id: string
  title: string
  customer: {
    first_name: string | null
    last_name: string | null
  } | null
  artisan: {
    first_name: string | null
    last_name: string | null
  } | null
  status: string
  completed_at: string | null
  completion_photo_urls: string[]
}

export default function AdminCompletedJobs() {
  const router = useRouter()
  const [jobs, setJobs] = useState<CompletedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending_review' | 'completed'>('all')

  useEffect(() => {
    fetchCompletedJobs()
  }, [])

  const fetchCompletedJobs = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in as admin')
        router.replace('/login')
        return
      }

      // Optional: add admin role check if needed
      // const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      // if (profile?.role !== 'admin') throw new Error('Unauthorized')

      let query = supabase
        .from('job_requests')
        .select(`
          id,
          title,
          status,
          completed_at,
          completion_photo_urls,
          customer:customer_id (first_name, last_name),
          artisan:assigned_artisan_id (first_name, last_name)
        `)
        .in('status', ['completed_pending_review', 'completed'])
        .order('completed_at', { ascending: false, nullsFirst: false })

      const { data, error } = await query

      if (error) throw error

      const typedJobs: CompletedJob[] = (data || []).map((item: any) => ({
        id: String(item.id || ''),
        title: String(item.title || 'Untitled Job'),
        customer: item.customer ? {
          first_name: item.customer.first_name || null,
          last_name: item.customer.last_name || null,
        } : null,
        artisan: item.artisan ? {
          first_name: item.artisan.first_name || null,
          last_name: item.artisan.last_name || null,
        } : null,
        status: String(item.status || ''),
        completed_at: item.completed_at || null,
        completion_photo_urls: Array.isArray(item.completion_photo_urls) 
          ? item.completion_photo_urls 
          : [],
      }))

      setJobs(typedJobs)
    } catch (err: any) {
      console.error('Fetch completed jobs error:', err)
      setError(err.message || 'Failed to load completed jobs')
      toast.error('Could not load completed jobs')
    } finally {
      setLoading(false)
    }
  }

  const filteredJobs = jobs.filter(job => {
    if (filter === 'pending_review') return job.status === 'completed_pending_review'
    if (filter === 'completed') return job.status === 'completed'
    return true // 'all'
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--blue)]">
              Admin – Completed Jobs
            </h1>
            <p className="mt-2 text-gray-600">
              Overview of all jobs marked complete by artisans
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchCompletedJobs}
              disabled={loading}
              className="px-6 py-3 bg-[var(--orange)] text-white rounded-xl hover:bg-orange-600 transition flex items-center gap-2 disabled:opacity-50 shadow-md"
            >
              <FaRedo className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>

            <div className="flex items-center gap-2 bg-white rounded-xl shadow-sm border px-4 py-2">
              <FaFilter className="text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="bg-transparent focus:outline-none text-gray-700 font-medium"
              >
                <option value="all">All Completed</option>
                <option value="pending_review">Pending Review</option>
                <option value="completed">Fully Approved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="relative flex items-center justify-center">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-[var(--orange)] border-opacity-70 shadow-lg"></div>
              <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                <div className="bg-white rounded-full p-3 shadow-md">
                  <Image src="/log.png" width={56} height={56} alt="Loading..." className="object-contain" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
            <p className="text-red-700 font-medium">{error}</p>
            <button
              onClick={fetchCompletedJobs}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Jobs List */}
        {!loading && !error && (
          <>
            {filteredJobs.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border p-12 text-center text-gray-500">
                <FaCheckCircle className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No completed jobs found
                </h3>
                <p className="mb-6">
                  {filter === 'all' 
                    ? 'No jobs have been marked complete yet.'
                    : filter === 'pending_review'
                    ? 'No jobs are currently pending review.'
                    : 'No jobs have been fully approved yet.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.map(job => (
                  <div
                    key={job.id}
                    className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Photo Preview */}
                    <div className="relative h-48 bg-gray-100">
                      {job.completion_photo_urls.length > 0 ? (
                        <Image
                          src={job.completion_photo_urls[0]}
                          alt="Completion preview"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">
                          <FaImage className="text-6xl opacity-50" />
                        </div>
                      )}
                      {job.completion_photo_urls.length > 1 && (
                        <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                          +{job.completion_photo_urls.length - 1}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-[var(--blue)] mb-3 line-clamp-1">
                        {job.title}
                      </h3>

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <FaUserTie className="text-[var(--orange)]" />
                          <span>Customer: {job.customer?.first_name} {job.customer?.last_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaUserTie className="text-[var(--orange)]" />
                          <span>Artisan: {job.artisan?.first_name} {job.artisan?.last_name}</span>
                        </div>
                        {job.completed_at && (
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt className="text-[var(--orange)]" />
                            <span>Completed: {new Date(job.completed_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          job.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {job.status === 'completed' ? 'Approved' : 'Pending Review'}
                        </span>

                        <Link
                          href={`/admin-dashboard/completed-job/${job.id}`}
                          className="flex items-center gap-2 text-[var(--blue)] hover:text-[var(--orange)] transition font-medium"
                        >
                          <FaEye size={16} />
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}