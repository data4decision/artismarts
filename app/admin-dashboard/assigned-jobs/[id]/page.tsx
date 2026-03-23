'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  FaSpinner, FaArrowLeft, FaImage, FaUserTie, 
  FaMapMarkerAlt, FaCalendarAlt, FaCommentDots, 
  FaTimes, FaExclamationTriangle, 
  FaCheckCircle,
  FaClock
} from 'react-icons/fa'
import Image from 'next/image'

/* =========================
   ✅ SUPABASE RESPONSE TYPE
========================= */
interface SupabaseJobRow {
  id: string
  title: string
  description: string
  location: string
  status: string
  created_at: string
  assigned_at?: string | null
  completed_at: string | null
  completion_note: string | null
  progress_photo_urls: string[] | null
  completion_photo_urls: string[] | null
  progress_notes: string[] | null

  customer: {
    first_name: string | null
    last_name: string | null
    phone: string | null
  } | null

  artisan: {
    first_name: string | null
    last_name: string | null
    phone: string | null
  } | null
}

/* =========================
   ✅ LOCAL STATE TYPE
========================= */
interface JobDetail {
  id: string
  title: string
  description: string
  location: string
  status: string
  created_at: string
  assigned_at?: string | null
  completed_at: string | null
  completion_note: string | null
  progress_photo_urls: string[]
  completion_photo_urls: string[]
  progress_notes: string[]
  customer: {
    first_name: string | null
    last_name: string | null
    phone: string | null
  } | null
  artisan: {
    first_name: string | null
    last_name: string | null
    phone: string | null
  } | null
}

export default function AdminAssignedJobDetail() {
  const { id } = useParams()
  const router = useRouter()

  const [job, setJob] = useState<JobDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      toast.error('Job ID missing')
      router.back()
      return
    }
    fetchJobDetail()
  }, [id, router])

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

      const { data, error } = await supabase
        .from('job_requests')
        .select(`
          id,
          title,
          description,
          location,
          status,
          created_at,
          assigned_at,
          completed_at,
          completion_note,
          progress_photo_urls,
          completion_photo_urls,
          progress_notes,
          customer:customer_id (first_name, last_name, phone),
          artisan:assigned_artisan_id (first_name, last_name, phone)
        `)
        .eq('id', id)
        .single<SupabaseJobRow>() // ✅ FIXED

      if (error) throw error
      if (!data) throw new Error('Job not found')

      setJob({
        id: data.id,
        title: data.title || 'Untitled Job',
        description: data.description || '',
        location: data.location || 'Not specified',
        status: data.status || '',
        created_at: data.created_at,
        assigned_at: data.assigned_at || null,
        completed_at: data.completed_at || null,
        completion_note: data.completion_note || null,

        // ✅ SAFE ARRAYS
        progress_photo_urls: Array.isArray(data.progress_photo_urls) ? data.progress_photo_urls : [],
        completion_photo_urls: Array.isArray(data.completion_photo_urls) ? data.completion_photo_urls : [],
        progress_notes: Array.isArray(data.progress_notes) ? data.progress_notes : [],

        // ✅ SAFE OBJECTS (NO TS ERROR)
        customer: data.customer
          ? {
              first_name: data.customer.first_name ?? null,
              last_name: data.customer.last_name ?? null,
              phone: data.customer.phone ?? null,
            }
          : null,

        artisan: data.artisan
          ? {
              first_name: data.artisan.first_name ?? null,
              last_name: data.artisan.last_name ?? null,
              phone: data.artisan.phone ?? null,
            }
          : null,
      })

    } catch (err: any) {
      console.error('Fetch error:', err)
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
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center text-[var(--blue)] hover:text-[var(--orange)] transition font-medium text-lg"
        >
          <FaArrowLeft className="mr-2" />
          Back to Active Jobs
        </button>

        {/* Main content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[var(--blue)] to-blue-800 text-white p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold">{job.title}</h1>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm opacity-90">
              <div className="flex items-center gap-2">
                <FaUserTie />
                Customer: {job.customer?.first_name ?? ''} {job.customer?.last_name ?? ''}
              </div>
              <div className="flex items-center gap-2">
                <FaUserTie />
                Artisan: {job.artisan?.first_name ?? ''} {job.artisan?.last_name ?? ''}
              </div>
              <div className="flex items-center gap-2">
                <FaCalendarAlt />
                Created: {job.created_at ? new Date(job.created_at).toLocaleDateString() : '—'}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              {job.assigned_at && (
                <div className="flex items-center gap-2">
                  <FaClock />
                  Assigned: {new Date(job.assigned_at).toLocaleDateString()}
                </div>
              )}
              {job.completed_at && (
                <div className="flex items-center gap-2">
                  <FaCheckCircle />
                  Completed: {new Date(job.completed_at).toLocaleDateString()}
                </div>
              )}
            </div>

            <div className="mt-4">
              <span className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${
                job.status === 'assigned' ? 'bg-yellow-500 text-white' :
                job.status === 'in_progress' ? 'bg-blue-500 text-white animate-pulse' :
                job.status === 'completed_pending_review' ? 'bg-orange-500 text-white' :
                'bg-green-500 text-white'
              }`}>
                {job.status === 'assigned' ? 'Assigned – Awaiting Acceptance' :
                 job.status === 'in_progress' ? 'In Progress' :
                 job.status === 'completed_pending_review' ? 'Completed – Pending Review' :
                 'Completed & Approved'}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8 space-y-12">
            {/* Progress Photos */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--blue)] mb-6 flex items-center gap-3">
                <FaImage className="text-[var(--orange)]" />
                Progress Photos (Uploaded during work)
              </h2>

              {job.progress_photo_urls.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                  {job.progress_photo_urls.map((url, idx) => (
                    <div 
                      key={idx}
                      className="relative rounded-xl overflow-hidden shadow-md border border-gray-200 cursor-zoom-in group aspect-video"
                      onClick={() => setZoomedImage(url)}
                    >
                      <Image
                        src={url}
                        alt={`Progress photo ${idx + 1}`}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="text-white text-sm font-medium">Enlarge</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <FaImage className="mx-auto text-7xl text-gray-300 mb-4" />
                  <p className="text-lg text-gray-600">No progress photos have been uploaded yet</p>
                </div>
              )}
            </section>

            {/* Progress Notes */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--blue)] mb-6 flex items-center gap-3">
                <FaCommentDots className="text-[var(--orange)]" />
                Artisan Progress Notes
              </h2>

              {job.progress_notes.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {job.progress_notes.map((noteEntry, idx) => (
                    <div 
                      key={idx}
                      className="bg-gray-50 p-5 rounded-xl border border-gray-200"
                    >
                      <p className="text-sm text-gray-500 mb-2">
                        {noteEntry.split(': ')[0] || 'Unknown time'}
                      </p>
                      <p className="text-gray-800 leading-relaxed">
                        {noteEntry.split(': ').slice(1).join(': ') || noteEntry}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <FaCommentDots className="mx-auto text-6xl text-gray-300 mb-4" />
                  <p className="text-lg text-gray-600">No progress notes added by the artisan yet</p>
                </div>
              )}
            </section>

            {/* Final Completion Photos */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--blue)] mb-6 flex items-center gap-3">
                <FaImage className="text-[var(--orange)]" />
                Final Completion Photos
              </h2>

              {job.completion_photo_urls.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                  {job.completion_photo_urls.map((url, idx) => (
                    <div 
                      key={idx}
                      className="relative rounded-xl overflow-hidden shadow-md border border-gray-200 cursor-zoom-in group aspect-video"
                      onClick={() => setZoomedImage(url)}
                    >
                      <Image
                        src={url}
                        alt={`Completion photo ${idx + 1}`}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="text-white text-sm font-medium">Enlarge</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <FaImage className="mx-auto text-7xl text-gray-300 mb-4" />
                  <p className="text-lg text-gray-600">No final completion photos uploaded</p>
                </div>
              )}
            </section>

            {/* Final Note */}
            {job.completion_note && (
              <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h2 className="text-2xl font-bold text-[var(--blue)] mb-4 flex items-center gap-3">
                  <FaCommentDots className="text-[var(--orange)]" />
                  Final Completion Note
                </h2>
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-lg">
                  {job.completion_note}
                </p>
              </section>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex justify-end">
            <button
              onClick={() => router.back()}
              className="px-8 py-4 bg-[var(--blue)] hover:bg-blue-700 text-white rounded-xl transition font-medium shadow-md flex items-center gap-2"
            >
              <FaArrowLeft />
              Back to Active Jobs
            </button>
          </div>
        </div>
      </div>

      {/* Full-screen Image Zoom Modal */}
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
