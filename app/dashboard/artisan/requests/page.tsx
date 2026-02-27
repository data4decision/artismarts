// app/dashboard/artisan/find-work/page.tsx
'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { FaSearch, FaSpinner, FaExclamationTriangle, FaDollarSign, FaClock, FaMapMarkerAlt } from 'react-icons/fa'
import Link from 'next/link'

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

export default function FindWorkPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to view jobs')
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
          skills,
          created_at,
          customer:customer_id (first_name, last_name)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      setJobs(data || [])
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError(err.message || 'Failed to load available jobs')
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  // Simple client-side filter (you can make it server-side later)
  const filteredJobs = jobs.filter(job =>
    job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.skills?.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-gray-50/70 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--blue)] mb-4">
            Find Work Opportunities
          </h1>
          <p className="text-lg sm:text-xl text-gray-600">
            Browse open job requests from customers
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by skill, title or description..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl text-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none transition shadow-sm"
            />
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
          </div>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-center">
          <button
            onClick={fetchJobs}
            disabled={loading}
            className="px-6 py-3 bg-[var(--orange)] text-white font-medium rounded-xl hover:bg-orange-600 transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <FaSpinner className="animate-spin" /> : null}
            Refresh Jobs
          </button>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <FaSpinner className="animate-spin text-[var(--orange)] text-5xl" />
            <span className="ml-4 text-lg text-gray-600">Loading available jobs...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <FaExclamationTriangle className="text-red-500 text-4xl mx-auto mb-4" />
            <p className="text-red-700 font-medium">{error}</p>
            <button
              onClick={fetchJobs}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Jobs List */}
        {!loading && !error && (
          <>
            {filteredJobs.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border p-12 text-center text-gray-500">
                <FaSearch className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No open jobs found
                </h3>
                <p className="mb-6">
                  {searchQuery
                    ? "Try a different search term"
                    : "Check back soon — new jobs are posted daily!"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.map(job => (
                  <div
                    key={job.id}
                    className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                  >
                    <h3 className="text-xl font-semibold text-[var(--blue)] mb-2 line-clamp-2">
                      {job.title}
                    </h3>

                    {job.customer && (
                      <p className="text-sm text-gray-600 mb-3">
                        Posted by {job.customer.first_name} {job.customer.last_name ? job.customer.last_name.charAt(0) + '.' : ''}
                      </p>
                    )}

                    <p className="text-gray-700 mb-4 line-clamp-3">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap gap-3 mb-4">
                      {job.skills?.map((skill: string) => (
                        <span
                          key={skill}
                          className="px-3 py-1 bg-[var(--orange)]/10 text-[var(--orange)] text-sm rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-6 text-sm text-gray-600 mb-4">
                      {job.budget_min && (
                        <div className="flex items-center gap-1">
                          <FaDollarSign className="text-[var(--orange)]" />
                          ${job.budget_min}{job.budget_max ? `–$${job.budget_max}` : '+'}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <FaClock className="text-[var(--orange)]" />
                        {job.duration || 'Flexible'}
                      </div>
                      <div className="flex items-center gap-1">
                        <FaMapMarkerAlt className="text-[var(--orange)]" />
                        {job.location || 'Remote'}
                      </div>
                    </div>

                    <Link
                      href={`/dashboard/artisan/jobs/${job.id}`}
                      className="inline-block px-6 py-3 bg-[var(--orange)] hover:bg-orange-600 text-white font-medium rounded-xl transition"
                    >
                      View Details & Apply
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