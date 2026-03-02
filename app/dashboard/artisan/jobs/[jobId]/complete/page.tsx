'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  FaSpinner, 
  FaUpload, 
  FaTrash, 
  FaImage, 
  FaCheckCircle, 
  FaTimesCircle,
  FaArrowLeft,
  FaExclamationTriangle
} from 'react-icons/fa'
import Link from 'next/link'

interface Job {
  id: string
  title: string
  description: string
  budget_min: number | null
  budget_max: number | null
  location: string | null
  status: string
  assigned_artisan_id: string
  completion_photo_urls: string[] | null
}

export default function CompleteJobPage() {
  const params = useParams()
  const jobId = params?.jobId as string | undefined
  const router = useRouter()

  const [job, setJob] = useState<Job | null>(null)
  const [loadingJob, setLoadingJob] = useState(true)
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!jobId || jobId === 'undefined' || !jobId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      toast.error('Invalid or missing job ID')
      router.replace('/dashboard/artisan/jobs')
      return
    }

    fetchJobDetails()
  }, [jobId, router])

  const fetchJobDetails = async () => {
    setLoadingJob(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in')
        router.push('/login')
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
          location,
          status,
          assigned_artisan_id,
          completion_photo_urls
        `)
        .eq('id', jobId)
        .eq('assigned_artisan_id', user.id)
        .single()

      if (error) throw error
      if (!data) {
        toast.error('Job not found or not assigned to you')
        router.replace('/dashboard/artisan/jobs')
        return
      }

      if (data.status !== 'in_progress') {
        toast.error('This job is not ready for completion')
        router.replace('/dashboard/artisan/jobs')
        return
      }

      setJob(data)
    } catch (err: any) {
      console.error('Fetch error:', err)
      toast.error(err.message || 'Failed to load job details')
      router.replace('/dashboard/artisan/jobs')
    } finally {
      setLoadingJob(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || [])
    const total = files.length + newFiles.length

    if (total > 5) {
      toast.error('Maximum 5 photos allowed')
      return
    }

    const valid = newFiles.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB`)
        return false
      }
      return true
    })

    setFiles(prev => [...prev, ...valid])

    valid.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setPreviews(prev => [...prev, reader.result as string])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one photo')
      return
    }

    setUploading(true)
    setProgress(0)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const uploadedUrls: string[] = job?.completion_photo_urls || []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${jobId}-${Date.now()}-${i}.${fileExt}`
        const filePath = `completions/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('job-completions')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('job-completions')
          .getPublicUrl(filePath)

        uploadedUrls.push(urlData.publicUrl)

        setProgress(Math.round(((i + 1) / files.length) * 100))
      }

      const { error: updateError } = await supabase
        .from('job_requests')
        .update({
          completion_photo_urls: uploadedUrls,
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId!)

      if (updateError) throw updateError

      toast.success('Job completed successfully!')
      router.push('/dashboard/artisan/jobs')
    } catch (err: any) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  if (loadingJob) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FaSpinner className="animate-spin text-[var(--orange)] text-6xl" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-md">
          <FaExclamationTriangle className="text-red-500 text-7xl mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Job not found
          </h2>
          <p className="text-gray-600 mb-6">
            The job may not exist, has already been completed, or is not assigned to you.
          </p>
          <Link
            href="/dashboard/artisan/jobs"
            className="inline-flex items-center px-8 py-4 bg-[var(--blue)] text-white rounded-xl hover:bg-blue-700 transition shadow-md"
          >
            <FaArrowLeft className="mr-2" />
            Back to Assigned Jobs
          </Link>
        </div>
      </div>
    )
  }

  const existingPhotos = job.completion_photo_urls || []

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/artisan/jobs"
            className="p-3 rounded-full bg-white shadow hover:bg-gray-100 transition"
          >
            <FaArrowLeft className="text-[var(--blue)]" size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[var(--blue)]">
              Complete "{job.title}"
            </h1>
            <p className="text-gray-600 mt-1">
              Upload photos to prove the job is finished
            </p>
          </div>
        </div>

        {/* Job Summary */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-[var(--blue)] mb-4">
            Job Summary
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
            <div>
              <p className="font-medium mb-1">Description</p>
              <p>{job.description || 'No description provided'}</p>
            </div>
            <div>
              <p className="font-medium mb-1">Location</p>
              <p>{job.location || 'Not specified'}</p>
            </div>
            <div>
              <p className="font-medium mb-1">Budget</p>
              <p className="text-lg font-bold">
                {job.budget_min ? `₦${job.budget_min.toLocaleString()}` : '—'}
                {job.budget_max ? ` – ₦${job.budget_max.toLocaleString()}` : ''}
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">Current Status</p>
              <span className="inline-block px-4 py-1.5 bg-blue-100 text-blue-800 rounded-full font-medium">
                In Progress
              </span>
            </div>
          </div>
        </div>

        {/* Existing Completion Photos */}
        {existingPhotos.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-[var(--blue)] mb-4 flex items-center gap-2">
              <FaImage className="text-[var(--orange)]" />
              Already Uploaded Photos
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {existingPhotos.map((url, index) => (
                <div key={index} className="relative rounded-xl overflow-hidden shadow-md">
                  <img
                    src={url}
                    alt={`Completion photo ${index + 1}`}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition flex items-center justify-center">
                    <p className="text-white font-medium text-sm">
                      Uploaded earlier
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload New Photos */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-[var(--blue)] mb-4 flex items-center gap-3">
            <FaUpload className="text-[var(--orange)]" />
            Upload Additional Photos (up to 5 total)
          </h2>

          <label className="block cursor-pointer">
            <div className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
              files.length + existingPhotos.length < 5 
                ? 'border-gray-300 hover:border-[var(--orange)] hover:bg-orange-50' 
                : 'border-gray-300 bg-gray-50 opacity-70 cursor-not-allowed'
            }`}>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                disabled={(files.length + existingPhotos.length) >= 5 || uploading}
              />
              <FaUpload className="mx-auto text-6xl text-gray-400 mb-4" />
              <p className="text-xl font-medium text-gray-700 mb-2">
                Click or drag photos here
              </p>
              <p className="text-sm text-gray-500">
                Max 5 images total • JPG, PNG • less than 5MB each
              </p>
            </div>
          </label>

          {/* New Upload Previews */}
          {previews.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                New Photos Preview ({previews.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {previews.map((preview, index) => (
                  <div key={index} className="relative group rounded-xl overflow-hidden shadow-sm">
                    <img
                      src={preview}
                      alt={`New preview ${index + 1}`}
                      className="w-full h-48 object-cover"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition shadow-md"
                    >
                      <FaTrash size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-10">
            {uploading && (
              <div className="mb-6">
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div 
                    className="bg-[var(--orange)] h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-center text-sm text-gray-600">
                  Uploading... {progress}%
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleUpload}
                disabled={uploading || files.length === 0}
                className="flex-1 py-4 px-8 bg-[var(--orange)] hover:bg-orange-600 text-white font-bold rounded-xl transition disabled:opacity-50 shadow-lg flex items-center justify-center gap-3"
              >
                {uploading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <FaCheckCircle />
                    Upload & Mark as Completed
                  </>
                )}
              </button>

              <button
                onClick={() => router.push('/dashboard/artisan/jobs')}
                className="py-4 px-10 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}