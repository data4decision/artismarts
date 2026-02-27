// app/dashboard/artisan/proposals/page.tsx
'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { FaSpinner, FaExclamationTriangle, FaEye, FaCheckCircle, FaTimesCircle, FaClock, FaDollarSign } from 'react-icons/fa'
import Link from 'next/link'

type Proposal = {
  id: string
  job_id: string
  job_title: string
  customer_name: string
  message: string
  proposed_price: number
  proposed_timeline: string | null
  attachment_url: string | null
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  created_at: string
}

export default function MyProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMyProposals()
  }, [])

  const fetchMyProposals = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to view your proposals')
        return
      }

      const { data, error } = await supabase
        .from('proposals')
        .select(`
          id,
          job_id,
          job:job_id (title),
          message,
          proposed_price,
          proposed_timeline,
          attachment_url,
          status,
          created_at
        `)
        .eq('artisan_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Flatten and rename fields for easier use
      const formatted = (data || []).map(p => ({
        id: p.id,
        job_id: p.job_id,
        job_title: p.job?.title || 'Job Removed',
        customer_name: 'Customer', // You can join customer name if needed
        message: p.message,
        proposed_price: p.proposed_price,
        proposed_timeline: p.proposed_timeline,
        attachment_url: p.attachment_url,
        status: p.status,
        created_at: p.created_at
      }))

      setProposals(formatted)
    } catch (err: any) {
      console.error('Fetch proposals error:', err)
      setError(err.message || 'Failed to load your proposals')
      toast.error('Failed to load proposals')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"><FaCheckCircle /> Accepted</span>
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium"><FaTimesCircle /> Rejected</span>
      case 'withdrawn':
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">Withdrawn</span>
      default:
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">Pending</span>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--blue)]">My Proposals</h1>
            <p className="mt-2 text-gray-600">Track proposals you've sent to customers</p>
          </div>

          <button
            onClick={fetchMyProposals}
            disabled={loading}
            className="px-6 py-2.5 bg-[var(--orange)] text-white rounded-lg font-medium hover:bg-orange-600 transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <FaSpinner className="animate-spin" />}
            Refresh
          </button>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <FaSpinner className="animate-spin text-[var(--orange)] text-5xl" />
            <span className="ml-4 text-lg text-gray-600">Loading your proposals...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
            <p className="text-red-700 font-medium">{error}</p>
            <button
              onClick={fetchMyProposals}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Proposals List */}
        {!loading && !error && (
          <>
            {proposals.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border p-12 text-center text-gray-500">
                <FaSearch className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No proposals yet
                </h3>
                <p className="mb-6">
                  When you submit a proposal for a job, it will appear here.
                </p>
                <Link
                  href="/dashboard/artisan/find-work"
                  className="inline-block px-6 py-3 bg-[var(--orange)] text-white rounded-xl hover:bg-orange-600 transition"
                >
                  Find Jobs to Apply
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {proposals.map(proposal => (
                  <div
                    key={proposal.id}
                    className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-[var(--blue)] mb-2">
                          {proposal.job_title}
                        </h3>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-1">
                            <FaDollarSign className="text-[var(--orange)]" />
                            Proposed: ${proposal.proposed_price}
                          </div>
                          <div className="flex items-center gap-1">
                            <FaClock className="text-[var(--orange)]" />
                            Timeline: {proposal.proposed_timeline || 'Not specified'}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Status:</span>
                            {getStatusBadge(proposal.status)}
                          </div>
                        </div>

                        <p className="text-gray-700 mb-4 line-clamp-3">
                          {proposal.message}
                        </p>

                        {proposal.attachment_url && (
                          <a
                            href={proposal.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-[var(--orange)] hover:underline text-sm font-medium mb-4"
                          >
                            <FaPaperclip /> View Attachment
                          </a>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-3 mt-4 sm:mt-0">
                        <Link
                          href={`/dashboard/artisan/proposals/${proposal.id}`}
                          className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition flex items-center gap-2"
                        >
                          <FaEye size={16} />
                          View Details
                        </Link>
                        <span className="text-xs text-gray-500">
                          Submitted: {new Date(proposal.created_at).toLocaleDateString()}
                        </span>
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