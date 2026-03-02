// app/dashboard/artisan/find-work/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { FaSearch, FaTools, FaHammer, FaWrench, FaCar, FaPaintRoller, FaBolt, FaPlug, FaHome, FaStar, FaHardHat, FaLightbulb, FaDollarSign, FaClock, FaMapMarkerAlt } from 'react-icons/fa'

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

// Type for each job from Supabase
interface JobRequest {
  id: string
  title: string
  description: string
  budget_min: number | null
  budget_max: number | null
  job_type: 'fixed' | 'hourly' | 'quote' | null
  duration: string | null
  location: string | null
  skills: string[]
  created_at: string
  customer: {
    first_name: string | null
    last_name: string | null
  } | null
}

export default async function FindWorkPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const cookieStore = cookies()
  const supabase = await createServerSupabaseClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-[var(--blue)] mb-4">Please Sign In</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to view and apply for jobs.</p>
          <Link
            href="/login"
            className="inline-block px-8 py-3 bg-[var(--orange)] text-white font-medium rounded-xl hover:bg-orange-600 transition"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  // Parse search params
  const searchQuery = typeof searchParams.q === 'string' ? searchParams.q.trim() : ''
  const categoryFilter = typeof searchParams.category === 'string' ? searchParams.category.trim() : null
  const skillFilter = typeof searchParams.skill === 'string' ? searchParams.skill.trim() : null
  const jobType = typeof searchParams.job_type === 'string' ? searchParams.job_type : null
  const minBudget = typeof searchParams.min_budget === 'string' ? parseFloat(searchParams.min_budget) : null
  const maxBudget = typeof searchParams.max_budget === 'string' ? parseFloat(searchParams.max_budget) : null
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1

  const limit = 12
  const offset = (page - 1) * limit

  // Build Supabase query
  let query = supabase
    .from('job_requests')
    .select(
      `
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
    `,
      { count: 'exact' }
    )
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Apply filters
  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
  }

  if (categoryFilter || skillFilter) {
    const target = skillFilter || categoryFilter
    query = query.contains('skills', [target])
  }

  if (jobType && ['fixed', 'hourly', 'quote'].includes(jobType)) {
    query = query.eq('job_type', jobType)
  }

  if (!isNaN(minBudget!) && minBudget !== null) {
    query = query.gte('budget_min', minBudget)
  }

  if (!isNaN(maxBudget!) && maxBudget !== null) {
    query = query.lte('budget_max', maxBudget)
  }

  // Fetch data
  const { data, error, count } = await query

  if (error) {
    console.error('Supabase error:', error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Jobs</h2>
          <p className="text-gray-600 mb-6">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Fix: Explicitly type the jobs array
  const jobs: JobRequest[] = data || []

  const totalJobs = count || 0
  const totalPages = Math.ceil(totalJobs / limit)

  // Client-side filter for categories (UI only)
  const filteredCategories = skillCategories.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-gray-50/70 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--blue)] mb-4">
            Find Work Opportunities
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            {totalJobs} open job requests waiting for skilled artisans like you
          </p>
        </div>

        {/* Search & Filters Form */}
        <form className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Keyword Search */}
            <div className="relative">
              <input
                type="text"
                name="q"
                placeholder="Keyword or skill"
                defaultValue={searchQuery}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)]"
              />
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            {/* Category */}
            <select
              name="category"
              defaultValue={categoryFilter || ''}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)]"
            >
              <option value="">All Categories</option>
              {skillCategories.map(cat => (
                <option key={cat.title} value={cat.title}>
                  {cat.title}
                </option>
              ))}
            </select>

            {/* Job Type */}
            <select
              name="job_type"
              defaultValue={jobType || ''}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)]"
            >
              <option value="">All Job Types</option>
              <option value="fixed">Fixed Price</option>
              <option value="hourly">Hourly</option>
              <option value="quote">Request Quote</option>
            </select>

            {/* Budget Range */}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                name="min_budget"
                placeholder="Min Budget"
                defaultValue={minBudget || ''}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)]"
              />
              <input
                type="number"
                name="max_budget"
                placeholder="Max Budget"
                defaultValue={maxBudget || ''}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)]"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="px-8 py-3 bg-[var(--orange)] hover:bg-orange-600 text-white font-medium rounded-xl transition shadow-md"
            >
              Filter Jobs
            </button>
          </div>
        </form>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCategories.length === 0 ? (
            <div className="col-span-full py-16 text-center text-gray-500">
              <p className="text-xl">No matching categories or skills found</p>
            </div>
          ) : (
            filteredCategories.map(category => (
              <Link
                key={category.title}
                href={`/dashboard/artisan/find-work?category=${encodeURIComponent(category.title)}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`}
                className={`bg-white rounded-2xl shadow-md border p-6 hover:shadow-xl transition-all ${
                  categoryFilter === category.title ? 'border-[var(--orange)] bg-orange-50/30' : 'border-gray-200 hover:border-[var(--orange)]/60'
                }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl text-[var(--orange)]">{category.icon}</div>
                  <h3 className="text-xl font-bold text-[var(--blue)]">{category.title}</h3>
                </div>
                <div className="space-y-1 text-gray-700">
                  {category.skills.map(skill => (
                    <div key={skill}>• {skill}</div>
                  ))}
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Jobs List */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-[var(--blue)] mb-6">
            {searchQuery || categoryFilter
              ? `Matching Jobs (${totalJobs})`
              : `Latest Open Jobs (${totalJobs})`}
          </h2>

          {jobs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border p-12 text-center text-gray-500">
              <FaSearch className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No open jobs found
              </h3>
              <p className="mb-6">
                {searchQuery || categoryFilter
                  ? "Try adjusting your search or filters"
                  : "New jobs are added daily — check back soon!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map(job => (  // ← fixed: (job) now infers from JobRequest[]
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

          {/* Pagination */}
          {totalJobs > limit && (
            <div className="mt-12 flex justify-center gap-4 flex-wrap">
              {page > 1 && (
                <Link
                  href={{
                    pathname: '/dashboard/artisan/find-work',
                    query: { ...searchParams, page: page - 1 }
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                >
                  Previous
                </Link>
              )}

              <span className="px-6 py-3 bg-gray-100 rounded-xl font-medium">
                Page {page} of {totalPages}
              </span>

              {page < totalPages && (
                <Link
                  href={{
                    pathname: '/dashboard/artisan/find-work',
                    query: { ...searchParams, page: page + 1 }
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}