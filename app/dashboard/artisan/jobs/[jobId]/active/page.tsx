'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  FaSpinner, FaCheckCircle, FaUpload, FaImage, FaCommentDots, 
  FaArrowLeft, FaInfoCircle, FaTimes, FaDownload,
  FaExclamationTriangle, FaExpand
} from 'react-icons/fa'
import Image from 'next/image'
import Link from 'next/link'

export default function ArtisanActiveJob() {
  const params = useParams()
  const jobId = params.jobId as string | undefined
  const router = useRouter()

  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [photos, setPhotos] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [actionType, setActionType] = useState<'ongoing' | 'complete' | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)

  const [zoomedPhoto, setZoomedPhoto] = useState<{ url: string; type: string } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!jobId) {
      toast.error('Job ID missing')
      router.replace('/dashboard/artisan/jobs')
      return
    }
    fetchJob()
  }, [jobId, router])

  const fetchJob = async () => {
    if (!jobId) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }

      const { data, error } = await supabase
        .from('job_requests')
        .select(`
          id,
          title,
          description,
          status,
          location,
          assigned_artisan_id,
          progress_photo_urls,
          completion_photo_urls,
          completed_at,
          customer:customer_id (first_name, last_name, phone)
        `)
        .eq('id', jobId)
        .eq('assigned_artisan_id', user.id)
        .single()

      if (error) throw error
      if (!data) throw new Error('Job not found')

      setJob(data)

      // Check if already completed
      if (data.status === 'completed_pending_review') {
        setIsCompleted(true)
      } else {
        setIsCompleted(false)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load job')
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return

    const newFiles = Array.from(e.target.files)
    if (photos.length + newFiles.length > 10) {
      toast.error('Maximum 10 new photos per update')
      return
    }

    const newPreviews = newFiles.map(file => URL.createObjectURL(file))
    setPreviewUrls(prev => [...prev, ...newPreviews])
    setPhotos(prev => [...prev, ...newFiles])
  }

  const removePreviewPhoto = (index: number) => {
    URL.revokeObjectURL(previewUrls[index])
    setPhotos(prev => prev.filter((_, i) => i !== index))
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  const handleDownload = async (url: string, filename = 'photo.jpg') => {
    try {
      const response = await fetch(url, { mode: 'cors' })
      if (!response.ok) throw new Error('Network response was not ok')
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
      toast.success('Download started!')
    } catch (err) {
      console.error('Download error:', err)
      toast.error('Failed to download photo. Try right-click → Save image as.')
    }
  }

  const handleSubmit = async (type: 'ongoing' | 'complete') => {
    if (type === 'complete' && photos.length === 0 && !note.trim()) {
      if (!confirm('No new photos or note. Still mark as complete?')) return
    }

    if (type === 'ongoing' && photos.length === 0 && !note.trim()) {
      toast.error('Add photo or note for progress update')
      return
    }

    setSubmitting(true)
    setActionType(type)

    try {
      const newPhotoUrls: string[] = []

      if (photos.length > 0) {
        for (const file of photos) {
          const ext = file.name.split('.').pop() || 'jpg'
          const path = `progress/${jobId}/${Date.now()}.${ext}`

          const { error: uploadError } = await supabase.storage
            .from('job-progress-photos')
            .upload(path, file)

          if (uploadError) throw uploadError

          const { data } = supabase.storage.from('job-progress-photos').getPublicUrl(path)
          newPhotoUrls.push(data.publicUrl)
        }
      }

      const currentProgress = job.progress_photo_urls || []
      const updatedProgress = type === 'ongoing' 
        ? [...currentProgress, ...newPhotoUrls]
        : currentProgress

      const updateData: any = {
        updated_at: new Date().toISOString(),
        progress_photo_urls: updatedProgress,
      }

      if (type === 'complete') {
        updateData.status = 'completed_pending_review'
        updateData.completion_photo_urls = newPhotoUrls.length > 0 ? newPhotoUrls : null
        updateData.completed_at = new Date().toISOString()
        // Optional: you can also save the final note here
        // updateData.note = note.trim() || null
      }

      const { error } = await supabase
        .from('job_requests')
        .update(updateData)
        .eq('id', jobId)

      if (error) throw error

      toast.success(
        type === 'complete'
          ? 'Job submitted for review!'
          : 'Progress saved — photos added!'
      )

      previewUrls.forEach(url => URL.revokeObjectURL(url))

      setPhotos([])
      setPreviewUrls([])
      setNote('')

      // Refresh job data
      await fetchJob()

      if (type === 'complete') {
        setIsCompleted(true)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit')
    } finally {
      setSubmitting(false)
      setActionType(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--white)]">
        <div className="text-center">
          <FaSpinner className="animate-spin text-[var(--orange)] text-6xl mx-auto mb-4" />
          <p className="text-[var(--blue)] font-medium">Loading active job...</p>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--white)]">
        <div className="text-center max-w-md p-8 bg-[var(--white)] rounded-2xl shadow-lg border border-[var(--blue)]/20">
          <FaExclamationTriangle className="text-[var(--orange)] text-6xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[var(--blue)] mb-3">Job not found</h2>
          <p className="text-[var(--blue)] mb-6">
            This job may no longer be active or you don't have access.
          </p>
          <button
            onClick={() => router.push('/dashboard/artisan/jobs')}
            className="px-6 py-3 bg-[var(--orange)] text-[var(--white)] rounded-xl hover:bg-orange-600 transition font-medium"
          >
            Back to My Jobs
          </button>
        </div>
      </div>
    )
  }

  const allUploadedPhotos = [
    ...(job.progress_photo_urls || []).map((url: string) => ({ url, type: 'progress' })),
    ...(job.completion_photo_urls || []).map((url: string) => ({ url, type: 'completion' })),
  ]

  return (
    <div className="min-h-screen bg-[var(--white)] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Top navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <button
            onClick={() => router.push('/dashboard/artisan/jobs')}
            className="flex items-center gap-2 text-[var(--blue)] hover:text-[var(--orange)] transition font-medium"
          >
            <FaArrowLeft /> Back to My Jobs
          </button>

          <Link
            href={`/dashboard/artisan/messages?jobId=${jobId}`}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--blue)] hover:bg-blue-700 text-[var(--white)] rounded-lg transition shadow-sm font-medium"
          >
            <FaCommentDots /> Chat with Admin
          </Link>
        </div>

        <div className="bg-[var(--white)] rounded-2xl shadow-xl border border-[var(--blue)]/10 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[var(--blue)] to-blue-800 text-[var(--white)] p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold">{job.title}</h1>
            <p className="mt-2 opacity-90">
              Customer: {job.customer?.first_name} {job.customer?.last_name}
              {job.customer?.phone && ` • ${job.customer.phone}`}
            </p>
            <p className="mt-1 text-sm opacity-80">
              Location: {job.location || 'Not specified'}
            </p>
          </div>

          {/* Guide */}
          <div className="p-6 sm:p-8 bg-[var(--white)] border-b border-[var(--blue)]/10">
            <div className="flex items-start gap-4">
              <div className="text-[var(--orange)] text-4xl mt-1 flex-shrink-0">
                <FaInfoCircle />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--blue)] mb-3">
                  How to Use This Page
                </h2>
                <ul className="space-y-2 text-[var(--blue)]">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--orange)] font-bold mt-1">→</span>
                    <span>Take clear photos of your work as you progress</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--orange)] font-bold mt-1">→</span>
                    <span>Add a short note describing what you did (optional)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--orange)] font-bold mt-1">→</span>
                    <span>Click "Save Progress" to upload and continue working</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--orange)] font-bold mt-1">→</span>
                    <span>When 100% done → click "Mark as Complete"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--orange)] font-bold mt-1">→</span>
                    <span>All your uploaded photos will stay visible here</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Completion Success Banner */}
          {isCompleted && (
            <div className="bg-green-50 border-l-4 border-green-500 p-6 mx-6 mt-6 rounded-r-xl">
              <div className="flex items-start gap-4">
                <FaCheckCircle className="text-green-600 text-4xl mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-2xl font-bold text-green-800 mb-2">
                    Job Submitted for Review
                  </h3>
                  <p className="text-green-700 text-lg">
                    Your work has been successfully submitted. All your photos and progress are shown below.
                  </p>
                  {job.completed_at && (
                    <p className="text-green-600 mt-2">
                      Completed on: {new Date(job.completed_at).toLocaleString()}
                    </p>
                  )}
                  <button
                    onClick={() => router.push('/dashboard/artisan/jobs')}
                    className="mt-6 px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium shadow-md"
                  >
                    Back to My Jobs
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="p-6 sm:p-8 space-y-10">
            {/* Your Uploaded Photos Section */}
            <div className="bg-gradient-to-b from-gray-50 to-white p-6 rounded-2xl border border-[var(--blue)]/10 shadow-inner">
              <h3 className="text-2xl font-bold text-[var(--blue)] mb-6 flex items-center gap-3">
                <FaImage className="text-[var(--orange)] text-3xl" />
                Your Uploaded Photos for This Job
              </h3>

              {allUploadedPhotos.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-[var(--blue)]/30">
                  <FaImage className="mx-auto text-6xl text-gray-300 mb-4" />
                  <p className="text-lg font-medium text-[var(--blue)]">No photos uploaded yet</p>
                  <p className="text-[var(--blue)]/70 mt-2">
                    {!isCompleted 
                      ? 'Upload progress photos above — they will appear here after saving.'
                      : 'This job was completed without additional photos.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                  {allUploadedPhotos.map(({ url, type }, idx) => (
                    <div 
                      key={url}
                      className="group relative rounded-2xl overflow-hidden shadow-lg border border-gray-200 hover:border-[var(--orange)] hover:shadow-2xl transition-all duration-300 bg-white"
                    >
                      <div 
                        className="relative cursor-zoom-in"
                        onClick={() => setZoomedPhoto({ url, type })}
                      >
                        <Image
                          src={url}
                          alt={`${type} photo ${idx + 1}`}
                          width={500}
                          height={500}
                          className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <FaExpand className="text-white text-5xl drop-shadow-2xl" />
                        </div>
                      </div>

                      <div className="absolute top-3 left-3">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full shadow-md ${
                          type === 'progress' ? 'bg-[var(--orange)] text-white' : 'bg-green-600 text-white'
                        }`}>
                          {type === 'progress' ? 'Progress' : 'Completion'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDownload(url, `${type}-photo-${idx + 1}.jpg`)}
                        className="absolute bottom-3 right-3 bg-[var(--orange)] text-white p-3 rounded-full shadow-lg hover:bg-orange-700 transition transform hover:scale-110 active:scale-95"
                        title="Download this photo"
                      >
                        <FaDownload size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upload section - only show if not completed */}
            {!isCompleted && (
              <div>
                <h3 className="text-xl font-semibold text-[var(--blue)] mb-4 flex items-center gap-3">
                  <FaUpload className="text-[var(--orange)]" />
                  Upload New Progress Photos
                </h3>

                <label className="block mb-6">
                  <div className="border-3 border-dashed border-[var(--blue)]/40 rounded-2xl p-10 sm:p-16 text-center cursor-pointer hover:border-[var(--orange)] hover:bg-[var(--orange)]/5 transition-all duration-200">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                    <div className="mx-auto w-20 h-20 rounded-full bg-[var(--orange)]/10 flex items-center justify-center mb-4">
                      <FaUpload className="text-[var(--orange)] text-4xl" />
                    </div>
                    <p className="text-xl font-medium text-[var(--blue)] mb-2">
                      Click or drag photos here
                    </p>
                    <p className="text-sm text-[var(--blue)]/80">
                      Up to 10 images • JPG, PNG
                    </p>
                  </div>
                </label>

                {previewUrls.length > 0 && (
                  <div className="mb-8">
                    <p className="text-base font-medium text-[var(--blue)] mb-3">
                      New photos to upload ({previewUrls.length})
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {previewUrls.map((url, idx) => (
                        <div 
                          key={idx}
                          className="relative group rounded-xl overflow-hidden shadow-md border border-[var(--blue)]/10 hover:border-[var(--orange)] transition-all duration-200"
                        >
                          <Image
                            src={url}
                            alt={`new preview ${idx + 1}`}
                            width={400}
                            height={400}
                            className="object-cover w-full aspect-square"
                          />
                          <button
                            onClick={() => removePreviewPhoto(idx)}
                            className="absolute top-3 right-3 bg-[var(--orange)] text-[var(--white)] rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition hover:bg-orange-700"
                          >
                            <FaTimes size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Note - only show if not completed */}
            {!isCompleted && (
              <div>
                <label className="block text-sm font-medium text-[var(--blue)] mb-2">
                  Progress Note (optional but recommended)
                </label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Example: Finished plumbing today. Testing pressure tomorrow..."
                  rows={4}
                  className="w-full px-4 py-3 border border-[var(--blue)]/30 rounded-xl focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] resize-none bg-[var(--white)]"
                />
              </div>
            )}

            {/* Action buttons or completed message */}
            <div className="pt-6 border-t border-[var(--blue)]/10">
              {isCompleted ? (
                <div className="text-center">
                  <p className="text-xl font-semibold text-green-700 mb-6">
                    This job is now pending admin review — no further updates possible.
                  </p>
                  <button
                    onClick={() => router.push('/dashboard/artisan/jobs')}
                    className="px-10 py-4 bg-[var(--orange)] text-white rounded-xl hover:bg-orange-700 transition font-bold shadow-lg text-lg"
                  >
                    Return to My Jobs List
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => handleSubmit('ongoing')}
                    disabled={submitting || (photos.length === 0 && !note.trim())}
                    className={`flex-1 py-4 px-6 rounded-xl font-semibold text-[var(--white)] flex items-center justify-center gap-2 transition shadow-md ${
                      submitting || (photos.length === 0 && !note.trim())
                        ? 'bg-[var(--blue)]/50 cursor-not-allowed'
                        : 'bg-[var(--orange)] hover:bg-orange-600'
                    }`}
                  >
                    {submitting && actionType === 'ongoing' && <FaSpinner className="animate-spin" />}
                    Save Progress (Ongoing)
                  </button>

                  <button
                    onClick={() => handleSubmit('complete')}
                    disabled={submitting}
                    className={`flex-1 py-4 px-6 rounded-xl font-semibold text-[var(--white)] flex items-center justify-center gap-2 transition shadow-md ${
                      submitting
                        ? 'bg-[var(--blue)]/50 cursor-not-allowed'
                        : 'bg-[var(--orange)] hover:bg-orange-600'
                    }`}
                  >
                    {submitting && actionType === 'complete' && <FaSpinner className="animate-spin" />}
                    <FaCheckCircle />
                    Mark as Complete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Zoom Modal */}
      {zoomedPhoto && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setZoomedPhoto(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white bg-black/60 p-4 rounded-full hover:bg-black/80 transition text-2xl"
            onClick={() => setZoomedPhoto(null)}
          >
            <FaTimes />
          </button>

          <div className="relative max-w-[95vw] max-h-[95vh] w-full h-full flex items-center justify-center">
            <Image
              src={zoomedPhoto.url}
              alt="Zoomed photo"
              fill
              className="object-contain"
              quality={100}
              priority
            />

            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDownload(zoomedPhoto.url, `${zoomedPhoto.type}-full.jpg`)
              }}
              className="absolute bottom-8 right-8 bg-[var(--orange)] text-white px-6 py-4 rounded-full shadow-2xl hover:bg-orange-700 transition flex items-center gap-3 text-lg font-medium"
            >
              <FaDownload /> Download Full Image
            </button>
          </div>
        </div>
      )}
    </div>
  )
}