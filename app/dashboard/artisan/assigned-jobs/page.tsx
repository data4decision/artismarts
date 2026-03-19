'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  FaSpinner, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaUserTie, 
  FaMapMarkerAlt, 
  FaDollarSign, 
  FaClock, 
  FaCommentDots, 
  FaRedo, 
  FaUpload,
  FaPlayCircle
} from 'react-icons/fa'
import Link from 'next/link'
import Image from 'next/image'

interface AssignedJob {
  id: string
  title: string
  description: string
  budget_min: number | null
  budget_max: number | null
  job_type: string | null
  duration: string | null
  location: string
  preferred_date: string | null
  preferred_time: string | null
  status: string
  created_at: string
  customer: {
    first_name: string | null
    last_name: string | null
    phone: string | null
  } | null
  decline_reason?: string | null
}

export default function ArtisanAssignedJobs() {
  const router = useRouter()
  const [jobs, setJobs] = useState<AssignedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [declineModalOpen, setDeclineModalOpen] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState('')

  useEffect(() => {
    fetchAssignedJobs()
  }, [])

  const fetchAssignedJobs = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in')
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
          job_type,
          duration,
          location,
          preferred_date,
          preferred_time,
          status,
          created_at,
          customer:customer_id (first_name, last_name, phone),
          decline_reason
        `)
        .eq('assigned_artisan_id', user.id)
        .in('status', ['assigned', 'in_progress', 'completed_pending_review', 'completed'])
        .order('created_at', { ascending: false })

      if (error) throw error

      const typedJobs: AssignedJob[] = (data || []).map((item: any) => ({
        id: String(item.id || ''),
        title: String(item.title || ''),
        description: String(item.description || ''),
        budget_min: item.budget_min != null ? Number(item.budget_min) : null,
        budget_max: item.budget_max != null ? Number(item.budget_max) : null,
        job_type: item.job_type ? String(item.job_type) : null,
        duration: item.duration ? String(item.duration) : null,
        location: String(item.location || ''),
        preferred_date: item.preferred_date ? String(item.preferred_date) : null,
        preferred_time: item.preferred_time ? String(item.preferred_time) : null,
        status: String(item.status || 'assigned'),
        created_at: String(item.created_at || ''),
        customer: item.customer ? {
          first_name: item.customer.first_name != null ? String(item.customer.first_name) : null,
          last_name: item.customer.last_name != null ? String(item.customer.last_name) : null,
          phone: item.customer.phone != null ? String(item.customer.phone) : null,
        } : null,
        decline_reason: item.decline_reason ? String(item.decline_reason) : null,
      }))

      setJobs(typedJobs)
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError(err.message || 'Failed to load your assigned jobs')
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (jobId: string) => {
    if (!confirm('Accept this job?')) return

    setUpdating(jobId)

    try {
      const { error } = await supabase
        .from('job_requests')
        .update({
          status: 'in_progress',
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)

      if (error) throw error

      toast.success('Job accepted successfully!', { duration: 3000 })

      setTimeout(() => {
        router.push(`/dashboard/artisan/jobs/${jobId}/active`)
      }, 1200)

      fetchAssignedJobs()
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept job')
    } finally {
      setUpdating(null)
    }
  }

  const handleDecline = async (jobId: string) => {
    if (!declineReason.trim()) {
      toast.error('Please provide a reason for declining')
      return
    }

    setUpdating(jobId)

    try {
      const { error } = await supabase
        .from('job_requests')
        .update({
          assigned_artisan_id: null,
          status: 'pending',
          decline_reason: declineReason.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)

      if (error) throw error

      toast.success('Job declined and returned to pool')
      setDeclineModalOpen(null)
      setDeclineReason('')
      fetchAssignedJobs()
    } catch (err: any) {
      toast.error(err.message || 'Failed to decline job')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--blue)]">
              My Assigned Jobs
            </h1>
            <p className="mt-2 text-[var(--blue)]">
              Jobs waiting for your action or feedback
            </p>
          </div>

          <button
            onClick={fetchAssignedJobs}
            disabled={loading}
            className="px-6 py-3 bg-[var(--orange)] text-[var(--white)] rounded-xl hover:bg-[var(--orange)] transition flex items-center gap-2 disabled:opacity-50 shadow-md"
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
                <div className="bg-[var(--white)] rounded-full p-3 shadow-md">
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
              onClick={fetchAssignedJobs}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Jobs List */}
        {!loading && !error && (
          <>
            {jobs.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border p-12 text-center text-[var(--blue)]">
                <FaExclamationTriangle className="text-6xl text-[var(--blue)] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[var(--blue)] mb-2">
                  No assigned jobs yet
                </h3>
                <p className="mb-6">
                  When admin assigns a job to you, it will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {jobs.map(job => (
                  <div
                    key={job.id}
                    className="bg-[var(--white)] rounded-2xl shadow-md border border-[var(--white)] p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-[var(--blue)] mb-2">
                          {job.title}
                        </h3>

                        <p className="text-[var(--blue)] mb-4 line-clamp-3">
                          {job.description}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-[var(--blue)] mb-4">
                          <div className="flex items-center gap-2">
                            <FaDollarSign className="text-[var(--orange)]" />
                            Budget: {job.budget_min ? `₦${job.budget_min.toLocaleString()}` : 'Not specified'}
                            {job.budget_max ? ` – ₦${job.budget_max.toLocaleString()}` : ''}
                          </div>

                          <div className="flex items-center gap-2">
                            <FaClock className="text-[var(--orange)]" />
                            Preferred: {job.preferred_date || 'Anytime'} {job.preferred_time || ''}
                          </div>

                          <div className="flex items-center gap-2">
                            <FaMapMarkerAlt className="text-[var(--orange)]" />
                            {job.location}
                          </div>

                          {job.customer && (
                            <div className="flex items-center gap-2">
                              <FaUserTie className="text-[var(--orange)]" />
                              Customer: {job.customer.first_name} {job.customer.last_name}
                              {job.customer.phone && ` (${job.customer.phone})`}
                            </div>
                          )}
                        </div>

                        {/* Updated Status Display */}
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Status:</span>
                          <span className={`px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 ${
                            job.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                            job.status === 'in_progress' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                            job.status === 'completed_pending_review' ? 'bg-green-100 text-green-800' :
                            job.status === 'completed' ? 'bg-green-600 text-white font-bold' :
                            'bg-gray-100 text-[var(--blue)]'
                          }`}>
                            {job.status === 'assigned' ? (
                              <>Assigned – Action Required</>
                            ) : job.status === 'in_progress' ? (
                              <>Active / In Progress</>
                            ) : job.status === 'completed_pending_review' ? (
                              <>Waiting for Review</>
                            ) : job.status === 'completed' ? (
                              <>
                                <FaCheckCircle className="text-white" />
                                Reviewed
                              </>
                            ) : (
                              job.status
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-3 mt-4 sm:mt-0 min-w-[180px]">
                        {job.status === 'assigned' && (
                          <>
                            <button
                              onClick={() => handleAccept(job.id)}
                              disabled={updating === job.id}
                              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-[var(--white)] rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 font-medium shadow-sm"
                            >
                              {updating === job.id && <FaSpinner className="animate-spin" />}
                              Accept & Start Job
                            </button>

                            <button
                              onClick={() => setDeclineModalOpen(job.id)}
                              disabled={updating === job.id}
                              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-[var(--white)] rounded-xl transition disabled:opacity-50 font-medium shadow-sm"
                            >
                              Decline Job
                            </button>
                          </>
                        )}

                        {job.status === 'in_progress' && (
                          <Link
                            href={`/dashboard/artisan/jobs/${job.id}/active`}
                            className="px-6 py-3 bg-[var(--blue)] hover:bg-blue-700 text-[var(--white)] rounded-xl transition flex items-center justify-center gap-2 font-medium shadow-sm"
                          >
                            <FaPlayCircle />
                            View Active Job
                          </Link>
                        )}

                        {job.status === 'completed_pending_review' && (
                          <div className="px-6 py-3 bg-green-100 text-green-800 rounded-xl text-center font-medium shadow-sm">
                            Waiting for customer review
                          </div>
                        )}

                        {job.status === 'completed' && (
                          <div className="px-6 py-3 bg-green-600 text-[var(--white)] rounded-xl text-center font-medium shadow-sm flex items-center justify-center gap-2">
                            <FaCheckCircle />
                            Reviewed by Customer
                          </div>
                        )}

                        <Link
                          href="/dashboard/artisan/messages"
                          className="px-6 py-3 bg-[var(--orange)] hover:bg-[var(--orange)]/80 text-[var(--white)] rounded-xl transition flex items-center justify-center gap-2 font-medium shadow-sm"
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

        {/* Decline Modal */}
        {declineModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-[var(--blue)] mb-4">
                Why are you declining this job?
              </h3>

              <textarea
                value={declineReason}
                onChange={e => setDeclineReason(e.target.value)}
                placeholder="e.g. Too busy, not suitable skillset, location too far, other commitments..."
                rows={4}
                className="w-full px-4 py-3 border border-[var(--blue)]/30 rounded-xl focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] resize-none mb-6"
                required
              />

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setDeclineModalOpen(null)
                    setDeclineReason('')
                  }}
                  className="flex-1 py-3 px-4 bg-[var(--blue)]/20 hover:bg-[var(--blue)]/30 text-[var(--blue)] rounded-xl transition font-medium"
                >
                  Cancel
                </button>

                <button
                  onClick={() => handleDecline(declineModalOpen)}
                  disabled={updating === declineModalOpen || !declineReason.trim()}
                  className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                >
                  {updating === declineModalOpen && <FaSpinner className="animate-spin" />}
                  Confirm Decline
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}