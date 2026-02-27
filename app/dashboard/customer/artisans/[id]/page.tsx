// app/dashboard/customer/artisans/[id]/page.tsx
'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { FaStar, FaMapMarkerAlt, FaClock, FaUser, FaPhone, FaSpinner, FaExclamationTriangle, FaBriefcase, FaTools } from 'react-icons/fa'
import Link from 'next/link'

interface ArtisanProfile {
  id: string
  first_name: string
  last_name: string
  profile_image: string | null
  business_name: string | null
  primary_skill: string | null
  skills_categories: string[] | null
  work_location: string | null
  average_rating: number | null
  rating_count: number | null
  years_of_experience: number | null
  bio: string | null
  portfolio_items: Array<{ url: string; name?: string; type?: string }> | null
  phone: string | null
  verification_status: string
}

export default function ArtisanProfilePage() {
  const { id } = useParams()
  const [artisan, setArtisan] = useState<ArtisanProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetchArtisanProfile()
  }, [id])

  const fetchArtisanProfile = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          profile_image,
          business_name,
          primary_skill,
          skills_categories,
          work_location,
          average_rating,
          rating_count,
          years_of_experience,
          bio,
          portfolio_items,
          phone,
          verification_status
        `)
        .eq('id', id)
        .eq('role', 'artisan')
        .eq('verification_status', 'approved')
        .single()

      if (error) throw error
      if (!data) throw new Error('Artisan not found or not verified')

      setArtisan(data)
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError(err.message || 'Failed to load artisan profile')
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <FaSpinner className="animate-spin text-[var(--orange)] text-6xl" />
          <p className="text-lg text-gray-600">Loading artisan profile...</p>
        </div>
      </div>
    )
  }

  if (error || !artisan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
          <FaExclamationTriangle className="text-red-500 text-6xl mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Profile Not Found</h2>
          <p className="text-gray-600 mb-8">
            {error || "This artisan profile may be unavailable or not verified."}
          </p>
          <Link
            href="/dashboard/customer/find-artisans"
            className="inline-block px-8 py-3 bg-[var(--orange)] text-white rounded-xl hover:bg-orange-600 transition"
          >
            ← Back to Find Artisans
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Link
          href="/dashboard/customer/find-artisans"
          className="inline-flex items-center gap-2 text-[var(--orange)] hover:text-orange-700 font-medium mb-8 transition-colors"
        >
          ← Back to Artisans
        </Link>

        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden mb-8">
          <div className="p-6 sm:p-10">
            <div className="flex flex-col sm:flex-row gap-8 items-start">
              {/* Photo */}
              <div className="flex-shrink-0">
                {artisan.profile_image ? (
                  <img
                    src={artisan.profile_image}
                    alt={`${artisan.first_name} ${artisan.last_name}`}
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-[var(--orange)]/20 shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gray-200 flex items-center justify-center border-4 border-[var(--orange)]/20 shadow-lg">
                    <FaUser className="text-gray-400 text-5xl" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-[var(--blue)] mb-2">
                  {artisan.first_name} {artisan.last_name}
                </h1>

                <div className="flex flex-wrap items-center gap-4 mb-4">
                  {artisan.primary_skill && (
                    <div className="flex items-center gap-2 bg-[var(--orange)]/10 text-[var(--orange)] px-4 py-1 rounded-full text-sm font-medium">
                      <FaTools /> {artisan.primary_skill}
                    </div>
                  )}

                  {artisan.average_rating && (
                    <div className="flex items-center gap-1 text-lg">
                      <FaStar className="text-yellow-400" />
                      <span className="font-semibold">{artisan.average_rating.toFixed(1)}</span>
                      <span className="text-gray-500">({artisan.rating_count || 0} reviews)</span>
                    </div>
                  )}
                </div>

                {artisan.business_name && (
                  <p className="text-lg text-gray-700 mb-2">
                    <strong>{artisan.business_name}</strong>
                  </p>
                )}

                {artisan.work_location && (
                  <div className="flex items-center gap-2 text-gray-600 mb-4">
                    <FaMapMarkerAlt className="text-[var(--orange)]" />
                    <span>{artisan.work_location}</span>
                  </div>
                )}

                {artisan.years_of_experience && (
                  <div className="flex items-center gap-2 text-gray-600 mb-4">
                    <FaClock className="text-[var(--orange)]" />
                    <span>{artisan.years_of_experience} years experience</span>
                  </div>
                )}

                {/* Bio */}
                {artisan.bio && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-[var(--blue)] mb-2">About</h3>
                    <p className="text-gray-700 whitespace-pre-line">{artisan.bio}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 sm:px-10 py-6 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-4">
            <Link
              href={`/dashboard/customer/book/${artisan.id}`}
              className="flex-1 min-w-[200px] py-3 px-6 bg-[var(--orange)] hover:bg-orange-600 text-white font-medium rounded-xl transition text-center"
            >
              Book Now
            </Link>

            <button
              onClick={() => window.open(`tel:${artisan.phone}`)}
              disabled={!artisan.phone}
              className="flex-1 min-w-[200px] py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition text-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Call {artisan.phone || '(No phone)'}
            </button>
          </div>
        </div>

        {/* Skills */}
        {artisan.skills_categories && artisan.skills_categories.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 sm:p-8 mb-8">
            <h2 className="text-2xl font-bold text-[var(--blue)] mb-4">Skills & Services</h2>
            <div className="flex flex-wrap gap-3">
              {artisan.skills_categories.map(skill => (
                <span
                  key={skill}
                  className="px-4 py-2 bg-[var(--orange)]/10 text-[var(--orange)] rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio */}
        {artisan.portfolio_items && artisan.portfolio_items.length > 0 && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-[var(--blue)] mb-6">Portfolio</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {artisan.portfolio_items.map((item: any, index: number) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={item.url}
                    alt={item.name || 'Portfolio item'}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}