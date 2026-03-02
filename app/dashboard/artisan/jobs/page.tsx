// app/dashboard/artisan/jobs/page.tsx
'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
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
  FaImage,
  FaCalendarCheck,
  FaUpload
} from 'react-icons/fa'
import Link from 'next/link'
import Image from 'next/image'

interface Customer {
  first_name: string | null
  last_name: string | null
  phone: string | null
}

interface Job {
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
  updated_at: string | null
  completion_photo_urls: string[] | null
  customer: Customer | null
  decline_reason?: string | null
}

type Tab = 'assigned' | 'completed'

export default function ArtisanJobsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('assigned')
  const [assignedJobs, setAssignedJobs] = useState<Job[]>([])
  const [completedJobs, setCompletedJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [declineModalOpen, setDeclineModalOpen] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState('')
  const [selectedCompletedJob, setSelectedCompletedJob] = useState<Job | null>(null)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in')
        return
      }

      // Assigned jobs (pending + in_progress)
      const { data: assignedData, error: assignedError } = await supabase
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
          updated_at,
          completion_photo_urls,
          customer:customer_id (first_name, last_name, phone),
          decline_reason
        `)
        .eq('assigned_artisan_id', user.id)
        .in('status', ['assigned', 'in_progress'])
        .order('created_at', { ascending: false })

      if (assignedError) throw assignedError

      // Completed jobs
      const { data: completedData, error: completedError } = await supabase
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
          updated_at,
          completion_photo_urls,
          customer:customer_id (first_name, last_name, phone),
          decline_reason
        `)
        .eq('assigned_artisan_id', user.id)
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })

      if (completedError) throw completedError

      // Map with explicit typing
      const mapJob = (item: any): Job => ({
        id: item.id || '',
        title: item.title || '',
        description: item.description || '',
        budget_min: item.budget_min ?? null,
        budget_max: item.budget_max ?? null,
        job_type: item.job_type ?? null,
        duration: item.duration ?? null,
        location: item.location || '',
        preferred_date: item.preferred_date ?? null,
        preferred_time: item.preferred_time ?? null,
        status: item.status || 'assigned',
        created_at: item.created_at || '',
        updated_at: item.updated_at || null,
        completion_photo_urls: item.completion_photo_urls || null,
        customer: item.customer ? {
          first_name: item.customer.first_name ?? null,
          last_name: item.customer.last_name ?? null,
          phone: item.customer.phone ?? null,
        } : null,
        decline_reason: item.decline_reason ?? null,
      })

      setAssignedJobs((assignedData || []).map(mapJob))
      setCompletedJobs((completedData || []).map(mapJob))
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError(err.message || 'Failed to load jobs')
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

      toast.success('Job accepted!')
      fetchJobs()
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

      toast.success('Job declined and returned to admin')
      setDeclineModalOpen(null)
      setDeclineReason('')
      fetchJobs()
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
              My Jobs
            </h1>
            <p className="mt-2 text-gray-600">
              Manage your assigned and completed jobs
            </p>
          </div>

          <button
            onClick={fetchJobs}
            disabled={loading}
            className="px-6 py-3 bg-[var(--orange)] text-white rounded-xl hover:bg-orange-600 transition flex items-center gap-2 disabled:opacity-50"
          >
            <FaRedo className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('assigned')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
              activeTab === 'assigned'
                ? 'border-b-4 border-[var(--orange)] text-[var(--orange)]'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Assigned Jobs ({assignedJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
              activeTab === 'completed'
                ? 'border-b-4 border-[var(--orange)] text-[var(--orange)]'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Completed Jobs ({completedJobs.length})
          </button>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <FaSpinner className="animate-spin text-[var(--orange)] text-5xl" />
            <span className="ml-4 text-lg text-gray-600">Loading jobs...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
            <p className="text-red-700 font-medium">{error}</p>
            <button
              onClick={fetchJobs}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {activeTab === 'assigned' && (
              <>
                {assignedJobs.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-sm border p-12 text-center text-gray-500 mt-8">
                    <FaExclamationTriangle className="text-6xl text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      No assigned jobs
                    </h3>
                    <p>
                      Jobs assigned to you will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6 mt-6">
                    {assignedJobs.map(job => (
                      <div
                        key={job.id}
                        className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-[var(--blue)] mb-2">
                              {job.title}
                            </h3>

                            <p className="text-gray-700 mb-4 line-clamp-3">
                              {job.description}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                              <div className="flex items-center gap-2">
                                <FaDollarSign className="text-[var(--orange)]" />
                                Budget: {job.budget_min ? `₦${job.budget_min}` : 'Not specified'}
                                {job.budget_max ? ` – ₦${job.budget_max}` : ''}
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
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium">Status:</span>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                job.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                                job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {job.status === 'assigned' ? 'Assigned' : 'In Progress'}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 mt-4 sm:mt-0 min-w-[180px]">
                            {job.status === 'assigned' && (
                              <>
                                <button
                                  onClick={() => handleAccept(job.id)}
                                  disabled={updating === job.id}
                                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                  {updating === job.id && <FaSpinner className="animate-spin" />}
                                  Accept Job
                                </button>

                                <button
                                  onClick={() => setDeclineModalOpen(job.id)}
                                  disabled={updating === job.id}
                                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition disabled:opacity-50"
                                >
                                  Decline Job
                                </button>
                              </>
                            )}

                            {job.status === 'in_progress' && (
                              <Link
                                href={`/dashboard/artisan/jobs/${job.id}/complete`}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition flex items-center justify-center gap-2"
                              >
                                <FaUpload />
                                Complete Job
                              </Link>
                            )}

                            <Link
                              href="/dashboard/artisan/messages"
                              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition flex items-center justify-center gap-2"
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

            {activeTab === 'completed' && (
              <>
                {completedJobs.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-sm border p-12 text-center text-gray-500 mt-8">
                    <FaCalendarCheck className="text-6xl text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      No completed jobs yet
                    </h3>
                    <p>
                      Once you complete a job, it will appear here with photos.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6 mt-6">
                    {completedJobs.map(job => (
                      <div
                        key={job.id}
                        className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setSelectedCompletedJob(job)}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-[var(--blue)] mb-2">
                              {job.title}
                            </h3>

                            <p className="text-gray-700 mb-4 line-clamp-3">
                              {job.description}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                              <div className="flex items-center gap-2">
                                <FaDollarSign className="text-[var(--orange)]" />
                                {job.budget_min ? `₦${job.budget_min}` : 'Not specified'}
                                {job.budget_max ? ` – ₦${job.budget_max}` : ''}
                              </div>

                              <div className="flex items-center gap-2">
                                <FaMapMarkerAlt className="text-[var(--orange)]" />
                                {job.location}
                              </div>

                              <div className="flex items-center gap-2">
                                <FaClock className="text-[var(--orange)]" />
                                Completed: {job.updated_at ? new Date(job.updated_at).toLocaleDateString() : 'N/A'}
                              </div>

                              {job.customer && (
                                <div className="flex items-center gap-2">
                                  <FaUserTie className="text-[var(--orange)]" />
                                  {job.customer.first_name} {job.customer.last_name}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium">Status:</span>
                              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                Completed
                              </span>
                            </div>
                          </div>

                          {/* Completion Photos Gallery */}
                          {job.completion_photo_urls && job.completion_photo_urls.length > 0 && (
                            <div className="mt-4 sm:mt-0">
                              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <FaImage className="text-[var(--orange)]" />
                                Completion Photos ({job.completion_photo_urls.length})
                              </p>
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-w-xs">
                                {job.completion_photo_urls.map((url, idx) => (
                                  <div key={idx} className="relative rounded-lg overflow-hidden shadow-sm">
                                    <Image
                                      src={url}
                                      alt={`Completion photo ${idx + 1}`}
                                      width={100}
                                      height={100}
                                      className="object-cover w-full h-24 rounded"
                                    />
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-gray-500 mt-2 italic">
                                Click card to see full details
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
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
                placeholder="e.g. Too busy, not suitable skill, location too far..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] resize-none mb-4"
                required
              />

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setDeclineModalOpen(null)
                    setDeclineReason('')
                  }}
                  className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl transition"
                >
                  Cancel
                </button>

                <button
                  onClick={() => handleDecline(declineModalOpen)}
                  disabled={updating === declineModalOpen || !declineReason.trim()}
                  className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {updating === declineModalOpen && <FaSpinner className="animate-spin" />}
                  Decline
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full Details Modal for Completed Jobs */}
        {selectedCompletedJob && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedCompletedJob(null)}
          >
            <div 
              className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-[var(--blue)] to-blue-900 text-white px-8 py-6 rounded-t-3xl z-10 flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  {selectedCompletedJob.title}
                </h2>
                <button
                  onClick={() => setSelectedCompletedJob(null)}
                  className="text-white hover:text-[var(--orange)] text-3xl leading-none"
                >
                  ×
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--blue)] mb-3">
                      Description
                    </h3>
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {selectedCompletedJob.description || 'No description provided'}
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FaDollarSign className="text-[var(--orange)]" />
                        Budget
                      </h4>
                      <p className="text-xl font-bold text-gray-900">
                        {selectedCompletedJob.budget_min ? `₦${selectedCompletedJob.budget_min.toLocaleString()}` : '—'}
                        {selectedCompletedJob.budget_max ? ` – ₦${selectedCompletedJob.budget_max.toLocaleString()}` : ''}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FaMapMarkerAlt className="text-[var(--orange)]" />
                        Location
                      </h4>
                      <p className="text-gray-900 font-medium">
                        {selectedCompletedJob.location || 'Not specified'}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FaCalendarCheck className="text-[var(--orange)]" />
                        Completed on
                      </h4>
                      <p className="text-gray-900 font-medium">
                        {selectedCompletedJob.updated_at 
                          ? new Date(selectedCompletedJob.updated_at).toLocaleString() 
                          : 'N/A'}
                      </p>
                    </div>

                    {selectedCompletedJob.customer && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <FaUserTie className="text-[var(--orange)]" />
                          Customer
                        </h4>
                        <p className="text-gray-900 font-medium">
                          {selectedCompletedJob.customer.first_name} {selectedCompletedJob.customer.last_name}
                          {selectedCompletedJob.customer.phone && (
                            <span className="block text-sm text-gray-600">
                              {selectedCompletedJob.customer.phone}
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Completion Photos */}
                {selectedCompletedJob.completion_photo_urls && selectedCompletedJob.completion_photo_urls.length > 0 && (
                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-xl font-semibold text-[var(--blue)] mb-4 flex items-center gap-3">
                      <FaImage className="text-[var(--orange)]" />
                      Completion Photos ({selectedCompletedJob.completion_photo_urls.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {selectedCompletedJob.completion_photo_urls.map((url, idx) => (
                        <div key={idx} className="relative rounded-xl overflow-hidden shadow-md group">
                          <Image
                            src={url}
                            alt={`Completion photo ${idx + 1}`}
                            width={300}
                            height={300}
                            className="object-cover w-full aspect-square transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <p className="text-white font-medium text-sm">
                              Photo {idx + 1}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-6 flex justify-end">
                  <button
                    onClick={() => setSelectedCompletedJob(null)}
                    className="px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-xl transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}