// app/admin-dashboard/assigned-jobs/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  FaSpinner, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, 
  FaUserTie, FaMapMarkerAlt, FaDollarSign, FaClock, FaRedo, 
  FaImage, FaEye, FaCommentDots, FaFilePdf, FaDownload, 
  FaCalendarCheck
} from 'react-icons/fa'
import Image from 'next/image'
import Link from 'next/link'

interface AssignedJob {
  id: string
  title: string
  description: string
  budget_min: number | null
  budget_max: number | null
  location: string | null
  preferred_date: string | null
  preferred_time: string | null
  attachment_url: string | null
  status: string
  created_at: string
  updated_at: string | null
  assigned_artisan_id: string
  completion_photo_urls: string[] | null
  customer: {
    first_name: string | null
    last_name: string | null
    phone: string | null
  } | null
  artisan: {
    first_name: string | null
    last_name: string | null
    primary_skill: string | null
  } | null
}

export default function AdminAssignedJobs() {
  const [jobs, setJobs] = useState<AssignedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<AssignedJob | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchAssignedJobs()

    // Realtime: notify when artisan accepts job (status → in_progress)
    const channel = supabase
      .channel('admin-job-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'job_requests',
          filter: 'status=eq.in_progress'
        },
        (payload) => {
          const updated = payload.new as Partial<AssignedJob>
          if (updated.title) {
            toast.success(
              `Artisan accepted job: "${updated.title}" is now In Progress / Active`,
              { duration: 7000, icon: '🔔' }
            )
            fetchAssignedJobs() // auto-refresh list
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [statusFilter])

  const fetchAssignedJobs = async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('job_requests')
        .select(`
          id,
          title,
          description,
          budget_min,
          budget_max,
          location,
          preferred_date,
          preferred_time,
          attachment_url,
          status,
          created_at,
          updated_at,
          assigned_artisan_id,
          completion_photo_urls,
          customer:customer_id (first_name, last_name, phone),
          artisan:assigned_artisan_id (first_name, last_name, primary_skill)
        `)
        .not('assigned_artisan_id', 'is', null)

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query.order('updated_at', { ascending: false, nullsFirst: false })

      if (error) throw error

      const typedJobs: AssignedJob[] = (data || []).map((item: any) => ({
        id: String(item.id || ''),
        title: String(item.title || ''),
        description: String(item.description || ''),
        budget_min: item.budget_min != null ? Number(item.budget_min) : null,
        budget_max: item.budget_max != null ? Number(item.budget_max) : null,
        location: item.location ? String(item.location) : null,
        preferred_date: item.preferred_date ? String(item.preferred_date) : null,
        preferred_time: item.preferred_time ? String(item.preferred_time) : null,
        attachment_url: item.attachment_url ? String(item.attachment_url) : null,
        status: String(item.status || 'unknown'),
        created_at: String(item.created_at || ''),
        updated_at: item.updated_at ? String(item.updated_at) : null,
        assigned_artisan_id: String(item.assigned_artisan_id || ''),
        completion_photo_urls: Array.isArray(item.completion_photo_urls) ? item.completion_photo_urls : null,
        customer: item.customer ? {
          first_name: item.customer.first_name != null ? String(item.customer.first_name) : null,
          last_name: item.customer.last_name != null ? String(item.customer.last_name) : null,
          phone: item.customer.phone != null ? String(item.customer.phone) : null,
        } : null,
        artisan: item.artisan ? {
          first_name: item.artisan.first_name != null ? String(item.artisan.first_name) : null,
          last_name: item.artisan.last_name != null ? String(item.artisan.last_name) : null,
          primary_skill: item.artisan.primary_skill != null ? String(item.artisan.primary_skill) : null,
        } : null,
      }))

      setJobs(typedJobs)
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError(err.message || 'Failed to load assigned jobs')
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const base = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium shadow-sm'
    switch (status) {
      case 'assigned':
        return <span className={`${base} bg-blue-100 text-blue-800 border border-blue-200`}>Assigned (Waiting Accept)</span>
      case 'in_progress':
        return <span className={`${base} bg-purple-100 text-purple-800 border border-purple-200`}>In Progress / Active</span>
      case 'completed':
        return <span className={`${base} bg-green-100 text-green-800 border border-green-200`}>Completed</span>
      case 'completed_pending_review':
        return <span className={`${base} bg-yellow-100 text-yellow-800 border border-yellow-200`}>Pending Final Review</span>
      case 'changes_requested':
        return <span className={`${base} bg-yellow-100 text-yellow-800 border border-yellow-200`}>Changes Requested</span>
      case 'cancelled':
        return <span className={`${base} bg-gray-100 text-gray-800 border border-gray-200`}>Cancelled</span>
      case 'rejected':
        return <span className={`${base} bg-red-100 text-red-800 border border-red-200`}>Rejected</span>
      default:
        return <span className={`${base} bg-gray-100 text-gray-800 border border-gray-200`}>{status}</span>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header + Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--blue)]">
              Assigned Jobs
            </h1>
            <p className="mt-2 text-gray-600">
              Jobs assigned to artisans (waiting for accept → in progress → completion)
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--orange)] min-w-[220px]"
            >
              <option value="all">All Statuses</option>
              <option value="assigned">Assigned (Waiting Accept)</option>
              <option value="in_progress">In Progress / Active</option>
              <option value="completed">Completed</option>
              <option value="completed_pending_review">Pending Final Review</option>
              <option value="changes_requested">Changes Requested</option>
              <option value="cancelled">Cancelled</option>
              <option value="rejected">Rejected</option>
            </select>

            <button
              onClick={fetchAssignedJobs}
              disabled={loading}
              className="px-6 py-3 bg-[var(--orange)] text-white rounded-xl hover:bg-orange-600 transition flex items-center gap-2 disabled:opacity-50 shadow-md"
            >
              <FaRedo className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-32">
            <FaSpinner className="animate-spin text-[var(--orange)] text-6xl" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-10 text-center">
            <FaExclamationTriangle className="text-red-500 text-7xl mx-auto mb-6" />
            <p className="text-red-700 text-lg">{error}</p>
            <button onClick={fetchAssignedJobs} className="mt-6 px-8 py-3 bg-red-600 text-white rounded-xl">
              Retry
            </button>
          </div>
        )}

        {/* Jobs List */}
        {!loading && !error && jobs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-12 text-center text-gray-500">
            <FaExclamationTriangle className="text-6xl mx-auto mb-6 opacity-60" />
            <h3 className="text-2xl font-bold mb-3">No assigned jobs yet</h3>
            <p>When you assign jobs from pending requests, they appear here.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map(job => (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className="group bg-white rounded-2xl shadow border border-gray-200 overflow-hidden hover:shadow-xl hover:border-[var(--orange)]/50 transition-all cursor-pointer"
              >
                <div className="bg-gradient-to-r from-[var(--blue)] to-blue-800 p-6 text-white">
                  <h3 className="text-xl font-bold line-clamp-1 group-hover:text-[var(--orange)] transition-colors">
                    {job.title}
                  </h3>
                  <p className="text-sm opacity-90 mt-1">
                    {new Date(job.updated_at || job.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="p-6">
                  <div className="mb-4">{getStatusBadge(job.status)}</div>

                  <p className="text-gray-700 line-clamp-3 mb-4 text-sm">
                    {job.description || 'No description'}
                  </p>

                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <FaDollarSign className="text-[var(--orange)]" />
                      <span>
                        {job.budget_min ? `₦${job.budget_min.toLocaleString()}` : '—'}
                        {job.budget_max ? ` – ₦${job.budget_max.toLocaleString()}` : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <FaMapMarkerAlt className="text-[var(--orange)]" />
                      <span className="truncate">{job.location || 'Not specified'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <FaUserTie className="text-[var(--orange)]" />
                      <span>
                        Customer: {job.customer?.first_name} {job.customer?.last_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <FaUserTie className="text-[var(--orange)]" />
                      <span>
                        Artisan: {job.artisan?.first_name} {job.artisan?.last_name}
                      </span>
                    </div>
                  </div>

                  {job.attachment_url && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <FaImage className="text-[var(--orange)]" />
                        Customer uploaded file
                      </p>
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
                  <button className="text-[var(--blue)] hover:text-[var(--orange)] font-medium flex items-center gap-2">
                    <FaEye /> View Details
                  </button>

                  <div className="flex items-center gap-4">
                    {(job.status === 'assigned' || job.status === 'in_progress') && (
                      <Link 
                        href={`/dashboard/admin/chat/${job.id}`}
                        className="text-[var(--orange)] hover:text-orange-700 font-medium flex items-center gap-2"
                        onClick={e => e.stopPropagation()}
                      >
                        <FaCommentDots /> Chat
                      </Link>
                    )}

                    {job.status === 'completed_pending_review' && (
                      <Link
                        href={`/admin-dashboard/jobs/${job.id}/complete`}
                        onClick={e => e.stopPropagation()}
                        className="text-green-600 hover:text-green-700 font-medium flex items-center gap-2"
                      >
                        <FaCheckCircle /> Finalize Completion
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {selectedJob && (
          <div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedJob(null)}
          >
            <div 
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gradient-to-r from-[var(--blue)] to-blue-900 text-white px-8 py-6 rounded-t-3xl z-10 flex justify-between items-center">
                <h2 className="text-2xl font-bold">{selectedJob.title}</h2>
                <button 
                  onClick={() => setSelectedJob(null)}
                  className="text-3xl hover:text-[var(--orange)]"
                >
                  ×
                </button>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold text-[var(--blue)] mb-4">Job Details</h3>
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                      {selectedJob.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium flex items-center gap-2 text-gray-800">
                        <FaDollarSign className="text-[var(--orange)]" /> Budget
                      </h4>
                      <p className="text-xl font-bold mt-1">
                        {selectedJob.budget_min ? `₦${selectedJob.budget_min.toLocaleString()}` : '—'}
                        {selectedJob.budget_max ? ` – ₦${selectedJob.budget_max.toLocaleString()}` : ''}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium flex items-center gap-2 text-gray-800">
                        <FaMapMarkerAlt className="text-[var(--orange)]" /> Location
                      </h4>
                      <p className="mt-1">{selectedJob.location || 'Not specified'}</p>
                    </div>

                    <div>
                      <h4 className="font-medium flex items-center gap-2 text-gray-800">
                        <FaCalendarCheck className="text-[var(--orange)]" /> Preferred Time
                      </h4>
                      <p className="mt-1">
                        {selectedJob.preferred_date || 'Anytime'} {selectedJob.preferred_time || ''}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium flex items-center gap-2 text-gray-800">
                        <FaUserTie className="text-[var(--orange)]" /> Customer
                      </h4>
                      <p className="mt-1">
                        {selectedJob.customer?.first_name} {selectedJob.customer?.last_name}
                        {selectedJob.customer?.phone && <span className="block text-sm">{selectedJob.customer.phone}</span>}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium flex items-center gap-2 text-gray-800">
                        <FaUserTie className="text-[var(--orange)]" /> Assigned Artisan
                      </h4>
                      <p className="mt-1">
                        {selectedJob.artisan?.first_name} {selectedJob.artisan?.last_name}
                        {selectedJob.artisan?.primary_skill && <span className="block text-sm">{selectedJob.artisan.primary_skill}</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer Attachment */}
                {selectedJob.attachment_url && (
                  <div className="pt-6 border-t">
                    <h3 className="text-xl font-semibold text-[var(--blue)] mb-4 flex items-center gap-3">
                      <FaImage className="text-[var(--orange)]" />
                      Customer Uploaded Attachment
                    </h3>
                    <div className="flex gap-4">
                      <a
                        href={selectedJob.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition text-[var(--blue)] font-medium"
                      >
                        <FaDownload /> Download
                      </a>
                      <button
                        onClick={() => window.open(selectedJob.attachment_url!, '_blank')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--blue)] hover:bg-blue-700 text-white rounded-xl transition font-medium"
                      >
                        <FaEye /> Preview
                      </button>
                    </div>
                  </div>
                )}

                {/* Completion Photos – Safe null check */}
                {selectedJob.completion_photo_urls && selectedJob.completion_photo_urls.length > 0 && (
                  <div className="pt-6 border-t">
                    <h3 className="text-xl font-semibold text-[var(--blue)] mb-4 flex items-center gap-3">
                      <FaImage className="text-[var(--orange)]" />
                      Completion Photos ({selectedJob.completion_photo_urls.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {selectedJob.completion_photo_urls.map((url, idx) => (
                        <div key={idx} className="relative rounded-xl overflow-hidden shadow-md group">
                          <Image
                            src={url}
                            alt={`Completion photo ${idx + 1}`}
                            width={300}
                            height={300}
                            className="object-cover w-full aspect-square transition-transform group-hover:scale-105"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status-specific actions */}
                <div className="pt-8 flex flex-wrap justify-end gap-4 border-t">
                  {selectedJob.status === 'assigned' && (
                    <p className="text-center text-gray-600 w-full mb-4">
                      Waiting for artisan to accept the job
                    </p>
                  )}

                  {selectedJob.status === 'in_progress' && (
                    <div className="w-full text-center">
                      <div className="inline-flex items-center gap-3 px-6 py-3 bg-purple-100 text-purple-800 rounded-full font-medium">
                        <FaCheckCircle className="text-purple-600" />
                        Job is Active / In Progress
                      </div>
                    </div>
                  )}

                  {selectedJob.status === 'completed_pending_review' && (
                    <Link
                      href={`/admin-dashboard/jobs/${selectedJob.id}/complete`}
                      className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition shadow-md"
                    >
                      <FaCheckCircle />
                      Finalize & Close Job
                    </Link>
                  )}

                  {(selectedJob.status === 'assigned' || selectedJob.status === 'in_progress') && (
                    <Link
                      href={`/dashboard/admin/chat/${selectedJob.id}`}
                      className="px-8 py-3 bg-[var(--orange)] hover:bg-orange-600 text-white font-medium rounded-xl transition flex items-center gap-2 shadow-md"
                    >
                      <FaCommentDots />
                      Chat with Artisan
                    </Link>
                  )}

                  <button
                    onClick={() => setSelectedJob(null)}
                    className="px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-xl transition shadow-md"
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

function getStatusBadge(status: string) {
  const base = 'inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm'
  switch (status) {
    case 'assigned':
      return <span className={`${base} bg-blue-100 text-blue-800 border border-blue-200`}>Assigned (Waiting Accept)</span>
    case 'in_progress':
      return <span className={`${base} bg-purple-100 text-purple-800 border border-purple-200`}>In Progress / Active</span>
    case 'completed':
      return <span className={`${base} bg-green-100 text-green-800 border border-green-200`}>Completed</span>
    case 'completed_pending_review':
      return <span className={`${base} bg-yellow-100 text-yellow-800 border border-yellow-200`}>Pending Final Review</span>
    case 'changes_requested':
      return <span className={`${base} bg-yellow-100 text-yellow-800 border border-yellow-200`}>Changes Requested</span>
    case 'cancelled':
      return <span className={`${base} bg-gray-100 text-gray-800 border border-gray-200`}>Cancelled</span>
    case 'rejected':
      return <span className={`${base} bg-red-100 text-red-800 border border-red-200`}>Rejected</span>
    default:
      return <span className={`${base} bg-gray-100 text-gray-800 border border-gray-200`}>{status}</span>
  }
}