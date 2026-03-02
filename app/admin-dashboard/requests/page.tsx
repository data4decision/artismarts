// app/dashboard/admin/requests/page.tsx
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
  FaRedo 
} from 'react-icons/fa'

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
          status,
          created_at,
          customer:customer_id (first_name, last_name, phone),
          preferred_artisan:preferred_artisan_id (first_name, last_name, primary_skill)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Safe explicit mapping – fixes the type error
      const typedRequests: JobRequest[] = (data || []).map((raw: any) => ({
        id: String(raw.id || ''),
        customer_id: String(raw.customer_id || ''),
        preferred_artisan_id: raw.preferred_artisan_id ? String(raw.preferred_artisan_id) : null,
        title: String(raw.title || ''),
        description: String(raw.description || ''),
        budget_min: raw.budget_min != null ? Number(raw.budget_min) : null,
        budget_max: raw.budget_max != null ? Number(raw.budget_max) : null,
        job_type: raw.job_type ? String(raw.job_type) : null,
        duration: raw.duration ? String(raw.duration) : null,
        location: String(raw.location || ''),
        preferred_date: raw.preferred_date ? String(raw.preferred_date) : null,
        preferred_time: raw.preferred_time ? String(raw.preferred_time) : null,
        status: String(raw.status || 'pending'),
        created_at: String(raw.created_at || ''),
        customer: raw.customer
          ? {
              first_name: raw.customer.first_name != null ? String(raw.customer.first_name) : null,
              last_name: raw.customer.last_name != null ? String(raw.customer.last_name) : null,
              phone: raw.customer.phone != null ? String(raw.customer.phone) : null,
            }
          : null,
        preferred_artisan: raw.preferred_artisan
          ? {
              first_name: raw.preferred_artisan.first_name != null ? String(raw.preferred_artisan.first_name) : null,
              last_name: raw.preferred_artisan.last_name != null ? String(raw.preferred_artisan.last_name) : null,
              primary_skill: raw.preferred_artisan.primary_skill != null ? String(raw.preferred_artisan.primary_skill) : null,
            }
          : null,
      }))

      setRequests(typedRequests)
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
        id: String(a.id),
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--blue)]">
              Pending Job Requests
            </h1>
            <p className="mt-2 text-gray-600">
              Review and assign requests to artisans
            </p>
          </div>

          <button
            onClick={fetchRequests}
            disabled={loading}
            className="px-6 py-3 bg-[var(--orange)] text-white rounded-xl hover:bg-orange-600 transition flex items-center gap-2 disabled:opacity-50"
          >
            <FaRedo className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <FaSpinner className="animate-spin text-[var(--orange)] text-5xl" />
            <span className="ml-4 text-lg text-gray-600">Loading requests...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
            <p className="text-red-700 font-medium">{error}</p>
            <button
              onClick={fetchRequests}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Requests List */}
        {!loading && !error && (
          <>
            {requests.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border p-12 text-center text-gray-500">
                <FaExclamationTriangle className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No pending requests
                </h3>
                <p className="mb-6">
                  New job requests from customers will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {requests.map(request => (
                  <div
                    key={request.id}
                    className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-[var(--blue)] mb-2">
                          {request.title}
                        </h3>

                        <p className="text-gray-700 mb-4 line-clamp-3">
                          {request.description}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-2">
                            <FaDollarSign className="text-[var(--orange)]" />
                            Budget: {request.budget_min ? `₦${request.budget_min}` : 'Not specified'}
                            {request.budget_max ? ` – ₦${request.budget_max}` : ''}
                          </div>

                          <div className="flex items-center gap-2">
                            <FaClock className="text-[var(--orange)]" />
                            Preferred: {request.preferred_date || 'Anytime'} {request.preferred_time || ''}
                          </div>

                          <div className="flex items-center gap-2">
                            <FaMapMarkerAlt className="text-[var(--orange)]" />
                            {request.location}
                          </div>

                          {request.customer && (
                            <div className="flex items-center gap-2">
                              <FaUserTie className="text-[var(--orange)]" />
                              Requested by: {request.customer.first_name} {request.customer.last_name}
                              {request.customer.phone ? ` (${request.customer.phone})` : ''}
                            </div>
                          )}

                          {request.preferred_artisan && (
                            <div className="flex items-center gap-2">
                              <FaUserTie className="text-[var(--orange)]" />
                              Preferred artisan: {request.preferred_artisan.first_name} {request.preferred_artisan.last_name}
                              {request.preferred_artisan.primary_skill ? ` (${request.preferred_artisan.primary_skill})` : ''}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-3 mt-4 sm:mt-0">
                        {assigning === request.id ? (
                          <div className="flex items-center gap-2 text-gray-600">
                            <FaSpinner className="animate-spin" />
                            Assigning...
                          </div>
                        ) : (
                          <select
                            onChange={(e) => handleAssign(request.id, e.target.value)}
                            defaultValue=""
                            disabled={assigning === request.id}
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)]"
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
                          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition disabled:opacity-50"
                        >
                          Reject Request
                        </button>
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