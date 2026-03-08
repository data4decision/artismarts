// app/dashboard/admin/requests/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  FaSpinner, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, 
  FaUserTie, FaMapMarkerAlt, FaDollarSign, FaClock, FaRedo, 
  FaFilePdf, FaImage, FaDownload 
} from 'react-icons/fa'
import Image from 'next/image'

interface JobRequest {
  id: string
  customer_id: string
  preferred_artisan_id: string | null
  title: string
  description: string
  budget_min: number | null
  budget_max: number | null
  job_type: string | null
  duration: string | null
  location: string
  preferred_date: string | null
  preferred_time: string | null
  attachment_url: string | null
  status: string
  created_at: string
  customer: {
    first_name: string | null
    last_name: string | null
    phone: string | null
  } | null
  preferred_artisan: {
    first_name: string | null
    last_name: string | null
    primary_skill: string | null
  } | null
}

export default function AdminRequestsDashboard() {
  const [requests, setRequests] = useState<JobRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [artisans, setArtisans] = useState<{ id: string; name: string; skill: string }[]>([])

  useEffect(() => {
    fetchRequests()
    fetchArtisans()
  }, [])

  const fetchRequests = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('job_requests')
        .select(`
          id,
          customer_id,
          preferred_artisan_id,
          title,
          description,
          budget_min,
          budget_max,
          job_type,
          duration,
          location,
          preferred_date,
          preferred_time,
          attachment_url,
          status,
          created_at,
          customer:customer_id (first_name, last_name, phone),
          preferred_artisan:preferred_artisan_id (first_name, last_name, primary_skill)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error

      setRequests(data || [])
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError(err.message || 'Failed to load pending requests')
      toast.error('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  const fetchArtisans = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, primary_skill')
        .eq('role', 'artisan')
        .eq('verification_status', 'approved')
        .order('first_name')

      if (error) throw error

      const formatted = (data || []).map(a => ({
        id: a.id,
        name: `${a.first_name || ''} ${a.last_name || ''}`.trim(),
        skill: a.primary_skill || 'General Artisan',
      }))

      setArtisans(formatted)
    } catch (err) {
      console.error('Artisans fetch error:', err)
    }
  }

  const handleAssign = async (requestId: string, artisanId: string) => {
    if (!confirm('Assign this request to the selected artisan?')) return

    setAssigning(requestId)

    try {
      const { error } = await supabase
        .from('job_requests')
        .update({
          assigned_artisan_id: artisanId,
          status: 'assigned',
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)

      if (error) throw error

      toast.success('Request assigned successfully!')
      fetchRequests()
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign request')
    } finally {
      setAssigning(null)
    }
  }

  const handleReject = async (requestId: string) => {
    if (!confirm('Reject this request?')) return

    try {
      const { error } = await supabase
        .from('job_requests')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)

      if (error) throw error

      toast.success('Request rejected')
      fetchRequests()
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject request')
    }
  }

  const getAttachmentIcon = (url: string | null) => {
    if (!url) return null
    if (url.toLowerCase().endsWith('.pdf')) return <FaFilePdf className="text-red-500 text-xl" />
    return <FaImage className="text-blue-500 text-xl" />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--blue)]">
              Pending Customer Requests
            </h1>
            <p className="mt-2 text-gray-600">
              Review detailed job requests and assign artisans
            </p>
          </div>

          <button
            onClick={fetchRequests}
            disabled={loading}
            className="px-6 py-3 bg-[var(--orange)] text-white rounded-xl hover:bg-orange-600 transition flex items-center gap-2 disabled:opacity-50 shadow-md"
          >
            <FaRedo className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <FaSpinner className="animate-spin text-[var(--orange)] text-7xl" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Image src="/log.png" width={40} height={40} alt="Loading..." className="opacity-70" />
              </div>
            </div>
            <p className="mt-6 text-gray-600 font-medium">Loading customer requests...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <FaExclamationTriangle className="text-red-500 text-6xl mx-auto mb-6" />
            <p className="text-red-700 font-medium text-lg mb-4">{error}</p>
            <button
              onClick={fetchRequests}
              className="px-8 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition shadow-md"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Requests List */}
        {!loading && !error && (
          <>
            {requests.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
                <FaExclamationTriangle className="text-6xl text-gray-300 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-gray-700 mb-3">
                  No pending customer requests
                </h3>
                <p className="text-gray-500 max-w-xl mx-auto">
                  When customers submit new job requests, they will appear here for review and assignment.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {requests.map(request => (
                  <div
                    key={request.id}
                    className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
                  >
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-[var(--blue)] to-blue-800 text-white p-6">
                      <h3 className="text-xl font-bold mb-1">
                        {request.title}
                      </h3>
                      <p className="text-sm opacity-90">
                        Submitted {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 space-y-5">
                      {/* Description */}
                      <p className="text-gray-700 line-clamp-3">
                        {request.description}
                      </p>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                        <div className="flex items-start gap-3">
                          <FaUserTie className="text-[var(--orange)] mt-1 text-xl" />
                          <div>
                            <p className="font-medium text-gray-800">Customer</p>
                            <p>
                              {request.customer?.first_name} {request.customer?.last_name}
                              {request.customer?.phone && ` • ${request.customer.phone}`}
                            </p>
                          </div>
                        </div>

                        {request.preferred_artisan && (
                          <div className="flex items-start gap-3">
                            <FaUserTie className="text-[var(--orange)] mt-1 text-xl" />
                            <div>
                              <p className="font-medium text-gray-800">Preferred Artisan</p>
                              <p>
                                {request.preferred_artisan.first_name} {request.preferred_artisan.last_name}
                                {request.preferred_artisan.primary_skill && ` • ${request.preferred_artisan.primary_skill}`}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-3">
                          <FaDollarSign className="text-[var(--orange)] mt-1 text-xl" />
                          <div>
                            <p className="font-medium text-gray-800">Budget Range</p>
                            <p>
                              {request.budget_min ? `₦${request.budget_min.toLocaleString()}` : 'Not specified'}
                              {request.budget_max ? ` – ₦${request.budget_max.toLocaleString()}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <FaClock className="text-[var(--orange)] mt-1 text-xl" />
                          <div>
                            <p className="font-medium text-gray-800">Preferred Time</p>
                            <p>{request.preferred_date || 'Anytime'} {request.preferred_time || ''}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 sm:col-span-2">
                          <FaMapMarkerAlt className="text-[var(--orange)] mt-1 text-xl" />
                          <div>
                            <p className="font-medium text-gray-800">Location</p>
                            <p className="break-words">{request.location}</p>
                          </div>
                        </div>
                      </div>

                      {/* Attachment */}
                      {request.attachment_url && (
                        <div className="pt-4 border-t">
                          <p className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                            {getAttachmentIcon(request.attachment_url)}
                            Attached File
                          </p>
                          <a
                            href={request.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-[var(--blue)] text-sm font-medium shadow-sm"
                          >
                            <FaDownload />
                            Download / View
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Actions Footer */}
                    <div className="p-6 bg-gray-50 border-t flex flex-col sm:flex-row gap-4">
                      {assigning === request.id ? (
                        <div className="flex items-center gap-3 text-gray-600 flex-1">
                          <FaSpinner className="animate-spin text-xl" />
                          Assigning...
                        </div>
                      ) : (
                        <select
                          onChange={(e) => handleAssign(request.id, e.target.value)}
                          defaultValue=""
                          disabled={assigning === request.id}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] bg-white shadow-sm"
                        >
                          <option value="">Assign to Artisan...</option>
                          {artisans.map(a => (
                            <option key={a.id} value={a.id}>
                              {a.name} ({a.skill})
                            </option>
                          ))}
                        </select>
                      )}

                      <button
                        onClick={() => handleReject(request.id)}
                        disabled={assigning === request.id}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                      >
                        <FaTimesCircle />
                        Reject
                      </button>
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

function getAttachmentIcon(url: string | null) {
  if (!url) return null
  if (url.toLowerCase().endsWith('.pdf')) return <FaFilePdf className="text-red-500 text-xl" />
  return <FaImage className="text-blue-500 text-xl" />
}