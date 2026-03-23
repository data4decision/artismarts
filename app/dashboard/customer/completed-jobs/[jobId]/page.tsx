'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  FaSpinner, FaCheckCircle, FaArrowLeft, FaImage, 
  FaUserTie, FaMapMarkerAlt, FaCalendarAlt, 
  FaCommentDots, FaTimes, FaExclamationTriangle 
} from 'react-icons/fa'
import Image from 'next/image'

// Type for artisan object
interface Artisan {
  first_name: string | null
  last_name: string | null
}

// Supabase job row type
interface SupabaseJobRow {
  id: string
  title: string
  description: string
  location: string
  status: string
  completed_at: string | null
  completion_note: string | null
  progress_photo_urls: string[] | null
  completion_photo_urls: string[] | null
  assigned_artisan: Artisan | null
}

// Local state type
interface CompletedJobDetail {
  id: string
  title: string
  description: string
  location: string
  status: string
  completed_at: string | null
  completion_note: string | null
  progress_photo_urls: string[]
  completion_photo_urls: string[]
  assigned_artisan: Artisan | null
}

export default function CompletedJobDetailPage() {
  const params = useParams()
  const jobId = params.jobId as string
  const router = useRouter()

  const [job, setJob] = useState<CompletedJobDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)

  useEffect(() => {
    if (!jobId) {
      toast.error('Job ID missing')
      router.back()
      return
    }
    fetchJobDetail()
  }, [jobId, router])

  const fetchJobDetail = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in')
        router.replace('/login')
        return
      }

      // Supabase query with relational select
      const { data, error } = await supabase
        .from('job_requests')
        .select(`
          id,
          title,
          description,
          location,
          status,
          completed_at,
          completion_note,
          progress_photo_urls,
          completion_photo_urls,
          assigned_artisan:assigned_artisan_id (
            first_name,
            last_name
          )
        `)
        .eq('id', jobId)
        .eq('customer_id', user.id)
        .single<SupabaseJobRow>() // Type assertion here

      if (error) throw error
      if (!data) throw new Error('Job not found or not accessible')

      // Map Supabase data to local state with safe arrays
      setJob({
        id: data.id,
        title: data.title ?? 'Untitled Job',
        description: data.description ?? '',
        location: data.location ?? 'Not specified',
        status: data.status ?? '',
        completed_at: data.completed_at ?? null,
        completion_note: data.completion_note ?? null,
        progress_photo_urls: data.progress_photo_urls ?? [],
        completion_photo_urls: data.completion_photo_urls ?? [],
        assigned_artisan: data.assigned_artisan ?? null,
      })
    } catch (err: any) {
      console.error('Fetch job detail error:', err)
      setError(err.message || 'Failed to load job details')
      toast.error('Could not load job details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-[var(--orange)] border-opacity-70 shadow-lg"></div>
          <div className="absolute inset-0 flex items-center justify-center animate-pulse">
            <div className="bg-white rounded-full p-3 shadow-md">
              <Image src="/log.png" width={56} height={56} alt="Loading..." className="object-contain" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-md">
          <FaExclamationTriangle className="text-red-500 text-7xl mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Oops!</h2>
          <p className="text-gray-600 mb-8">{error || 'Job not found'}</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-8 py-4 bg-[var(--blue)] text-white rounded-xl hover:bg-blue-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const progressPhotos = job.progress_photo_urls
  const completionPhotos = job.completion_photo_urls

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center text-[var(--blue)] hover:text-[var(--orange)] transition font-medium text-lg"
        >
          <FaArrowLeft className="mr-2" />
          Back to Completed Jobs
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[var(--blue)] to-blue-800 text-white p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold">{job.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-6 text-sm opacity-90">
              <div className="flex items-center gap-2">
                <FaUserTie />
                Artisan: {job.assigned_artisan?.first_name ?? ''} {job.assigned_artisan?.last_name ?? ''}
              </div>
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt />
                {job.location}
              </div>
              {job.completed_at && (
                <div className="flex items-center gap-2">
                  <FaCalendarAlt />
                  Completed: {new Date(job.completed_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 space-y-12">
            {/* Progress Photos */}
            <div>
              <h2 className="text-2xl font-bold text-[var(--blue)] mb-6 flex items-center gap-3">
                <FaImage className="text-[var(--orange)]" />
                Progress Photos (During Work)
              </h2>

              {progressPhotos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {progressPhotos.map((url, idx) => (
                    <div 
                      key={idx}
                      className="relative rounded-xl overflow-hidden shadow-lg border border-gray-200 cursor-zoom-in group"
                      onClick={() => setZoomedImage(url)}
                    >
                      <Image
                        src={url}
                        alt={`Progress photo ${idx + 1}`}
                        width={600}
                        height={400}
                        className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="text-white text-lg font-medium">Click to enlarge</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <FaImage className="mx-auto text-7xl text-gray-300 mb-4" />
                  <p className="text-xl font-medium text-gray-600">
                    No progress photos were uploaded during the job
                  </p>
                </div>
              )}
            </div>

            {/* Completion Photos */}
            <div>
              <h2 className="text-2xl font-bold text-[var(--blue)] mb-6 flex items-center gap-3">
                <FaImage className="text-[var(--orange)]" />
                Final Completion Photos
              </h2>

              {completionPhotos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {completionPhotos.map((url, idx) => (
                    <div 
                      key={idx}
                      className="relative rounded-xl overflow-hidden shadow-lg border border-gray-200 cursor-zoom-in group"
                      onClick={() => setZoomedImage(url)}
                    >
                      <Image
                        src={url}
                        alt={`Completion photo ${idx + 1}`}
                        width={600}
                        height={400}
                        className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="text-white text-lg font-medium">Click to enlarge</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <FaImage className="mx-auto text-7xl text-gray-300 mb-4" />
                  <p className="text-xl font-medium text-gray-600">
                    No final completion photos were uploaded
                  </p>
                </div>
              )}
            </div>

            {/* Completion Note */}
            <div>
              <h2 className="text-2xl font-bold text-[var(--blue)] mb-6 flex items-center gap-3">
                <FaCommentDots className="text-[var(--orange)]" />
                Artisan's Final Note
              </h2>

              {job.completion_note ? (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-lg">
                    {job.completion_note}
                  </p>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <p className="text-xl font-medium text-gray-600">
                    No final note was added by the artisan
                  </p>
                </div>
              )}
            </div>

            {/* Summary Info */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="text-xl font-semibold text-[var(--blue)] mb-4">Job Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-gray-700">
                <div>
                  <p className="font-medium">Status</p>
                  <p className="mt-1">
                    {job.status === 'completed' ? 'Fully Approved' : 'Pending Final Review'}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Completed On</p>
                  <p className="mt-1">
                    {job.completed_at ? new Date(job.completed_at).toLocaleString() : 'Not available'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex justify-end">
            <button
              onClick={() => router.back()}
              className="px-8 py-4 bg-[var(--blue)] hover:bg-blue-700 text-white rounded-xl transition font-medium shadow-md flex items-center gap-2"
            >
              <FaArrowLeft />
              Back to Completed Jobs
            </button>
          </div>
        </div>
      </div>

      {/* Full-screen Image Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white bg-black/60 p-5 rounded-full hover:bg-black/80 transition text-3xl"
            onClick={() => setZoomedImage(null)}
          >
            <FaTimes />
          </button>

          <div className="relative max-w-[95vw] max-h-[95vh] w-full h-full flex items-center justify-center">
            <Image
              src={zoomedImage}
              alt="Full-screen photo"
              fill
              className="object-contain"
              quality={100}
              priority
            />
          </div>
        </div>
      )}
    </div>
  )
}