'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import imageCompression from 'browser-image-compression'
import { 
  FaSpinner, FaCheckCircle, FaTimesCircle, FaUpload, FaArrowLeft, FaImage 
} from 'react-icons/fa'
import Image from 'next/image'

const MAX_PHOTOS = 5
const MAX_FILE_SIZE_MB = 5
const MAX_COMPRESSED_SIZE_MB = 1.5     // target size after compression
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export default function ArtisanJobCompletion() {
  const { jobId } = useParams()
  const router = useRouter()

  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [compressedPhotos, setCompressedPhotos] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState<number[]>([]) // per-file progress
  const [submitting, setSubmitting] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!jobId) return
    fetchJob()
  }, [jobId])

  const fetchJob = async () => {
    // ... same fetch logic as before ...
    // (omitted for brevity – copy your existing fetchJob code here)
  }

  // ────────────────────────────────────────────────
  //  Process files (used by both drop & file input)
  // ────────────────────────────────────────────────
  const processFiles = async (fileList: FileList | File[]) => {
    setUploadError(null)

    const newFiles = Array.from(fileList)
    const currentCount = photos.length

    if (currentCount + newFiles.length > MAX_PHOTOS) {
      toast.error(`Maximum ${MAX_PHOTOS} photos allowed`)
      setUploadError(`You can upload up to ${MAX_PHOTOS} photos in total`)
      return
    }

    const validFiles: File[] = []
    const errors: string[] = []

    for (const file of newFiles) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        errors.push(`${file.name} is too large (> ${MAX_FILE_SIZE_MB} MB)`)
        continue
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name} has unsupported format`)
        continue
      }
      validFiles.push(file)
    }

    if (errors.length > 0) {
      toast.error(errors.join('\n'))
      setUploadError(errors.join(', '))
    }

    if (validFiles.length === 0) return

    // Show previews immediately (original quality)
    const newPreviews = validFiles.map(f => URL.createObjectURL(f))
    setPreviewUrls(prev => [...prev, ...newPreviews])
    setPhotos(prev => [...prev, ...validFiles])

    // Compress in background
    setUploading(true)
    const compressed: File[] = []
    const progressArray = new Array(validFiles.length).fill(0)
    setUploadProgress(prev => [...prev, ...progressArray])

    for (let i = 0; i < validFiles.length; i++) {
      try {
        const options = {
          maxSizeMB: MAX_COMPRESSED_SIZE_MB,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: validFiles[i].type,
          initialQuality: 0.85,
          alwaysKeepResolution: false
        }

        const compressedFile = await imageCompression(validFiles[i], options)

        compressed.push(compressedFile)

        // Update progress (simulated – real progress hard in browser compression)
        setUploadProgress(prev => {
          const newProg = [...prev]
          newProg[currentCount + i] = 100
          return newProg
        })
      } catch (err) {
        console.error('Compression failed:', err)
        toast.error(`Failed to compress ${validFiles[i].name}`)
      }
    }

    setCompressedPhotos(prev => [...prev, ...compressed])
    setUploading(false)
  }

  // ────────────────────────────────────────────────
  //  Drag & Drop Handlers
  // ────────────────────────────────────────────────
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }

  // Click to select
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files)
    }
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
    setCompressedPhotos(prev => prev.filter((_, i) => i !== index))
    setPreviewUrls(prev => {
      const url = prev[index]
      URL.revokeObjectURL(url)
      return prev.filter((_, i) => i !== index)
    })
    setUploadProgress(prev => prev.filter((_, i) => i !== index))
  }

  // ────────────────────────────────────────────────
  //  Submit → upload compressed files
  // ────────────────────────────────────────────────
  const handleMarkCompleted = async () => {
    if (compressedPhotos.length === 0 && photos.length > 0) {
      toast.error('Compression still in progress or failed')
      return
    }

    if (compressedPhotos.length === 0 && !confirm('No photos. Continue anyway?')) {
      return
    }

    setSubmitting(true)

    try {
      const photoUrls: string[] = []

      if (compressedPhotos.length > 0) {
        setUploading(true)

        for (let i = 0; i < compressedPhotos.length; i++) {
          const file = compressedPhotos[i]
          const fileExt = file.name.split('.').pop() || 'jpg'
          const path = `${jobId}/${Date.now()}_${i}.${fileExt}`

          const { error } = await supabase.storage
            .from('job-completion-photos')
            .upload(path, file)

          if (error) throw error

          const { data } = supabase.storage
            .from('job-completion-photos')
            .getPublicUrl(path)

          photoUrls.push(data.publicUrl)
        }

        setUploading(false)
      }

      const { error } = await supabase
        .from('job_requests')
        .update({
          status: 'completed_pending_review',
          completion_photo_urls: photoUrls,
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId)

      if (error) throw error

      toast.success('Job submitted for review!')
      fetchJob()
      // Clean up
      previewUrls.forEach(url => URL.revokeObjectURL(url))
      setPhotos([])
      setCompressedPhotos([])
      setPreviewUrls([])
      setUploadProgress([])
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit job')
      console.error(err)
    } finally {
      setSubmitting(false)
      setUploading(false)
    }
  }

  // ────────────────────────────────────────────────
  //  Render
  // ────────────────────────────────────────────────
  if (loading) {
    return (
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
    )
  }

  if (!job) return null

  const canComplete = job.status === 'in_progress'

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[var(--blue)]/60 to-[var(--blue)] text-white p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-[var(--blue)]/20 rounded-full">
              <FaArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{job.title}</h1>
              <p className="mt-1 opacity-90">
                Customer: {job.customer?.first_name} {job.customer?.last_name}
              </p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="p-6 border-b">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--blue)]/10 text-[var(--blue)]/80 text-sm font-medium">
            <FaSpinner className="animate-spin" />
            In Progress
          </div>
        </div>

        {/* Completion Form */}
        {canComplete && (
          <div className="p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">
              Mark Job as Completed
            </h2>
            <p className="text-[var(--blue)] mb-6">
              Upload up to {MAX_PHOTOS} photos (max {MAX_FILE_SIZE_MB} MB each)
            </p>

            {/* Upload area – drag & drop */}
            <div
  className={`
    border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all duration-200
    ${isDragActive 
      ? 'border-orange-500 bg-orange-50 scale-[1.02] shadow-lg' 
      : uploadError 
        ? 'border-red-500 bg-red-50' 
        : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50'
    }
  `}
  onDragEnter={handleDrag}
  onDragOver={handleDrag}
  onDragLeave={handleDrag}
  onDrop={handleDrop}
>
  <input
    ref={fileInputRef}
    type="file"
    accept={ALLOWED_TYPES.join(',')}
    multiple
    onChange={handleFileInput}          
    className="hidden"
    id="photo-upload"
    disabled={uploading || submitting || photos.length >= MAX_PHOTOS}
  />

  <label htmlFor="photo-upload" className="cursor-pointer block">
    <FaUpload className="mx-auto text-5xl sm:text-6xl text-[var(--blue)] mb-6" />
    <p className="text-lg sm:text-xl font-medium mb-2">
      {isDragActive ? 'Drop files here' : 'Click or drag & drop photos'}
    </p>
    <p className="text-sm text-[var(--blue)]">
      {ALLOWED_TYPES.map(t => t.split('/')[1].toUpperCase()).join(', ')} • max {MAX_FILE_SIZE_MB} MB
    </p>
    {photos.length > 0 && (
      <p className="mt-3 text-[var(--orange)] font-medium">
        {photos.length} / {MAX_PHOTOS} photos selected
      </p>
    )}
  </label>
</div>

            {uploadError && (
              <p className="mt-4 text-red-600 text-center text-sm font-medium">{uploadError}</p>
            )}

            {/* Progress bars (only while uploading) */}
            {uploading && uploadProgress.length > 0 && (
              <div className="mt-6 space-y-3">
                <p className="text-sm font-medium text-[var(--blue)]">Uploading...</p>
                {uploadProgress.map((prog, i) => (
                  <div key={i} className="w-full bg-[var(--blue)]/20 rounded-full h-2.5">
                    <div 
                      className="bg-[var(--orange)] h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${prog}%` }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Photo previews + remove */}
            {previewUrls.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Selected Photos</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {previewUrls.map((url, idx) => (
                    <div 
                      key={idx}
                      className="relative group rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <Image
                        src={url}
                        alt={`preview-${idx}`}
                        width={300}
                        height={300}
                        className="w-full aspect-square object-cover"
                      />
                      <button
                        onClick={() => removePhoto(idx)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-md hover:bg-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={handleMarkCompleted}
              disabled={submitting || uploading || photos.length === 0}
              className={`
                mt-8 w-full py-4 px-6 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition
                ${submitting || uploading || photos.length === 0
                  ? 'bg-[var(--blue)] cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
                }
              `}
            >
              {submitting || uploading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  {uploading ? 'Compressing & Uploading...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <FaCheckCircle />
                  Mark Job as Completed
                </>
              )}
            </button>
          </div>
        )}

        {/* Completion info (after submitted) */}
        {job?.status === 'completed_pending_review' && (
          <div className="p-6 bg-green-50 border-t">
            <div className="flex items-center gap-3 text-green-800">
              <FaCheckCircle size={28} />
              <div>
                <h3 className="font-semibold">Job submitted for review</h3>
                <p className="text-sm">Waiting for customer confirmation</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}