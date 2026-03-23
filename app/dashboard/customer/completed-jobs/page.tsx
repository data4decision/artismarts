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
  FaMapMarkerAlt, 
  FaCalendarAlt,
  FaCommentDots,
  FaArrowRight
} from 'react-icons/fa'
import Link from 'next/link'
import Image from 'next/image'

interface CompletedJob {
  id: string
  title: string
  description: string
  location: string
  status: string
  completed_at: string | null
  completion_note: string | null
  completion_photo_urls: string[]
  artisan: {
    first_name: string | null
    last_name: string | null
  } | null
}

export default function CustomerCompletedJobs() {
  const router = useRouter()
  const [jobs, setJobs] = useState<CompletedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCompletedJobs()
  }, [])

  const fetchCompletedJobs = async () => {
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
          location,
          status,
          completed_at,
          completion_note,
          completion_photo_urls,
          assigned_artisan_id (first_name, last_name)
        `)
        .eq('customer_id', user.id)
        .in('status', ['completed_pending_review', 'completed'])
        .order('completed_at', { ascending: false })

      if (error) throw error

      const typedJobs: CompletedJob[] = (data || []).map((item: any) => ({
        id: String(item.id || ''),
        title: String(item.title || 'Untitled Job'),
        description: String(item.description || ''),
        location: String(item.location || 'Not specified'),
        status: String(item.status || ''),
        completed_at: item.completed_at || null,
        completion_note: item.completion_note || null,
        completion_photo_urls: Array.isArray(item.completion_photo_urls) 
          ? item.completion_photo_urls 
          : [],
        artisan: item.assigned_artisan_id ? {
          first_name: item.assigned_artisan_id.first_name || null,
          last_name: item.assigned_artisan_id.last_name || null,
        } : null,
      }))

      setJobs(typedJobs)
    } catch (err: any) {
      console.error('Fetch completed jobs error:', err)
      setError(err.message || 'Failed to load completed jobs')
      toast.error('Could not load your completed jobs')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--blue)]">
              My Completed Jobs
            </h1>
            <p className="mt-2 text-gray-600">
              Jobs that have been finished and reviewed
            </p>
          </div>

          <button
            onClick={fetchCompletedJobs}
            disabled={loading}
            className="px-6 py-3 bg-[var(--orange)] text-white rounded-xl hover:bg-orange-600 transition flex items-center gap-2 disabled:opacity-50 shadow-md"
          >
            <FaRedo className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="relative flex items-center justify-center">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-[var(--orange)] border-opacity-70 shadow-lg"></div>
              <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                <div className="bg-white rounded-full p-3 shadow-md">
                  <Image
                    src="/log.png"
                    width={56}
                    height={56}
                    alt="Loading..."
                    className="object-contain"
                  />
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

        {/* Completed Jobs List */}
        {!loading && !error && (
          <>
            {jobs.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border p-12 text-center text-gray-500">
                <FaCheckCircle className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No completed jobs yet
                </h3>
                <p className="mb-6">
                  When a job is finished and reviewed by you, it will appear here with all details.
                </p>
                <Link
                  href="/dashboard/customer/requests"  // ← or /dashboard/customer/active-jobs / pending jobs route
                  className="inline-flex items-center px-6 py-3 bg-[var(--blue)] text-white rounded-xl hover:bg-blue-700 transition shadow-md"
                >
                  View My Active / Pending Jobs
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {jobs.map(job => (
                  <div
                    key={job.id}
                    className="bg-gradient-to-r from-green-50 to-white rounded-2xl shadow-lg border border-green-200 p-6 hover:shadow-xl transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                            {job.status === 'completed' ? 'Completed & Approved' : 'Pending Final Review'}
                          </span>
                          {job.completed_at && (
                            <span className="text-sm text-gray-600 flex items-center gap-2">
                              <FaCalendarAlt />
                              {new Date(job.completed_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <h3 className="text-xl font-semibold text-[var(--blue)] mb-2">
                          {job.title}
                        </h3>

                        <p className="text-gray-700 mb-4 line-clamp-3">
                          {job.description}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-2">
                            <FaMapMarkerAlt className="text-[var(--orange)]" />
                            {job.location}
                          </div>

                          {job.artisan && (
                            <div className="flex items-center gap-2">
                              <FaUserTie className="text-[var(--orange)]" />
                              {job.artisan.first_name} {job.artisan.last_name}
                            </div>
                          )}

                          {job.completion_note && (
                            <div className="flex items-center gap-2 text-green-700 font-medium">
                              <FaCommentDots />
                              Note from artisan
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 min-w-[240px]">
                        <Link
                          href={`/dashboard/customer/completed-jobs/${job.id}`}   // ← correct dynamic link to detail page
                          className="px-6 py-3.5 bg-[var(--blue)] hover:bg-blue-700 text-white rounded-xl transition flex items-center justify-center gap-2 font-medium shadow-md text-base"
                        >
                          <FaArrowRight />
                          View Job Details
                        </Link>

                        {job.completion_photo_urls.length > 0 && (
                          <div className="px-6 py-3.5 bg-green-100 text-green-800 rounded-xl text-center font-medium shadow-sm flex items-center justify-center gap-2">
                            <FaImage />
                            {job.completion_photo_urls.length} Completion Photo{job.completion_photo_urls.length !== 1 ? 's' : ''}
                          </div>
                        )}
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