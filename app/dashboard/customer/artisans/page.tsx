'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { FaSearch, FaSpinner, FaExclamationTriangle, FaStar, FaMapMarkerAlt, FaUser, FaClock } from 'react-icons/fa'
import Image from 'next/image'
import Link from 'next/link'

// Define skill categories
const skillCategories = [
  { title: "Home & Building Services", skills: ["Plumber", "Electrician", "Carpenter", "Mason / Bricklayer", "Painter / Decorator", "Tiler"] },
  { title: "Mechanical & Technical Services", skills: ["Generator Repair Technician", "AC Technician (Installation & Repairs)", "Refrigerator & Freezer Technician", "Washing Machine Technician"] },
  { title: "General Maintenance", skills: ["Handyman (Minor repairs)", "Welder / Fabricator", "Aluminum Fabricator (Doors & Windows)"] },
  { title: "Interior & Finishing Services", skills: ["POP Ceiling Installer", "Interior Decorator", "Furniture Maker", "Upholsterer"] },
  { title: "Security & Installations", skills: ["CCTV Installer", "Solar Panel Installer", "Electric Fence Installer"] },
  { title: "ICT & Digital Technicians", skills: ["Computer Repair Technician", "Phone Repair Technician", "Network / Internet Technician"] },
  { title: "Personal & Domestic Services", skills: ["Cleaner / Janitorial Services", "Home Care Assistant", "Laundry & Dry Cleaning Agent", "Barber/Hairdresser"] },
  { title: "Automotive Artisans", skills: ["Auto Mechanic", "Auto Electrician", "Panel Beater", "Car Painter"] },
  { title: "Specialised & Industrial Artisans", skills: ["Industrial Electrician", "Industrial Plumber", "HVAC Engineer", "Heavy Equipment Technician"] },
  { title: "Event & Creative Service Artisans", skills: ["Event Electrician", "Event Sound Technician", "Event Lighting Technician", "Stage Fabricator"] },
] as const

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
  verification_status: string
}

export default function FindArtisansPage() {
  const [artisans, setArtisans] = useState<ArtisanProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchArtisans()
  }, [])

  const fetchArtisans = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to browse artisans')
        return
      }

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
          verification_status
        `)
        .eq('role', 'artisan')
        .eq('verification_status', 'approved')
        .order('average_rating', { ascending: false, nullsFirst: false })
        .limit(20)

      if (error) throw error

      setArtisans(data || [])
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError(err.message || 'Failed to load artisans')
      toast.error('Failed to load artisans')
    } finally {
      setLoading(false)
    }
  }

  // Simple client-side filter
  const filteredArtisans = artisans.filter(artisan =>
    `${artisan.first_name || ''} ${artisan.last_name || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (artisan.primary_skill || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (artisan.business_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (artisan.skills_categories || []).some(s => (s || '').toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--blue)] mb-4">
            Find Skilled Artisans
          </h1>
          <p className="text-lg sm:text-xl text-[var(--blue)]">
            Connect with verified professionals for your needs
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, skill, or service..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none transition shadow-sm"
            />
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--blue)] text-xl" />
          </div>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-center">
          <button
            onClick={fetchArtisans}
            disabled={loading}
            className={`px-8 py-4 rounded-xl font-medium text-lg transition flex items-center justify-center gap-3 shadow-md min-w-[220px]
              ${loading 
                ? 'bg-gray-50 cursor-not-allowed text-white' 
                : 'bg-[var(--orange)] hover:bg-orange-600 text-[var(--white)]'
              }`}
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                Loading...
              </>
            ) : (
              'Refresh Artisans'
            )}
          </button>
        </div>

        {/* Full-screen Loading Overlay */}
        {loading && (
          <div className="min-h-screen flex items-center justify-center bg-[var(--white)]">
            <div className="relative flex items-center justify-center">
            {/* Outer spinning ring */}
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-[var(--orange)] border-opacity-70 shadow-md"></div>
              {/* Inner static logo with subtle pulse */}
                <div className="absolute inset-0 flex items-center justify-center animate-pulse-slow">
                  <div className="bg-[var(--white)] rounded-full p-2 shadow-sm">
                    <Image src="/log.png" width={48} height={48}  priority alt="Loading..." className="object-contain"  />  
                  </div>
                </div>
              </div>
            </div>


        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-2xl mx-auto">
            <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
            <p className="text-red-700 font-medium text-lg">{error}</p>
            <button
              onClick={fetchArtisans}
              className="mt-6 px-8 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition shadow-md"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Artisans Grid */}
        {!loading && !error && (
          <>
            {filteredArtisans.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border p-12 text-center text-[var(--blue)] max-w-3xl mx-auto">
                <FaSearch className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[var(--blue)] mb-2">
                  No artisans found
                </h3>
                <p className="mb-6">
                  {searchQuery
                    ? "Try a different search term or refresh"
                    : "Verified artisans will appear here when available"}
                </p>
                <button
                  onClick={fetchArtisans}
                  className="inline-block px-8 py-4 bg-[var(--blue)] text-[var(--white)] rounded-xl hover:bg-blue-700 transition shadow-md"
                >
                  Refresh List
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArtisans.map(artisan => (
                  <Link
                    key={artisan.id}
                    href={`/dashboard/customer/artisans/${artisan.id}`}
                    className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-lg hover:border-[var(--orange)]/60 transition-all group"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      {artisan.profile_image ? (
                        <img
                          src={artisan.profile_image}
                          alt={`${artisan.first_name} ${artisan.last_name}`}
                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                          <FaUser className="text-[var(--blue)] text-2xl" />
                        </div>
                      )}

                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-[var(--blue)] group-hover:text-[var(--orange)] transition-colors">
                          {artisan.first_name} {artisan.last_name}
                        </h3>
                        <p className="text-sm text-[var(--blue)]">
                          {artisan.primary_skill || artisan.skills_categories?.[0] || 'Artisan'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm text-[var(--blue)]">
                      {artisan.average_rating && (
                        <div className="flex items-center gap-1">
                          <FaStar className="text-yellow-400" />
                          <span>
                            {artisan.average_rating.toFixed(1)} ({artisan.rating_count || 0} reviews)
                          </span>
                        </div>
                      )}

                      {artisan.work_location && (
                        <div className="flex items-center gap-2">
                          <FaMapMarkerAlt className="text-[var(--orange)]" />
                          <span>{artisan.work_location}</span>
                        </div>
                      )}

                      {artisan.years_of_experience && (
                        <div className="flex items-center gap-2">
                          <FaClock className="text-[var(--orange)]" />
                          <span>{artisan.years_of_experience} years experience</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}