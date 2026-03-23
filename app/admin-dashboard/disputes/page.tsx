'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  FaSpinner, 
  FaExclamationTriangle, 
  FaRedo, 
  FaUserTie, 
  FaBan,
  FaEye
} from 'react-icons/fa'
import Link from 'next/link'
import Image from 'next/image'

/* =========================
   ✅ SUPABASE RESPONSE TYPE
========================= */
interface SupabaseCancelledJobRow {
  id: string
  title: string
  status: string
  completed_at: string | null
  decline_reason: string | null

  customer: {
    first_name: string | null
    last_name: string | null
  } | null

  artisan: {
    first_name: string | null
    last_name: string | null
  } | null
}

/* =========================
   ✅ LOCAL TYPE
========================= */
interface CancelledJob {
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
  decline_reason: string | null
}

export default function AdminCancelledJobs() {
  const router = useRouter()
  const [jobs, setJobs] = useState<CancelledJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCancelledJobs()
  }, [])

  const fetchCancelledJobs = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Please sign in as admin')
        router.replace('/login')
        return
      }

      const { data, error } = await supabase
        .from('job_requests')
        .select(`
          id,
          title,
          status,
          completed_at,
           decline_reason,
          customer:customer_id (first_name, last_name),
          artisan:assigned_artisan_id (first_name, last_name)
        `)
        .eq('status', 'cancelled') // ✅ FIXED
        .order('completed_at', { ascending: false, nullsFirst: false })
        .returns<SupabaseCancelledJobRow[]>() // ✅ TYPE SAFE

      if (error) throw error

      const typedJobs: CancelledJob[] = (data || []).map((item) => ({
        id: item.id,
        title: item.title || 'Untitled Job',

        customer: item.customer
          ? {
              first_name: item.customer.first_name ?? null,
              last_name: item.customer.last_name ?? null,
            }
          : null,

        artisan: item.artisan
          ? {
              first_name: item.artisan.first_name ?? null,
              last_name: item.artisan.last_name ?? null,
            }
          : null,

        status: item.status,
        completed_at: item.completed_at ?? null,
        decline_reason: item.decline_reason ?? null,
      }))

      setJobs(typedJobs)

    } catch (err: any) {
      console.error('Fetch cancelled jobs error:', err)
      setError(err.message || 'Failed to load cancelled jobs')
      toast.error('Could not load cancelled jobs')
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
              Admin - Cancelled Jobs
            </h1>
            <p className="mt-2 text-[var(--blue)]/70">
              Jobs that were cancelled by customers or artisans
            </p>
          </div>

          <button
            onClick={fetchCancelledJobs}
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
          </div>
        )}

        {/* Jobs */}
        {!loading && !error && (
          <>
            {jobs.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border p-12 text-center text-gray-500">
                <FaBan className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No cancelled jobs
                </h3>
                <p>No jobs have been cancelled yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white rounded-2xl shadow-md border border-red-200 p-5 hover:shadow-lg transition"
                  >
                    <h3 className="text-lg font-semibold text-red-700 mb-3">
                      {job.title}
                    </h3>

                    <div className="space-y-2 text-sm text-gray-700 mb-4">
                      <div className="flex items-center gap-2">
                        <FaUserTie />
                        Customer: {job.customer?.first_name} {job.customer?.last_name}
                      </div>
                      <div className="flex items-center gap-2">
                        <FaUserTie />
                        Artisan: {job.artisan?.first_name} {job.artisan?.last_name}
                      </div>
                      <div className="mt-3 px-2 py-1 bg-gray-50 border rounded-lg">
                        <p className="text-sm font-semibold text-[var(--blue)] mb-1">
                            Decline Reason:
                        </p>
                        <p className="text-sm text-[var(--blue)]/70 italic">
                            {job.decline_reason || 'No reason provided'}
                        </p>
                        </div>
                    </div>
                    

                    <Link
                      href={`/admin-dashboard/assigned-jobs/${job.id}`}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition"
                    >
                      <FaEye />
                      View Details
                    </Link>
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