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
  FaPlayCircle,
  FaBell
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
  artisan_notified_of_review?: boolean
}

export default function ArtisanAssignedJobs() {
  const router = useRouter()
  const [jobs, setJobs] = useState<AssignedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [notifying, setNotifying] = useState<string | null>(null)
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
          decline_reason,
          artisan_notified_of_review
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
        artisan_notified_of_review: item.artisan_notified_of_review ?? false,
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
        router.push(`/dashboard/artisan/job/${jobId}/active`)
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

  const handleNotifyReviewed = async (jobId: string) => {
    if (notifying === jobId) return
    setNotifying(jobId)

    try {
      const { error } = await supabase
        .from('job_requests')
        .update({
          artisan_notified_of_review: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)

      if (error) throw error

      toast.success('You have been notified that this job has been reviewed!', { duration: 4000 })
      fetchAssignedJobs()
    } catch (err: any) {
      toast.error('Failed to mark as notified')
      console.error('Notify error:', err)
    } finally {
      setNotifying(null)
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
            <p className="mt-2 text-gray-600">
              Jobs waiting for your action or feedback
            </p>
          </div>

          <button
            onClick={fetchAssignedJobs}
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
              <div className="bg-white rounded-2xl shadow-sm border p-12 text-center text-gray-500">
                <FaExclamationTriangle className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
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

                        {/* Status */}
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Status:</span>
                          <span className={`px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 ${
                            job.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                            job.status === 'in_progress' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                            job.status === 'completed_pending_review' ? 'bg-green-100 text-green-800' :
                            job.status === 'completed' ? 'bg-green-600 text-white font-bold' :
                            'bg-gray-100 text-gray-800'
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
                                Reviewed by Customer
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
                              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 font-medium shadow-sm"
                            >
                              {updating === job.id && <FaSpinner className="animate-spin" />}
                              Accept & Start Job
                            </button>

                            <button
                              onClick={() => setDeclineModalOpen(job.id)}
                              disabled={updating === job.id}
                              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition disabled:opacity-50 font-medium shadow-sm"
                            >
                              Decline Job
                            </button>
                          </>
                        )}

                        {job.status === 'in_progress' && (
                          <Link
                            href={`/dashboard/artisan/jobs/${job.id}/active`}
                            className="px-6 py-3 bg-[var(--blue)] hover:bg-blue-700 text-white rounded-xl transition flex items-center justify-center gap-2 font-medium shadow-sm"
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
                          <div className="space-y-3">
                            <div className="px-6 py-3 bg-green-600 text-white rounded-xl text-center font-medium shadow-sm flex items-center justify-center gap-2">
                              <FaCheckCircle />
                              Reviewed by Customer
                            </div>

                            {!job.artisan_notified_of_review && (
                              <button
                                onClick={() => handleNotifyReviewed(job.id)}
                                disabled={notifying === job.id}
                                className={`
                                  px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 font-medium shadow-sm w-full
                                  ${notifying === job.id ? 'opacity-70 cursor-not-allowed' : ''}
                                `}
                              >
                                {notifying === job.id ? <FaSpinner className="animate-spin" /> : <FaBell />}
                                {notifying === job.id ? 'Notifying...' : 'Notify Me: Reviewed'}
                              </button>
                            )}

                            {job.artisan_notified_of_review && (
                              <div className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl text-center font-medium shadow-sm">
                                You have been notified
                              </div>
                            )}
                          </div>
                        )}

                        <Link
                          href="/dashboard/artisan/messages"
                          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition flex items-center justify-center gap-2 font-medium shadow-sm"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] resize-none mb-6"
                required
              />

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setDeclineModalOpen(null)
                    setDeclineReason('')
                  }}
                  className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl transition font-medium"
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


// 'use client'

// import React, { useState, useEffect } from 'react'
// import { useRouter } from 'next/navigation'
// import { supabase } from '@/lib/supabase'
// import toast from 'react-hot-toast'
// import { 
//   FaSpinner, 
//   FaExclamationTriangle, 
//   FaCheckCircle, 
//   FaTimesCircle, 
//   FaUserTie, 
//   FaMapMarkerAlt, 
//   FaDollarSign, 
//   FaClock, 
//   FaCommentDots, 
//   FaRedo, 
//   FaPlayCircle,
//   FaBell
// } from 'react-icons/fa'
// import Link from 'next/link'
// import Image from 'next/image'

// interface AssignedJob {
//   id: string
//   title: string
//   description: string
//   budget_min: number | null
//   budget_max: number | null
//   job_type: string | null
//   duration: string | null
//   location: string
//   preferred_date: string | null
//   preferred_time: string | null
//   status: string
//   created_at: string
//   customer: {
//     first_name: string | null
//     last_name: string | null
//     phone: string | null
//   } | null
//   decline_reason?: string | null
//   artisan_notified_of_review?: boolean
// }

// export default function ArtisanAssignedJobs() {
//   const router = useRouter()
//   const [jobs, setJobs] = useState<AssignedJob[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)
//   const [updating, setUpdating] = useState<string | null>(null)
//   const [notifying, setNotifying] = useState<string | null>(null)
//   const [declineModalOpen, setDeclineModalOpen] = useState<string | null>(null)
//   const [declineReason, setDeclineReason] = useState('')

//   useEffect(() => {
//     fetchAssignedJobs()
//   }, [])

//   const fetchAssignedJobs = async () => {
//     setLoading(true)
//     setError(null)

//     try {
//       const { data: { user } } = await supabase.auth.getUser()
//       if (!user) {
//         toast.error('Please sign in to view your jobs')
//         router.replace('/login')
//         return
//       }

//       const { data, error } = await supabase
//         .from('job_requests')
//         .select(`
//           id,
//           title,
//           description,
//           budget_min,
//           budget_max,
//           job_type,
//           duration,
//           location,
//           preferred_date,
//           preferred_time,
//           status,
//           created_at,
//           customer:customer_id (first_name, last_name, phone),
//           decline_reason,
//           artisan_notified_of_review
//         `)
//         .eq('assigned_artisan_id', user.id)
//         .in('status', ['assigned', 'in_progress', 'completed_pending_review', 'completed'])
//         .order('created_at', { ascending: false })

//       if (error) throw error

//       const typedJobs: AssignedJob[] = (data || []).map((item: any) => ({
//         id: String(item.id || ''),
//         title: String(item.title || 'Untitled Job'),
//         description: String(item.description || 'No description provided'),
//         budget_min: item.budget_min != null ? Number(item.budget_min) : null,
//         budget_max: item.budget_max != null ? Number(item.budget_max) : null,
//         job_type: item.job_type ? String(item.job_type) : null,
//         duration: item.duration ? String(item.duration) : null,
//         location: String(item.location || 'Not specified'),
//         preferred_date: item.preferred_date ? String(item.preferred_date) : null,
//         preferred_time: item.preferred_time ? String(item.preferred_time) : null,
//         status: String(item.status || 'assigned'),
//         created_at: String(item.created_at || ''),
//         customer: item.customer ? {
//           first_name: item.customer.first_name != null ? String(item.customer.first_name) : null,
//           last_name: item.customer.last_name != null ? String(item.customer.last_name) : null,
//           phone: item.customer.phone != null ? String(item.customer.phone) : null,
//         } : null,
//         decline_reason: item.decline_reason ? String(item.decline_reason) : null,
//         artisan_notified_of_review: item.artisan_notified_of_review ?? false,
//       }))

//       setJobs(typedJobs)
//     } catch (err: any) {
//       console.error('Fetch assigned jobs error:', err)
//       setError(err.message || 'Failed to load your assigned jobs')
//       toast.error('Could not load jobs – check your connection')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleAccept = async (jobId: string) => {
//     if (!confirm('Are you sure you want to accept this job?')) return

//     setUpdating(jobId)

//     try {
//       const { error } = await supabase
//         .from('job_requests')
//         .update({
//           status: 'in_progress',
//           updated_at: new Date().toISOString(),
//         })
//         .eq('id', jobId)
//         .eq('assigned_artisan_id', (await supabase.auth.getUser()).data.user?.id)

//       if (error) throw error

//       toast.success('Job accepted! You can now start working.', { duration: 4000 })
      
//       // Redirect to active job view
//       setTimeout(() => {
//         router.push(`/dashboard/artisan/job/${jobId}/active`)
//       }, 1200)

//       fetchAssignedJobs()
//     } catch (err: any) {
//       toast.error(err.message || 'Failed to accept job')
//       console.error('Accept error:', err)
//     } finally {
//       setUpdating(null)
//     }
//   }

//   const handleDecline = async (jobId: string) => {
//     if (!declineReason.trim()) {
//       toast.error('Please provide a reason for declining')
//       return
//     }

//     if (!confirm('Decline this job? It will return to the pool.')) return

//     setUpdating(jobId)

//     try {
//       const { error } = await supabase
//         .from('job_requests')
//         .update({
//           assigned_artisan_id: null,
//           status: 'pending',
//           decline_reason: declineReason.trim(),
//           updated_at: new Date().toISOString(),
//         })
//         .eq('id', jobId)
//         .eq('assigned_artisan_id', (await supabase.auth.getUser()).data.user?.id)

//       if (error) throw error

//       toast.success('Job declined successfully')
//       setDeclineModalOpen(null)
//       setDeclineReason('')
//       fetchAssignedJobs()
//     } catch (err: any) {
//       toast.error(err.message || 'Failed to decline job')
//       console.error('Decline error:', err)
//     } finally {
//       setUpdating(null)
//     }
//   }

//   const handleNotifyReviewed = async (jobId: string) => {
//     if (notifying === jobId) return
//     setNotifying(jobId)

//     try {
//       const { error } = await supabase
//         .from('job_requests')
//         .update({
//           artisan_notified_of_review: true,
//           updated_at: new Date().toISOString()
//         })
//         .eq('id', jobId)
//         .eq('assigned_artisan_id', (await supabase.auth.getUser()).data.user?.id)

//       if (error) throw error

//       toast.success('You have been notified that this job has been reviewed!', { duration: 5000 })
//       fetchAssignedJobs()
//     } catch (err: any) {
//       toast.error('Failed to mark as notified')
//       console.error('Notify error:', err)
//     } finally {
//       setNotifying(null)
//     }
//   }

//   const getStatusBadge = (status: string) => {
//     const styles = {
//       assigned: 'bg-yellow-100 text-yellow-800 border-yellow-300',
//       in_progress: 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse',
//       completed_pending_review: 'bg-green-100 text-green-800 border-green-300',
//       completed: 'bg-green-600 text-white border-green-700',
//     }[status] || 'bg-gray-100 text-gray-800 border-gray-300'

//     const labels = {
//       assigned: 'Assigned – Action Required',
//       in_progress: 'Active / In Progress',
//       completed_pending_review: 'Waiting for Review',
//       completed: 'Completed & Reviewed',
//     }[status] || status

//     return (
//       <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${styles}`}>
//         {labels}
//       </span>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-7xl mx-auto space-y-8">
//         {/* Header */}
//         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//           <div>
//             <h1 className="text-3xl font-bold text-[var(--blue)]">
//               My Assigned Jobs
//             </h1>
//             <p className="mt-2 text-gray-600">
//               All jobs assigned to you – accept, decline, or view progress
//             </p>
//           </div>

//           <button
//             onClick={fetchAssignedJobs}
//             disabled={loading}
//             className="px-6 py-3 bg-[var(--orange)] text-white rounded-xl hover:bg-orange-600 transition flex items-center gap-2 disabled:opacity-50 shadow-md"
//           >
//             <FaRedo className={loading ? 'animate-spin' : ''} />
//             Refresh Jobs
//           </button>
//         </div>

//         {/* Loading */}
//         {loading && (
//           <div className="min-h-[400px] flex items-center justify-center">
//             <div className="relative flex items-center justify-center">
//               <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-[var(--orange)] border-opacity-70 shadow-lg"></div>
//               <div className="absolute inset-0 flex items-center justify-center animate-pulse">
//                 <div className="bg-white rounded-full p-3 shadow-md">
//                   <Image
//                     src="/log.png"
//                     width={56}
//                     height={56}
//                     alt="Loading..."
//                     className="object-contain"
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Error */}
//         {error && !loading && (
//           <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
//             <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
//             <p className="text-red-700 font-medium mb-4">{error}</p>
//             <button
//               onClick={fetchAssignedJobs}
//               className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
//             >
//               Try Again
//             </button>
//           </div>
//         )}

//         {/* Jobs List */}
//         {!loading && !error && (
//           <>
//             {jobs.length === 0 ? (
//               <div className="bg-white rounded-2xl shadow-sm border p-12 text-center text-gray-500">
//                 <FaExclamationTriangle className="text-6xl text-gray-300 mx-auto mb-4" />
//                 <h3 className="text-xl font-semibold text-gray-700 mb-2">
//                   No jobs assigned yet
//                 </h3>
//                 <p className="mb-6">
//                   When the admin assigns a job to you, it will appear here with full details.
//                 </p>
//                 <Link
//                   href="/dashboard/artisan/browse-jobs"
//                   className="inline-flex items-center px-6 py-3 bg-[var(--blue)] text-white rounded-xl hover:bg-blue-700 transition"
//                 >
//                   Browse Available Jobs
//                 </Link>
//               </div>
//             ) : (
//               <div className="space-y-6">
//                 {jobs.map(job => (
//                   <div
//                     key={job.id}
//                     className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
//                   >
//                     <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
//                       {/* Job Details */}
//                       <div className="flex-1">
//                         <div className="flex items-start justify-between mb-3">
//                           <h3 className="text-xl font-semibold text-[var(--blue)]">
//                             {job.title}
//                           </h3>
//                           {getStatusBadge(job.status)}
//                         </div>

//                         <p className="text-gray-700 mb-4 line-clamp-3">
//                           {job.description}
//                         </p>

//                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600 mb-5">
//                           <div className="flex items-center gap-2">
//                             <FaDollarSign className="text-[var(--orange)]" />
//                             <span>
//                               Budget: {job.budget_min ? `₦${job.budget_min.toLocaleString()}` : 'Not set'}
//                               {job.budget_max ? ` – ₦${job.budget_max.toLocaleString()}` : ''}
//                             </span>
//                           </div>

//                           <div className="flex items-center gap-2">
//                             <FaClock className="text-[var(--orange)]" />
//                             <span>
//                               {job.preferred_date || 'Flexible'} {job.preferred_time ? `at ${job.preferred_time}` : ''}
//                             </span>
//                           </div>

//                           <div className="flex items-center gap-2">
//                             <FaMapMarkerAlt className="text-[var(--orange)]" />
//                             <span>{job.location || 'Not specified'}</span>
//                           </div>

//                           {job.customer && (
//                             <div className="flex items-center gap-2 col-span-2 lg:col-span-1">
//                               <FaUserTie className="text-[var(--orange)]" />
//                               <span>
//                                 Customer: {job.customer.first_name} {job.customer.last_name}
//                                 {job.customer.phone && ` • ${job.customer.phone}`}
//                               </span>
//                             </div>
//                           )}
//                         </div>

//                         {/* Decline Reason (if declined earlier) */}
//                         {job.decline_reason && (
//                           <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
//                             <strong>Decline Reason:</strong> {job.decline_reason}
//                           </div>
//                         )}
//                       </div>

//                       {/* Actions Column */}
//                       <div className="flex flex-col gap-3 min-w-[200px] mt-4 lg:mt-0">
//                         {job.status === 'assigned' && (
//                           <>
//                             <button
//                               onClick={() => handleAccept(job.id)}
//                               disabled={updating === job.id}
//                               className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 font-medium shadow-sm"
//                             >
//                               {updating === job.id && <FaSpinner className="animate-spin" />}
//                               Accept & Start Job
//                             </button>

//                             <button
//                               onClick={() => setDeclineModalOpen(job.id)}
//                               disabled={updating === job.id}
//                               className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition disabled:opacity-50 font-medium shadow-sm"
//                             >
//                               Decline Job
//                             </button>
//                           </>
//                         )}

//                         {job.status === 'in_progress' && (
//                           <Link
//                             href={`/dashboard/artisan/jobs/${job.id}/active`}
//                             className="px-6 py-3 bg-[var(--blue)] hover:bg-blue-700 text-white rounded-xl transition flex items-center justify-center gap-2 font-medium shadow-sm"
//                           >
//                             <FaPlayCircle />
//                             View Active Job
//                           </Link>
//                         )}

//                         {job.status === 'completed_pending_review' && (
//                           <div className="px-6 py-3 bg-green-100 text-green-800 rounded-xl text-center font-medium shadow-sm">
//                             Waiting for customer review
//                           </div>
//                         )}

//                         {job.status === 'completed' && (
//                           <div className="space-y-3">
//                             <div className="px-6 py-3 bg-green-600 text-white rounded-xl text-center font-medium shadow-sm flex items-center justify-center gap-2">
//                               <FaCheckCircle />
//                               Job Completed & Reviewed
//                             </div>

//                             {!job.artisan_notified_of_review && (
//                               <button
//                                 onClick={() => handleNotifyReviewed(job.id)}
//                                 disabled={notifying === job.id}
//                                 className={`
//                                   px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 font-medium shadow-sm w-full
//                                   ${notifying === job.id ? 'opacity-70 cursor-not-allowed' : ''}
//                                 `}
//                               >
//                                 {notifying === job.id ? <FaSpinner className="animate-spin" /> : <FaBell />}
//                                 {notifying === job.id ? 'Notifying...' : 'Notify: Job Reviewed'}
//                               </button>
//                             )}

//                             {job.artisan_notified_of_review && (
//                               <div className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl text-center font-medium shadow-sm">
//                                 You have been notified
//                               </div>
//                             )}
//                           </div>
//                         )}

//                         {/* Always available */}
//                         <Link
//                           href="/dashboard/artisan/messages"
//                           className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition flex items-center justify-center gap-2 font-medium shadow-sm"
//                         >
//                           <FaCommentDots size={16} />
//                           Chat with Admin
//                         </Link>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </>
//         )}

//         {/* Decline Reason Modal */}
//         {declineModalOpen && (
//           <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
//             <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
//               <h3 className="text-xl font-bold text-[var(--blue)] mb-4">
//                 Decline Job – Why?
//               </h3>

//               <textarea
//                 value={declineReason}
//                 onChange={e => setDeclineReason(e.target.value)}
//                 placeholder="Please tell us why you're declining this job (e.g., too busy, not suitable skillset, location too far, other commitments...)"
//                 rows={5}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] resize-none mb-6"
//                 required
//               />

//               <div className="flex flex-col sm:flex-row gap-4">
//                 <button
//                   onClick={() => {
//                     setDeclineModalOpen(null)
//                     setDeclineReason('')
//                   }}
//                   className="flex-1 py-3 px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl transition font-medium order-2 sm:order-1"
//                 >
//                   Cancel
//                 </button>

//                 <button
//                   onClick={() => handleDecline(declineModalOpen)}
//                   disabled={updating === declineModalOpen || !declineReason.trim()}
//                   className={`
//                     flex-1 py-3 px-6 bg-red-600 hover:bg-red-700 text-white rounded-xl transition disabled:opacity-50 font-medium flex items-center justify-center gap-2 order-1 sm:order-2
//                     ${updating === declineModalOpen ? 'opacity-70 cursor-not-allowed' : ''}
//                   `}
//                 >
//                   {updating === declineModalOpen && <FaSpinner className="animate-spin" />}
//                   Confirm Decline
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

// 'use client'

// export const dynamic = 'force-dynamic'

// import React, { useState, useEffect } from 'react'
// import { useRouter } from 'next/navigation'
// import { supabase } from '@/lib/supabase'
// import toast from 'react-hot-toast'
// import { 
//   FaSpinner, 
//   FaExclamationTriangle, 
//   FaCheckCircle, 
//   FaTimesCircle, 
//   FaUserTie, 
//   FaMapMarkerAlt, 
//   FaDollarSign, 
//   FaClock, 
//   FaCommentDots, 
//   FaRedo, 
//   FaUpload,
//   FaPlayCircle,
//   FaBell,
//   FaTools,           // for active jobs
//   FaHourglassHalf,   // for pending
// } from 'react-icons/fa'
// import Link from 'next/link'
// import Image from 'next/image'

// interface AssignedJob {
//   id: string
//   title: string
//   description: string
//   budget_min: number | null
//   budget_max: number | null
//   job_type: string | null
//   duration: string | null
//   location: string
//   preferred_date: string | null
//   preferred_time: string | null
//   status: string
//   created_at: string
//   customer: {
//     first_name: string | null
//     last_name: string | null
//     phone: string | null
//   } | null
//   decline_reason?: string | null
//   artisan_notified_of_review?: boolean
// }

// export default function ArtisanAssignedJobs() {
//   const router = useRouter()
//   const [jobs, setJobs] = useState<AssignedJob[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)
//   const [updating, setUpdating] = useState<string | null>(null)
//   const [notifying, setNotifying] = useState<string | null>(null)
//   const [declineModalOpen, setDeclineModalOpen] = useState<string | null>(null)
//   const [declineReason, setDeclineReason] = useState('')

//   useEffect(() => {
//     fetchAssignedJobs()
//   }, [])

//   const fetchAssignedJobs = async () => {
//     setLoading(true)
//     setError(null)

//     try {
//       const { data: { user } } = await supabase.auth.getUser()
//       if (!user) {
//         toast.error('Please sign in')
//         return
//       }

//       const { data, error } = await supabase
//         .from('job_requests')
//         .select(`
//           id,
//           title,
//           description,
//           budget_min,
//           budget_max,
//           job_type,
//           duration,
//           location,
//           preferred_date,
//           preferred_time,
//           status,
//           created_at,
//           customer:customer_id (first_name, last_name, phone),
//           decline_reason,
//           artisan_notified_of_review
//         `)
//         .eq('assigned_artisan_id', user.id)
//         .in('status', ['assigned', 'in_progress', 'completed_pending_review', 'completed'])
//         .order('created_at', { ascending: false })

//       if (error) throw error

//       const typedJobs: AssignedJob[] = (data || []).map((item: any) => ({
//         id: String(item.id || ''),
//         title: String(item.title || ''),
//         description: String(item.description || ''),
//         budget_min: item.budget_min != null ? Number(item.budget_min) : null,
//         budget_max: item.budget_max != null ? Number(item.budget_max) : null,
//         job_type: item.job_type ? String(item.job_type) : null,
//         duration: item.duration ? String(item.duration) : null,
//         location: String(item.location || ''),
//         preferred_date: item.preferred_date ? String(item.preferred_date) : null,
//         preferred_time: item.preferred_time ? String(item.preferred_time) : null,
//         status: String(item.status || 'assigned'),
//         created_at: String(item.created_at || ''),
//         customer: item.customer ? {
//           first_name: item.customer.first_name != null ? String(item.customer.first_name) : null,
//           last_name: item.customer.last_name != null ? String(item.customer.last_name) : null,
//           phone: item.customer.phone != null ? String(item.customer.phone) : null,
//         } : null,
//         decline_reason: item.decline_reason ? String(item.decline_reason) : null,
//         artisan_notified_of_review: item.artisan_notified_of_review ?? false,
//       }))

//       setJobs(typedJobs)
//     } catch (err: any) {
//       console.error('Fetch error:', err)
//       setError(err.message || 'Failed to load your assigned jobs')
//       toast.error('Failed to load jobs')
//     } finally {
//       setLoading(false)
//     }
//   }

//   // Group jobs
//   const assignedJobs = jobs.filter(j => j.status === 'assigned')
//   const activeJobs = jobs.filter(j => 
//     ['in_progress', 'completed_pending_review', 'completed'].includes(j.status)
//   )

//   const handleAccept = async (jobId: string) => {
//     if (!confirm('Accept this job?')) return

//     setUpdating(jobId)

//     try {
//       const { error } = await supabase
//         .from('job_requests')
//         .update({
//           status: 'in_progress',
//           updated_at: new Date().toISOString(),
//         })
//         .eq('id', jobId)

//       if (error) throw error

//       toast.success('Job accepted! You can now start working.', { duration: 4000 })

//       // Go directly to the active workspace
//       router.push(`/dashboard/artisan/job/${jobId}/active`)

//       fetchAssignedJobs()
//     } catch (err: any) {
//       toast.error(err.message || 'Failed to accept job')
//     } finally {
//       setUpdating(null)
//     }
//   }

//   const handleDecline = async (jobId: string) => {
//     if (!declineReason.trim()) {
//       toast.error('Please provide a reason for declining')
//       return
//     }

//     setUpdating(jobId)

//     try {
//       const { error } = await supabase
//         .from('job_requests')
//         .update({
//           assigned_artisan_id: null,
//           status: 'pending',
//           decline_reason: declineReason.trim(),
//           updated_at: new Date().toISOString(),
//         })
//         .eq('id', jobId)

//       if (error) throw error

//       toast.success('Job declined and returned to the pool')
//       setDeclineModalOpen(null)
//       setDeclineReason('')
//       fetchAssignedJobs()
//     } catch (err: any) {
//       toast.error(err.message || 'Failed to decline job')
//     } finally {
//       setUpdating(null)
//     }
//   }

//   const handleNotifyReviewed = async (jobId: string) => {
//     if (notifying === jobId) return
//     setNotifying(jobId)

//     try {
//       const { error } = await supabase
//         .from('job_requests')
//         .update({
//           artisan_notified_of_review: true,
//           updated_at: new Date().toISOString()
//         })
//         .eq('id', jobId)

//       if (error) throw error

//       toast.success('You have been notified that this job has been reviewed!', { duration: 5000 })
//       fetchAssignedJobs()
//     } catch (err: any) {
//       toast.error('Failed to mark as notified')
//     } finally {
//       setNotifying(null)
//     }
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-7xl mx-auto space-y-12">
//         {/* Header */}
//         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//           <div>
//             <h1 className="text-3xl font-bold text-[var(--blue)]">
//               My Jobs Dashboard
//             </h1>
//             <p className="mt-2 text-gray-600">
//               Active work + newly assigned jobs from admin
//             </p>
//           </div>

//           <button
//             onClick={fetchAssignedJobs}
//             disabled={loading}
//             className="px-6 py-3 bg-[var(--orange)] text-white rounded-xl hover:bg-orange-600 transition flex items-center gap-2 disabled:opacity-50 shadow-md"
//           >
//             <FaRedo className={loading ? 'animate-spin' : ''} />
//             Refresh Jobs
//           </button>
//         </div>

//         {loading && (
//           <div className="min-h-[50vh] flex items-center justify-center">
//             <div className="relative flex items-center justify-center">
//               <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-[var(--orange)] border-opacity-70 shadow-lg"></div>
//               <div className="absolute inset-0 flex items-center justify-center animate-pulse">
//                 <div className="bg-white rounded-full p-3 shadow-md">
//                   <Image src="/log.png" width={56} height={56} alt="Loading..." className="object-contain" />
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {error && (
//           <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
//             <FaExclamationTriangle className="text-red-500 text-6xl mx-auto mb-4" />
//             <p className="text-red-700 font-medium text-lg">{error}</p>
//             <button
//               onClick={fetchAssignedJobs}
//               className="mt-6 px-8 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition shadow-md"
//             >
//               Try Again
//             </button>
//           </div>
//         )}

//         {!loading && !error && (
//           <>
//             {/* ────────────────────────────────────────────────
//                 SECTION 1: ACTIVE / IN-PROGRESS JOBS
//             ──────────────────────────────────────────────── */}
//             {activeJobs.length > 0 ? (
//               <section className="mb-16">
//                 <h2 className="text-2xl md:text-3xl font-bold text-[var(--blue)] mb-6 flex items-center gap-3">
//                   <FaTools className="text-[var(--orange)] text-3xl" />
//                   Active / In-Progress Jobs ({activeJobs.length})
//                 </h2>

//                 <div className="space-y-6">
//                   {activeJobs.map(job => (
//                     <div
//                       key={job.id}
//                       className="bg-gradient-to-br from-blue-50 via-white to-blue-50 rounded-2xl shadow-lg border border-blue-200 p-6 hover:shadow-xl transition-all duration-300"
//                     >
//                       <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
//                         <div className="flex-1">
//                           <div className="flex flex-wrap items-center gap-3 mb-3">
//                             <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
//                               {job.status === 'in_progress' ? 'In Progress' : job.status.replace('_', ' ')}
//                             </span>
//                             <span className="text-sm text-gray-600">
//                               Started {new Date(job.created_at).toLocaleDateString()}
//                             </span>
//                           </div>

//                           <h3 className="text-xl md:text-2xl font-semibold text-[var(--blue)] mb-3">
//                             {job.title}
//                           </h3>

//                           <p className="text-gray-700 mb-5 line-clamp-4">
//                             {job.description}
//                           </p>

//                           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-700 mb-5">
//                             <div className="flex items-center gap-2">
//                               <FaDollarSign className="text-[var(--orange)]" />
//                               <span>Budget: {job.budget_min ? `₦${job.budget_min.toLocaleString()}` : '—'}</span>
//                               {job.budget_max && <span>– ₦{job.budget_max.toLocaleString()}</span>}
//                             </div>

//                             <div className="flex items-center gap-2">
//                               <FaMapMarkerAlt className="text-[var(--orange)]" />
//                               {job.location}
//                             </div>

//                             {job.customer && (
//                               <div className="flex items-center gap-2">
//                                 <FaUserTie className="text-[var(--orange)]" />
//                                 {job.customer.first_name} {job.customer.last_name}
//                               </div>
//                             )}
//                           </div>
//                         </div>

//                         <div className="flex flex-col gap-4 min-w-[240px]">
//                           <Link
//                             href={`/dashboard/artisan/job/${job.id}/active`}
//                             className="px-6 py-3.5 bg-[var(--blue)] hover:bg-blue-700 text-white rounded-xl transition flex items-center justify-center gap-2 font-medium shadow-md text-base"
//                           >
//                             <FaPlayCircle className="text-lg" />
//                             Open Active Workspace
//                           </Link>

//                           <Link
//                             href="/dashboard/artisan/messages"
//                             className="px-6 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition flex items-center justify-center gap-2 font-medium shadow-md text-base"
//                           >
//                             <FaCommentDots />
//                             Chat with Customer/Admin
//                           </Link>

//                           {job.status === 'completed_pending_review' && (
//                             <div className="px-6 py-3.5 bg-green-100 text-green-800 rounded-xl text-center font-medium shadow-sm">
//                               Awaiting Customer Review
//                             </div>
//                           )}

//                           {job.status === 'completed' && (
//                             <div className="px-6 py-3.5 bg-green-600 text-white rounded-xl text-center font-medium shadow-sm flex items-center justify-center gap-2">
//                               <FaCheckCircle />
//                               Job Completed & Reviewed
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </section>
//             ) : (
//               <section className="mb-16 text-center py-12 bg-white rounded-2xl shadow-sm border">
//                 <FaTools className="text-7xl text-gray-300 mx-auto mb-6" />
//                 <h2 className="text-2xl font-bold text-gray-700 mb-3">
//                   No Active Jobs Right Now
//                 </h2>
//                 <p className="text-gray-600 max-w-md mx-auto">
//                   Accept a newly assigned job above to start working.
//                 </p>
//               </section>
//             )}

//             {/* ────────────────────────────────────────────────
//                 SECTION 2: NEWLY ASSIGNED JOBS (PENDING)
//             ──────────────────────────────────────────────── */}
//             <section>
//               <h2 className="text-2xl md:text-3xl font-bold text-[var(--blue)] mb-6 flex items-center gap-3">
//                 <FaHourglassHalf className="text-[var(--orange)]" />
//                 Newly Assigned Jobs ({assignedJobs.length})
//               </h2>

//               {assignedJobs.length === 0 ? (
//                 <div className="bg-white rounded-2xl shadow-sm border p-12 text-center text-gray-500">
//                   <FaExclamationTriangle className="text-6xl text-gray-300 mx-auto mb-4" />
//                   <h3 className="text-xl font-semibold text-gray-700 mb-2">
//                     No new job assignments
//                   </h3>
//                   <p className="text-lg">
//                     When the admin assigns a job to you, it will appear here for your acceptance or decline.
//                   </p>
//                 </div>
//               ) : (
//                 <div className="space-y-6">
//                   {assignedJobs.map(job => (
//                     <div
//                       key={job.id}
//                       className="bg-white rounded-2xl shadow-md border border-yellow-200 p-6 hover:shadow-lg transition-shadow"
//                     >
//                       <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
//                         <div className="flex-1">
//                           <h3 className="text-xl font-semibold text-[var(--blue)] mb-2">
//                             {job.title}
//                           </h3>

//                           <p className="text-gray-700 mb-4 line-clamp-3">
//                             {job.description}
//                           </p>

//                           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600 mb-5">
//                             <div className="flex items-center gap-2">
//                               <FaDollarSign className="text-[var(--orange)]" />
//                               Budget: {job.budget_min ? `₦${job.budget_min.toLocaleString()}` : '—'}
//                               {job.budget_max && ` – ₦${job.budget_max.toLocaleString()}`}
//                             </div>

//                             <div className="flex items-center gap-2">
//                               <FaMapMarkerAlt className="text-[var(--orange)]" />
//                               {job.location}
//                             </div>

//                             <div className="flex items-center gap-2">
//                               <FaClock className="text-[var(--orange)]" />
//                               Preferred: {job.preferred_date || 'Anytime'} {job.preferred_time || ''}
//                             </div>

//                             {job.customer && (
//                               <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
//                                 <FaUserTie className="text-[var(--orange)]" />
//                                 Customer: {job.customer.first_name} {job.customer.last_name}
//                                 {job.customer.phone && ` (${job.customer.phone})`}
//                               </div>
//                             )}
//                           </div>

//                           <div className="flex items-center gap-3">
//                             <span className="font-medium">Status:</span>
//                             <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 flex items-center gap-2">
//                               <FaHourglassHalf />
//                               Assigned – Action Required
//                             </span>
//                           </div>
//                         </div>

//                         <div className="flex flex-col gap-4 min-w-[220px] mt-4 sm:mt-0">
//                           <button
//                             onClick={() => handleAccept(job.id)}
//                             disabled={updating === job.id}
//                             className="px-6 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 font-medium shadow-md text-base"
//                           >
//                             {updating === job.id ? (
//                               <FaSpinner className="animate-spin" />
//                             ) : (
//                               <FaCheckCircle />
//                             )}
//                             Accept & Start Job
//                           </button>

//                           <button
//                             onClick={() => setDeclineModalOpen(job.id)}
//                             disabled={updating === job.id}
//                             className="px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition disabled:opacity-50 font-medium shadow-md text-base"
//                           >
//                             Decline Job
//                           </button>

//                           <Link
//                             href="/dashboard/artisan/messages"
//                             className="px-6 py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition flex items-center justify-center gap-2 font-medium shadow-md text-base"
//                           >
//                             <FaCommentDots size={16} />
//                             Chat with Admin
//                           </Link>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </section>
//           </>
//         )}

//         {/* Decline Modal – unchanged */}
//         {declineModalOpen && (
//           <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
//             <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
//               <h3 className="text-2xl font-bold text-[var(--blue)] mb-5">
//                 Why are you declining this job?
//               </h3>

//               <textarea
//                 value={declineReason}
//                 onChange={e => setDeclineReason(e.target.value)}
//                 placeholder="Please explain your reason (e.g., schedule conflict, skill mismatch, location too far, equipment not available, etc.)"
//                 rows={5}
//                 className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] resize-none mb-6 text-gray-700"
//                 required
//               />

//               <div className="flex flex-col sm:flex-row gap-4">
//                 <button
//                   onClick={() => {
//                     setDeclineModalOpen(null)
//                     setDeclineReason('')
//                   }}
//                   className="flex-1 py-4 px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl transition font-medium text-lg"
//                 >
//                   Cancel
//                 </button>

//                 <button
//                   onClick={() => handleDecline(declineModalOpen)}
//                   disabled={updating === declineModalOpen || !declineReason.trim()}
//                   className={`flex-1 py-4 px-6 rounded-xl text-white font-medium text-lg transition flex items-center justify-center gap-3 shadow-md ${
//                     updating === declineModalOpen || !declineReason.trim()
//                       ? 'bg-red-400 cursor-not-allowed'
//                       : 'bg-red-600 hover:bg-red-700'
//                   }`}
//                 >
//                   {updating === declineModalOpen && <FaSpinner className="animate-spin" />}
//                   Confirm Decline
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }