'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, User, Building2, ShieldCheck, Eye } from 'lucide-react'
import Link from 'next/link'

type ArtisanProfile = {
  id: string
  first_name: string
  last_name: string
  phone: string
  business_name: string
  business_id_type: string
  business_id_number: string
  residential_address: string
  shop_address: string
  association_name: string
  association_address: string
  skills_categories: string[]
  work_location: string
  years_of_experience?: number
  passport_photo_url?: string
  government_id_url?: string
  trade_certificate_url?: string
  reference_letter_url?: string
  verification_status: 'pending' | 'approved' | 'rejected'
  submitted_at?: string
  updated_at?: string
}

export default function AdminArtisanVerification() {
  const [artisans, setArtisans] = useState<ArtisanProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingArtisans()
  }, [])

  const fetchPendingArtisans = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'artisan')
        .eq('verification_status', 'pending')
        .order('submitted_at', { ascending: false })

      if (error) throw error
      setArtisans(data || [])
    } catch (err: any) {
      console.error('Fetch error:', err)
      toast.error('Failed to load pending verifications')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (artisanId: string, action: 'approve' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action} this artisan?`)) return

    setActionLoading(artisanId)
    try {
      const newStatus = action === 'approve' ? 'approved' : 'rejected'
      const updates = {
        verification_status: newStatus,
        verification_approved_at: action === 'approve' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', artisanId)

      if (error) throw error

      toast.success(`Artisan ${action}d successfully`)
      // Refresh list
      setArtisans(prev => prev.filter(a => a.id !== artisanId))
    } catch (err: any) {
      console.error('Action error:', err)
      toast.error(`Failed to ${action} artisan`)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Artisan Verification Requests</h1>
            <p className="mt-2 text-gray-600">Review and approve/reject pending artisan profiles</p>
          </div>
          <button
            onClick={fetchPendingArtisans}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Refresh List
          </button>
        </div>

        {artisans.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-10 text-center">
            <ShieldCheck className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">No pending requests</h2>
            <p className="text-gray-500">All artisan verifications have been processed.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {artisans.map(artisan => (
              <div
                key={artisan.id}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition"
              >
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    {artisan.passport_photo_url ? (
                      <img
                        src={artisan.passport_photo_url}
                        alt="Passport"
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {artisan.first_name} {artisan.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">{artisan.business_name}</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm mb-6">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <span>{artisan.shop_address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-gray-500" />
                      <span>
                        {artisan.business_id_type.toUpperCase()}: {artisan.business_id_number}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {artisan.skills_categories?.map(skill => (
                        <span
                          key={skill}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Documents Links */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Documents</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        { label: 'Passport', url: artisan.passport_photo_url },
                        { label: 'Gov ID', url: artisan.government_id_url },
                        { label: 'Trade Cert', url: artisan.trade_certificate_url },
                        { label: 'Reference', url: artisan.reference_letter_url },
                      ].map(doc => (
                        <div key={doc.label}>
                          {doc.url ? (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> {doc.label}
                            </a>
                          ) : (
                            <span className="text-gray-400">{doc.label}: —</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAction(artisan.id, 'approve')}
                      disabled={actionLoading === artisan.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(artisan.id, 'reject')}
                      disabled={actionLoading === artisan.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}