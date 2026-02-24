'use client'

export const dynamic = 'force-dynamic'
export const revalidate = 0

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Search, User, Building2, MapPin, ShieldCheck, Star } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

type ApprovedArtisan = {
  id: string
  first_name: string
  last_name: string
  phone: string
  business_name: string
  skills_categories: string[]
  work_location: string
  residential_address?: string
  shop_address?: string
  profile_image?: string
  verification_status: 'approved'
  verification_approved_at?: string
  average_rating?: number | null
  years_of_experience?: number | null
}

export default function ApprovedArtisansPage() {
  const [artisans, setArtisans] = useState<ApprovedArtisan[]>([])
  const [filteredArtisans, setFilteredArtisans] = useState<ApprovedArtisan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchApprovedArtisans()
  }, [])

  const fetchApprovedArtisans = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          phone,
          business_name,
          skills_categories,
          work_location,
          residential_address,
          shop_address,
          profile_image,
          verification_status,
          verification_approved_at,
          average_rating,
          years_of_experience
        `)
        .eq('role', 'artisan')
        .eq('verification_status', 'approved')
        .order('verification_approved_at', { ascending: false, nullsFirst: false })

      if (error) throw error

      setArtisans(data || [])
      setFilteredArtisans(data || [])
    } catch (err: any) {
      console.error('Error fetching approved artisans:', err)
      toast.error('Failed to load approved artisans')
    } finally {
      setLoading(false)
    }
  }

  // Simple client-side search/filter
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredArtisans(artisans)
      return
    }

    const term = searchTerm.toLowerCase().trim()
    const filtered = artisans.filter(artisan =>
      `${artisan.first_name} ${artisan.last_name}`.toLowerCase().includes(term) ||
      artisan.business_name?.toLowerCase().includes(term) ||
      artisan.work_location?.toLowerCase().includes(term) ||
      artisan.skills_categories?.some(skill => skill.toLowerCase().includes(term))
    )

    setFilteredArtisans(filtered)
  }, [searchTerm, artisans])

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Approved Artisans</h1>
            <p className="mt-2 text-gray-600">
              Verified professionals ready for jobs ({filteredArtisans.length})
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name, business, location..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        {filteredArtisans.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-10 text-center">
            <ShieldCheck className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              No approved artisans found
            </h2>
            <p className="text-gray-500">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'No artisans have been approved yet'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredArtisans.map(artisan => (
              <div
                key={artisan.id}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    {artisan.profile_image ? (
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200">
                        <Image
                          src={artisan.profile_image}
                          alt={`${artisan.first_name} ${artisan.last_name}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-500" />
                      </div>
                    )}

                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {artisan.first_name} {artisan.last_name}
                      </h3>
                      <p className="text-sm text-gray-600 font-medium">
                        {artisan.business_name || 'Independent Artisan'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm mb-5">
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>{artisan.work_location || artisan.residential_address || '—'}</span>
                    </div>

                    {artisan.skills_categories?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {artisan.skills_categories.slice(0, 4).map(skill => (
                          <span
                            key={skill}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {skill}
                          </span>
                        ))}
                        {artisan.skills_categories.length > 4 && (
                          <span className="text-xs text-gray-500">
                            +{artisan.skills_categories.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4 text-green-600" />
                        <span>Approved {formatDate(artisan.verification_approved_at)}</span>
                      </div>

                      {artisan.average_rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span>{artisan.average_rating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span>No ratings yet</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      href={`/dashboard/admin/artisans/${artisan.id}`}
                      className="flex-1 text-center py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                    >
                      View Profile
                    </Link>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(artisan.phone)
                        toast.success('Phone copied!')
                      }}
                      className="py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                    >
                      Copy Phone
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Refresh button */}
        <div className="mt-8 text-center">
          <button
            onClick={fetchApprovedArtisans}
            className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition"
          >
            Refresh List
          </button>
        </div>
      </div>
    </div>
  )
}