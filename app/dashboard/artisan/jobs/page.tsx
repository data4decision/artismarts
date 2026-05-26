'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  FaExclamationTriangle, 
  FaPlayCircle,
  FaMapMarkerAlt, 
  FaUserTie, 
  FaRedo,
  FaTools,
  FaCommentDots
} from 'react-icons/fa'
import Link from 'next/link'
import Image from 'next/image'
import { useLiveLocation } from '@/hooks/useLiveLocation'

interface ActiveJob {
  id: string
  title: string
  description: string
  budget_min: number | null
  budget_max: number | null
  location: string
  area: string
  status: string
  created_at: string
  customer: {
    first_name: string | null
    last_name: string | null
    phone: string | null
  } | null
}

export default function ActiveJobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<ActiveJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch jobs
  useEffect(() => {
    fetchActiveJobs()
  }, [])

  const fetchActiveJobs = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in')
        router.replace('/login')
        return
      }

      const { data, error } = await supabase
        .from('job_requests')
        .select(`
          id,
          title,
          description,
          budget_min,
          budget_max,
          location,
          area,
          status,
          created_at,
          customer:customer_id (first_name, last_name, phone)
        `)
        .eq('assigned_artisan_id', user.id)
        .in('status', ['in_progress', 'completed_pending_review'])
        .order('created_at', { ascending: false })

      if (error) throw error

      const typedJobs: ActiveJob[] = (data || []).map((item: any) => ({
        id: String(item.id || ''),
        title: String(item.title || ''),
        description: String(item.description || ''),
        budget_min: item.budget_min != null ? Number(item.budget_min) : null,
        budget_max: item.budget_max != null ? Number(item.budget_max) : null,
        location: String(item.location || ''),
        area: String(item.area || ''),
        status: String(item.status || ''),
        created_at: String(item.created_at || ''),
        customer: item.customer ? {
          first_name: String(item.customer.first_name || ''),
          last_name: String(item.customer.last_name || ''),
          phone: item.customer.phone ? String(item.customer.phone) : null,
        } : null,
      }))

      setJobs(typedJobs)
    } catch (err: any) {
      console.error('Fetch active jobs error:', err)
      setError(err.message || 'Failed to load active jobs')
      toast.error('Could not load active jobs')
    } finally {
      setLoading(false)
    }
  }

  // ==================== LIVE LOCATION HOOKS ====================
  // Call hook for every in-progress job at the top level
  // jobs.forEach((job) => {
  //   const isInProgress = job.status === 'in_progress'
  //   useLiveLocation({
  //     jobRequestId: job.id,
  //     isActive: isInProgress
  //   })
  // })

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--blue)]">
              Active / In-Progress Jobs
            </h1>
            <p className="mt-2 text-gray-600">
              Jobs you are currently working on
            </p>
          </div>

          <button
            onClick={fetchActiveJobs}
            disabled={loading}
            className="px-6 py-3 bg-[var(--orange)] text-white rounded-xl hover:bg-orange-600 transition flex items-center gap-2 disabled:opacity-50 shadow-md"
          >
            <FaRedo className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="min-h-[400px] flex items-center justify-center">
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
            <button onClick={fetchActiveJobs} className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
              Try Again
            </button>
          </div>
        )}

        {/* Jobs List */}
        {!loading && !error && (
          <>
            {jobs.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border p-12 text-center text-gray-500">
                <FaTools className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No active jobs right now</h3>
                <p className="mb-6">Accept an assigned job to start working.</p>
                <Link href="/dashboard/artisan/assigned-jobs" className="inline-flex items-center px-6 py-3 bg-[var(--blue)] text-white rounded-xl hover:bg-blue-700 transition">
                  View Assigned Jobs
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-gradient-to-r from-blue-50 to-white rounded-2xl shadow-lg border border-blue-200 p-6 hover:shadow-xl transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 animate-pulse">
                            {job.status === 'in_progress' ? 'In Progress' : 'Pending Review'}
                          </span>
                          <span className="text-sm text-gray-600">
                            Started {new Date(job.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <h3 className="text-xl font-semibold text-[var(--blue)] mb-2">{job.title}</h3>
                        <p className="text-gray-700 mb-4 line-clamp-3">{job.description}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-2">
                            <FaMapMarkerAlt className="text-[var(--orange)]" />
                            Area: {job.area}
                          </div>
                          <div className="flex items-center gap-2">
                            <FaMapMarkerAlt className="text-[var(--orange)]" />
                            LGA: {job.location}
                          </div>
                          {job.customer && (
                            <div className="flex items-center gap-2">
                              <FaUserTie className="text-[var(--orange)]" />
                              {job.customer.first_name} {job.customer.last_name}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 min-w-[240px]">
                        <Link
                          href={`/dashboard/artisan/jobs/${job.id}/active`}
                          className="px-6 py-3.5 bg-[var(--blue)] hover:bg-blue-700 text-white rounded-xl transition flex items-center justify-center gap-2 font-medium shadow-md"
                        >
                          <FaPlayCircle className="text-lg" />
                          Open Active Workspace
                        </Link>

                        <Link
                          href="/dashboard/artisan/messages"
                          className="px-6 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition flex items-center justify-center gap-2 font-medium shadow-md"
                        >
                          <FaCommentDots size={16} />
                          Chat with Admin
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