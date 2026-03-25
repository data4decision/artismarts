'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  FaStar, FaSpinner, FaCheckCircle, FaTimesCircle, FaArrowLeft, 
  FaExpand, FaChevronLeft, FaChevronRight, FaImage, FaUserTie,
  FaThumbsUp, FaThumbsDown, FaStickyNote, FaBell
} from 'react-icons/fa'
import Image from 'next/image'

export default function CustomerJobReviewPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const router = useRouter()

  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [notifyingArtisan, setNotifyingArtisan] = useState(false)

  // Form states
  const [overallRating, setOverallRating] = useState<number>(0)
  const [hoverOverall, setHoverOverall] = useState<number>(0)
  const [qualityRating, setQualityRating] = useState<number>(0)
  const [punctualityRating, setPunctualityRating] = useState<number>(0)
  const [communicationRating, setCommunicationRating] = useState<number>(0)
  const [cleanlinessRating, setCleanlinessRating] = useState<number>(0)
  const [wouldHireAgain, setWouldHireAgain] = useState<boolean | null>(null)
  const [comment, setComment] = useState('')

  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)

  const [allPhotos, setAllPhotos] = useState<{ url: string; type: 'progress' | 'completion' }[]>([])

  useEffect(() => {
    if (!jobId) {
      setErrorMessage('Invalid job ID in URL')
      setLoading(false)
      return
    }
    fetchJobAndReview()
  }, [jobId])

  const fetchJobAndReview = async () => {
    setLoading(true)
    setErrorMessage(null)

    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser()
      if (authErr || !user) {
        toast.error('Please sign in to continue')
        router.replace('/login')
        return
      }

      const { data: jobData, error: jobErr } = await supabase
        .from('job_requests')
        .select(`
          id, title, description, status,
          progress_photo_urls, completion_photo_urls, final_note, completed_at,
          assigned_artisan_id,
          artisan:assigned_artisan_id (first_name, last_name, profile_image),
          customer_confirmed_at, customer_review_rating, customer_review_comment,
          customer_quality_rating, customer_punctuality_rating,
          customer_communication_rating, customer_cleanliness_rating,
          customer_would_hire_again,
          artisan_notified_of_review
        `)
        .eq('id', jobId)
        .eq('customer_id', user.id)
        .single()

      if (jobErr) throw jobErr
      if (!jobData) throw new Error('Job not found or you do not have access')

      setJob(jobData)

      const progress = (jobData.progress_photo_urls || []).map((url: string) => ({ url, type: 'progress' as const }))
      const completion = (jobData.completion_photo_urls || []).map((url: string) => ({ url, type: 'completion' as const }))
      setAllPhotos([...progress, ...completion])

      if (jobData.customer_review_rating !== null) {
        setAlreadyReviewed(true)
        setOverallRating(jobData.customer_review_rating || 0)
        setQualityRating(jobData.customer_quality_rating || 0)
        setPunctualityRating(jobData.customer_punctuality_rating || 0)
        setCommunicationRating(jobData.customer_communication_rating || 0)
        setCleanlinessRating(jobData.customer_cleanliness_rating || 0)
        setWouldHireAgain(jobData.customer_would_hire_again ?? null)
        setComment(jobData.customer_review_comment || '')
        return
      }

      const { data: draftRow } = await supabase
        .from('job_reviews')
        .select('rating, review_text, quality_rating, punctuality_rating, communication_rating, cleanliness_rating, would_hire_again, is_draft')
        .eq('job_id', jobId)
        .eq('reviewer_id', user.id)
        .eq('is_draft', true)
        .maybeSingle()

      if (draftRow) {
        setOverallRating(draftRow.rating ?? 0)
        setQualityRating(draftRow.quality_rating ?? 0)
        setPunctualityRating(draftRow.punctuality_rating ?? 0)
        setCommunicationRating(draftRow.communication_rating ?? 0)
        setCleanlinessRating(draftRow.cleanliness_rating ?? 0)
        setWouldHireAgain(draftRow.would_hire_again ?? null)
        setComment(draftRow.review_text ?? '')
      }

      if (jobData.status !== 'completed_pending_review' && !alreadyReviewed) {
        toast.error('This job is not ready for review')
        router.push('/dashboard/customer/jobs')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load job information')
      toast.error(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // Auto-save draft (includes all ratings)
  // Auto-save draft
useEffect(() => {
  if (alreadyReviewed || submitting || overallRating === 0) return

  const timer = setTimeout(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('job_reviews')
        .upsert({
          job_id: jobId,
          reviewer_id: user.id,
          rating: overallRating,
          quality_rating: qualityRating,
          punctuality_rating: punctualityRating,
          communication_rating: communicationRating,
          cleanliness_rating: cleanlinessRating,
          would_hire_again: wouldHireAgain,
          review_text: comment.trim() || null,
          is_draft: true
        }, {
          onConflict: 'job_id,reviewer_id,is_draft'   // make sure this matches your constraint name
        })
    } catch (e) {
      // Silent fail for drafts - don't annoy user
      console.log('Draft save skipped')
    }
  }, 1200)

  return () => clearTimeout(timer)
}, [
  overallRating, qualityRating, punctualityRating,
  communicationRating, cleanlinessRating, wouldHireAgain,
  comment, alreadyReviewed, submitting, jobId
])
  const handleSubmitReview = async () => {
  if (overallRating === 0) {
    toast.error('Please provide an overall rating (1–5 stars)')
    return
  }

  if (submitting) return
  setSubmitting(true)

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Please sign in again')

    // Step 1: Delete any existing draft for this job + reviewer
    await supabase
      .from('job_reviews')
      .delete()
      .eq('job_id', jobId)
      .eq('reviewer_id', user.id)
      .eq('is_draft', true)

    // Step 2: Insert the final review
    const { error: insertErr } = await supabase
      .from('job_reviews')
      .insert({
        job_id: jobId,
        reviewer_id: user.id,
        rating: overallRating,
        quality_rating: qualityRating,
        punctuality_rating: punctualityRating,
        communication_rating: communicationRating,
        cleanliness_rating: cleanlinessRating,
        would_hire_again: wouldHireAgain,
        review_text: comment.trim() || null,
        is_draft: false
      })

    if (insertErr) throw insertErr

    // Step 3: Update the job_requests table with all ratings
    const { error: jobErr } = await supabase
      .from('job_requests')
      .update({
        status: 'completed',
        customer_confirmed_at: new Date().toISOString(),
        customer_review_rating: overallRating,
        customer_quality_rating: qualityRating,
        customer_punctuality_rating: punctualityRating,
        customer_communication_rating: communicationRating,
        customer_cleanliness_rating: cleanlinessRating,
        customer_would_hire_again: wouldHireAgain,
        customer_review_comment: comment.trim() || null,
        customer_review_created_at: new Date().toISOString(),
        artisan_notified_of_review: false
      })
      .eq('id', jobId)
      .eq('customer_id', user.id)

    if (jobErr) throw jobErr

    setSubmitSuccess(true)
    toast.success('Review submitted successfully! 🎉')
    await fetchJobAndReview()   // refresh the page state

  } catch (err: any) {
    console.error('Submit error:', err)
    toast.error(err.message || 'Failed to submit review. Please try again.')
  } finally {
    setSubmitting(false)
  }
}

  const handleNotifyArtisan = async () => {
    if (notifyingArtisan) return
    setNotifyingArtisan(true)

    try {
      const { error } = await supabase
        .from('job_requests')
        .update({
          artisan_notified_of_review: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)

      if (error) throw error

      toast.success('Artisan has been notified!', { duration: 5000 })
      await fetchJobAndReview()
    } catch (err: any) {
      toast.error('Failed to notify artisan')
    } finally {
      setNotifyingArtisan(false)
    }
  }

  const handleAppRating = async (rating: number) => {
    // ... your existing app rating logic ...
  }

  const handleRequestChanges = async () => {
    if (!confirm('Request changes? The artisan will be notified.')) return

    try {
      await supabase
        .from('job_requests')
        .update({
          status: 'changes_requested',
          changes_requested_at: new Date().toISOString()
        })
        .eq('id', jobId)

      toast.success('Changes requested. Artisan notified.')
      router.push('/dashboard/customer/requests')
    } catch (err: any) {
      toast.error('Failed to request changes')
    }
  }

  // Fullscreen functions - fixed naming
  const openFullscreen = (index: number) => {
    setFullscreenIndex(index)
  }

  const closeFullscreen = () => {
    setFullscreenIndex(null)
  }

  const nextPhoto = () => {
    if (fullscreenIndex === null || allPhotos.length === 0) return
    setFullscreenIndex((prev) => (prev! + 1) % allPhotos.length)
  }

  const prevPhoto = () => {
    if (fullscreenIndex === null || allPhotos.length === 0) return
    setFullscreenIndex((prev) => prev! === 0 ? allPhotos.length - 1 : prev! - 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/70 flex items-center justify-center">
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

  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-md">
          <FaTimesCircle className="text-red-500 text-7xl mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
          <p className="text-gray-600 mb-8">{errorMessage}</p>
          <button 
            onClick={() => {
              setErrorMessage(null)
              fetchJobAndReview()
            }}
            className="px-8 py-4 bg-[var(--blue)] text-white rounded-xl hover:bg-blue-700 transition shadow-md"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-md">
          <FaTimesCircle className="text-red-500 text-7xl mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Job not found</h2>
          <p className="text-gray-600 mb-8">
            This job may not exist, has already been reviewed, or does not belong to you.
          </p>
          <button onClick={() => router.back()} className="px-8 py-4 bg-[var(--blue)] text-white rounded-xl hover:bg-blue-700">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const artisanName = `${job.artisan?.first_name ?? ''} ${job.artisan?.last_name ?? ''}`.trim() || 'Artisan'
  const isReviewedAndNotNotified = alreadyReviewed && !job.artisan_notified_of_review

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-[var(--orange)] transition font-medium"
          >
            <FaArrowLeft /> Back to Jobs
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--blue)]">
            Review: {job?.title ?? 'Job'}
          </h1>
        </div>

        {/* Artisan Info */}
        <div className="bg-white rounded-2xl shadow p-6 flex flex-col sm:flex-row items-center gap-6">
          {job?.artisan?.profile_image ? (
            <Image
              src={job.artisan.profile_image}
              alt={artisanName}
              width={80}
              height={80}
              className="rounded-full object-cover border-4 border-gray-100 shadow-sm"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
              <FaUserTie size={36} />
            </div>
          )}
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-semibold text-[var(--blue)]">
              {artisanName}
            </h2>
            <p className="text-gray-600">
              Completed on {job?.completed_at ? new Date(job.completed_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        {/* Final Note */}
        {job?.final_note && (
          <div className="bg-white rounded-2xl shadow p-6 border border-[var(--blue)]/10">
            <h3 className="text-lg font-semibold text-[var(--blue)] mb-3 flex items-center gap-2">
              <FaStickyNote className="text-[var(--orange)]" />
              Artisan's Final Note
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {job.final_note}
            </p>
          </div>
        )}

        {/* Photos */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold text-[var(--blue)] mb-5 flex items-center gap-3">
            <FaImage className="text-[var(--orange)]" />
            Work Photos ({allPhotos.length})
          </h2>

          {allPhotos.length === 0 ? (
            <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded-xl">
              No photos uploaded by the artisan yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {allPhotos.map(({ url, type }, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden shadow cursor-zoom-in group hover:shadow-2xl transition-all duration-300"
                  onClick={() => openFullscreen(idx)}   // ← Fixed: using openFullscreen
                >
                  <Image
                    src={url}
                    alt={`${type} photo ${idx + 1}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <FaExpand className="text-white text-3xl drop-shadow-lg" />
                  </div>
                  <span className={`absolute top-2 left-2 px-2 py-1 text-xs font-medium rounded-full shadow-sm ${
                    type === 'progress' ? 'bg-[var(--orange)] text-white' : 'bg-green-600 text-white'
                  }`}>
                    {type === 'progress' ? 'In Progress' : 'Completion'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review Form */}
        {!alreadyReviewed && (
          <div className="bg-white rounded-2xl shadow p-6 lg:p-8 border border-gray-200">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--blue)] mb-8 text-center sm:text-left">
              How was the artisan's work?
            </h2>

            {/* Overall Rating */}
            <div className="mb-12">
              <label className="block text-xl sm:text-2xl font-semibold text-[var(--blue)] mb-5 text-center sm:text-left">
                Overall Rating
              </label>
              <div className="flex justify-center sm:justify-start gap-3 sm:gap-4">
                {[1,2,3,4,5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setOverallRating(star)}
                    onMouseEnter={() => setHoverOverall(star)}
                    onMouseLeave={() => setHoverOverall(0)}
                    className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                  >
                    <FaStar
                      size={64}
                      className={
                        (hoverOverall >= star || overallRating >= star)
                          ? 'text-[var(--orange)] drop-shadow-md'
                          : 'text-gray-200'
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Category Ratings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              {[
                { label: "Quality of Work", val: qualityRating, set: setQualityRating },
                { label: "Punctuality / Arrival", val: punctualityRating, set: setPunctualityRating },
                { label: "Communication", val: communicationRating, set: setCommunicationRating },
                { label: "Cleanliness / Professionalism", val: cleanlinessRating, set: setCleanlinessRating },
              ].map(({ label, val, set }) => (
                <div key={label} className="text-center">
                  <label className="block text-base sm:text-lg font-medium text-[var(--blue)] mb-3">
                    {label}
                  </label>
                  <div className="flex justify-center gap-1.5">
                    {[1,2,3,4,5].map(s => (
                      <button
                        key={s}
                        onClick={() => set(s)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <FaStar
                          size={40}
                          className={s <= val ? "text-[var(--orange)]" : "text-gray-200"}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Would hire again */}
            <div className="mb-12 pb-8 border-b border-gray-200">
              <label className="block text-xl sm:text-2xl font-semibold text-[var(--blue)] mb-5 text-center sm:text-left">
                Would you hire this artisan again?
              </label>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button
                  onClick={() => setWouldHireAgain(true)}
                  className={`flex-1 max-w-xs flex items-center justify-center gap-4 px-8 py-5 rounded-xl border-2 text-lg font-medium transition-all ${
                    wouldHireAgain === true
                      ? 'border-[var(--blue)] bg-blue-50 text-[var(--blue)] shadow-md'
                      : 'border-gray-300 hover:border-[var(--blue)] hover:bg-blue-50'
                  }`}
                >
                  <FaThumbsUp size={32} />
                  Yes, definitely
                </button>
                <button
                  onClick={() => setWouldHireAgain(false)}
                  className={`flex-1 max-w-xs flex items-center justify-center gap-4 px-8 py-5 rounded-xl border-2 text-lg font-medium transition-all ${
                    wouldHireAgain === false
                      ? 'border-red-500 bg-red-50 text-red-800 shadow-md'
                      : 'border-gray-300 hover:border-red-400 hover:bg-red-50'
                  }`}
                >
                  <FaThumbsDown size={32} />
                  No, probably not
                </button>
              </div>
            </div>

            {/* Comment */}
            <div className="mb-12">
              <label className="block text-xl sm:text-2xl font-semibold text-[var(--blue)] mb-5">
                Additional comments (optional)
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Tell us about your experience, what went well, what could be improved..."
                className="w-full p-5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] min-h-[180px] resize-none text-base text-gray-800 shadow-sm"
                maxLength={1000}
              />
              <p className="text-right text-sm text-gray-500 mt-2">
                {comment.length} / 1000 characters
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-5 pt-4">
              <button
                onClick={handleSubmitReview}
                disabled={submitting || overallRating === 0}
                className={`flex-1 py-5 px-8 rounded-xl font-bold text-[var(--white)] text-lg flex items-center justify-center gap-3 transition-all shadow-lg ${
                  submitting || overallRating === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[var(--orange)] hover:bg-orange-600'
                }`}
              >
                {submitting ? <FaSpinner className="animate-spin" /> : <FaCheckCircle size={26} />}
                {submitting ? 'Submitting...' : 'Confirm & Submit Review'}
              </button>

              <button
                onClick={handleRequestChanges}
                disabled={submitting}
                className="flex-1 py-5 px-8 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-[var(--white)] text-lg transition shadow-lg flex items-center justify-center gap-3"
              >
                <FaTimesCircle size={26} />
                Request Changes
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {fullscreenIndex !== null && allPhotos.length > 0 && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={closeFullscreen}
        >
          <button
            className="absolute top-6 right-6 text-white text-6xl hover:text-gray-300 transition p-4"
            onClick={closeFullscreen}
          >
            ×
          </button>

          <div className="relative max-w-[95vw] max-h-[95vh] w-full">
            <Image
              src={allPhotos[fullscreenIndex].url}
              alt={`Photo ${fullscreenIndex + 1} - ${allPhotos[fullscreenIndex].type}`}
              fill
              className="object-contain"
              priority
            />

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/70 text-white px-6 py-3 rounded-full text-lg font-medium">
              {fullscreenIndex + 1} / {allPhotos.length} • {allPhotos[fullscreenIndex].type === 'progress' ? 'In Progress' : 'Completion'}
            </div>

            {allPhotos.length > 1 && (
              <>
                <button
                  className="absolute left-4 sm:left-10 top-1/2 -translate-y-1/2 text-white text-6xl sm:text-7xl hover:text-gray-300 p-6 transition"
                  onClick={e => { e.stopPropagation(); prevPhoto() }}
                >
                  <FaChevronLeft />
                </button>
                <button
                  className="absolute right-4 sm:right-10 top-1/2 -translate-y-1/2 text-white text-6xl sm:text-7xl hover:text-gray-300 p-6 transition"
                  onClick={e => { e.stopPropagation(); nextPhoto() }}
                >
                  <FaChevronRight />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Success Popup */}
      {submitSuccess && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md md:max-w-lg w-full p-8 md:p-10 text-center relative overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setSubmitSuccess(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-4xl transition"
            >
              ×
            </button>

            <div className="mb-8">
              <FaCheckCircle className="text-green-500 text-8xl mx-auto mb-6 animate-bounce-once" />
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--blue)] mb-4">
                Successful!
              </h2>
              <p className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed">
                Thank you for your review!<br />
                Your feedback helps artisans improve.
              </p>
            </div>

            <button
              onClick={() => setSubmitSuccess(false)}
              className="px-10 py-4 bg-[var(--blue)] text-white rounded-xl hover:bg-blue-700 transition font-medium text-lg shadow-md w-full md:w-auto"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}