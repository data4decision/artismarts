'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  FaSpinner, FaArrowLeft, FaImage, FaUserTie, 
  FaMapMarkerAlt, FaCalendarAlt, FaCommentDots, 
  FaCheckCircle, FaTimesCircle, FaExclamationTriangle,
  FaTimes 
} from 'react-icons/fa'
import Image from 'next/image'

// Type for the Supabase response row
interface SupabaseJobRow {
  id: string
  title: string
  description: string
  location: string
  status: string
  created_at: string
  completed_at: string | null
  completion_note: string | null
  progress_photo_urls: string[] | null
  completion_photo_urls: string[] | null
  customer?: {
    first_name?: string
    last_name?: string
    phone?: string
  } | null
  artisan?: {
    first_name?: string
    last_name?: string
    phone?: string
  } | null
}

// Local state type
interface JobDetail {
  id: string
  title: string
  description: string
  location: string
  status: string
  created_at: string
  completed_at: string | null
  completion_note: string | null
  progress_photo_urls: string[]
  completion_photo_urls: string[]
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

export default function AdminJobDetailPage() {
  const { id } = useParams()
  const router = useRouter()

  const [job, setJob] = useState<JobDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!id) {
      toast.error('Job ID missing')
      router.back()
      return
    }
    fetchJob()
  }, [id, router])

  const fetchJob = async () => {
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
          completed_at,
          completion_note,
          progress_photo_urls,
          completion_photo_urls,
          customer:customer_id (first_name, last_name, phone),
          artisan:assigned_artisan_id (first_name, last_name, phone)
        `)
        .eq('id', id)
        .single<SupabaseJobRow>()

      if (error) throw error
      if (!data) throw new Error('Job not found')

      setJob({
        id: String(data.id || ''),
        title: String(data.title || 'Untitled Job'),
        description: String(data.description || ''),
        location: String(data.location || 'Not specified'),
        status: String(data.status || ''),
        created_at: data.created_at || '',
        completed_at: data.completed_at || null,
        completion_note: data.completion_note || null,
        progress_photo_urls: Array.isArray(data.progress_photo_urls) ? data.progress_photo_urls : [],
        completion_photo_urls: Array.isArray(data.completion_photo_urls) ? data.completion_photo_urls : [],
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
      console.error('Fetch job error:', err)
      setError(err.message || 'Failed to load job details')
      toast.error('Could not load job')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!job || actionLoading) return
    if (!confirm('Approve this job as fully completed?')) return

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('job_requests')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', job.id)

      if (error) throw error
      toast.success('Job approved as completed')
      await fetchJob()
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve job')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!job || actionLoading) return
    const reason = prompt('Reason for rejection (optional):')
    if (reason === null) return

    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('job_requests')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', job.id)

      if (error) throw error
      toast.success('Job reverted to in-progress')
      await fetchJob()
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject job')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return (
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

  if (error || !job) return (
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back & Actions */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-[var(--blue)] hover:text-[var(--orange)] transition font-medium text-lg"
          >
            <FaArrowLeft className="mr-2" />
            Back to Completed Jobs
          </button>
          {job.status === 'completed_pending_review' && (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition flex items-center gap-2 disabled:opacity-50 shadow-md"
              >
                {actionLoading ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                Approve as Completed
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition flex items-center gap-2 disabled:opacity-50 shadow-md"
              >
                {actionLoading ? <FaSpinner className="animate-spin" /> : <FaTimesCircle />}
                Reject / Revert
              </button>
            </div>
          )}
        </div>

        {/* Job Info */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[var(--blue)] to-blue-800 text-white p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold">{job.title}</h1>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${job.status === 'completed' ? 'bg-green-600 text-white' : 'bg-yellow-500 text-white'}`}>
                {job.status === 'completed' ? 'Fully Completed' : 'Pending Admin Review'}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm opacity-90">
              <div className="flex items-center gap-2"><FaUserTie /> Customer: {job.customer?.first_name ?? ''} {job.customer?.last_name ?? ''}</div>
              <div className="flex items-center gap-2"><FaUserTie /> Artisan: {job.artisan?.first_name ?? ''} {job.artisan?.last_name ?? ''}</div>
              <div className="flex items-center gap-2"><FaCalendarAlt /> Completed: {job.completed_at ? new Date(job.completed_at).toLocaleString() : '—'}</div>
            </div>
          </div>

          {/* Body: Photos, Notes, Summary */}
          <div className="p-6 sm:p-8 space-y-12">
            {/* Progress Photos */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--blue)] mb-6 flex items-center gap-3">
                <FaImage className="text-[var(--orange)]" /> Progress Photos
              </h2>
              {job.progress_photo_urls.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                  {job.progress_photo_urls.map((url, idx) => (
                    <div key={idx} className="relative rounded-xl overflow-hidden shadow-md cursor-zoom-in group" onClick={() => setZoomedImage(url)}>
                      <Image src={url} alt={`Progress ${idx + 1}`} width={400} height={300} className="w-full h-48 object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="text-white text-sm font-medium">Enlarge</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed">
                  <FaImage className="mx-auto text-6xl text-gray-300 mb-4" />
                  <p className="text-lg text-gray-600">No progress photos uploaded</p>
                </div>
              )}
            </section>

            {/* Completion Photos */}
            <section>
              <h2 className="text-2xl font-bold text-[var(--blue)] mb-6 flex items-center gap-3">
                <FaImage className="text-[var(--orange)]" /> Final Completion Photos
              </h2>
              {job.completion_photo_urls.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                  {job.completion_photo_urls.map((url, idx) => (
                    <div key={idx} className="relative rounded-xl overflow-hidden shadow-md cursor-zoom-in group" onClick={() => setZoomedImage(url)}>
                      <Image src={url} alt={`Completion ${idx + 1}`} width={400} height={300} className="w-full h-48 object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="text-white text-sm font-medium">Enlarge</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed">
                  <FaImage className="mx-auto text-6xl text-gray-300 mb-4" />
                  <p className="text-lg text-gray-600">No completion photos uploaded</p>
                </div>
              )}
            </section>

            {/* Completion Note */}
            {job.completion_note && (
              <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h2 className="text-2xl font-bold text-[var(--blue)] mb-4 flex items-center gap-3">
                  <FaCommentDots className="text-[var(--orange)]" /> Artisan's Completion Note
                </h2>
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{job.completion_note}</p>
              </section>
            )}

            {/* Summary */}
            <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h2 className="text-2xl font-bold text-[var(--blue)] mb-4">Job Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
                <div><p className="font-medium">Customer</p><p>{job.customer?.first_name ?? ''} {job.customer?.last_name ?? ''}</p></div>
                <div><p className="font-medium">Artisan</p><p>{job.artisan?.first_name ?? ''} {job.artisan?.last_name ?? ''}</p></div>
                <div><p className="font-medium">Status</p><p className={job.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}>{job.status === 'completed' ? 'Fully Completed' : 'Pending Review'}</p></div>
                <div><p className="font-medium">Completed At</p><p>{job.completed_at ? new Date(job.completed_at).toLocaleString() : '—'}</p></div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4" onClick={() => setZoomedImage(null)}>
          <button className="absolute top-6 right-6 text-white bg-black/60 p-4 rounded-full hover:bg-black/80 text-2xl" onClick={() => setZoomedImage(null)}><FaTimes /></button>
          <Image src={zoomedImage} alt="Zoomed photo" fill className="object-contain" quality={100} />
        </div>
      )}
    </div>
  )
}