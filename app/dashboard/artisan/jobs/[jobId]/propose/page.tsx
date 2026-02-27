// app/dashboard/artisan/jobs/[jobId]/propose/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { FaSpinner, FaPaperclip, FaDollarSign, FaClock, FaFileUpload, FaExclamationTriangle, FaMapMarkerAlt, FaUserTie } from 'react-icons/fa'

export default function SubmitProposalPage() {
  const { jobId } = useParams()
  const router = useRouter()

  const [job, setJob] = useState<any>(null)
  const [loadingJob, setLoadingJob] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form fields
  const [message, setMessage] = useState('')
  const [proposedPrice, setProposedPrice] = useState('')
  const [timeline, setTimeline] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)

  useEffect(() => {
    if (!jobId) return

    const fetchJob = async () => {
      setLoadingJob(true)
      try {
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
          .eq('id', jobId)
          .single()

        if (error) throw error
        if (!data) throw new Error('Job not found')

        setJob(data)
      } catch (err: any) {
        console.error(err)
        toast.error(err.message || 'Failed to load job details')
      } finally {
        setLoadingJob(false)
      }
    }

    fetchJob()
  }, [jobId])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim()) {
      toast.error('Please write a message to the customer')
      return
    }

    if (!proposedPrice || isNaN(Number(proposedPrice)) || Number(proposedPrice) <= 0) {
      toast.error('Please enter a valid proposed price')
      return
    }

    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let attachmentUrl = null

      // Optional: Upload attachment to Supabase Storage
      if (attachment) {
        const fileExt = attachment.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `proposals/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('proposals') // create this bucket in Supabase if needed
          .upload(filePath, attachment)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('proposals')
          .getPublicUrl(filePath)

        attachmentUrl = urlData.publicUrl
      }

      // Insert proposal into a new table (or update job_requests if you prefer)
      const { error } = await supabase
        .from('proposals') // create this table
        .insert({
          job_id: jobId,
          artisan_id: user.id,
          message,
          proposed_price: Number(proposedPrice),
          proposed_timeline: timeline || null,
          attachment_url: attachmentUrl,
          status: 'pending',
          created_at: new Date().toISOString(),
        })

      if (error) throw error

      toast.success('Proposal submitted successfully!')
      router.push('/dashboard/artisan/jobs') // or to a "My Proposals" page
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to submit proposal')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingJob) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="animate-spin text-[var(--orange)] text-5xl" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow">
          <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Job Not Found</h2>
          <p className="text-gray-600 mb-6">This job request may have been removed or completed.</p>
          <Link href="/dashboard/artisan/find-work" className="text-[var(--orange)] hover:underline">
            ← Back to Find Work
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard/artisan/find-work" className="text-[var(--orange)] hover:underline flex items-center gap-2">
            ← Back to Jobs
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 sm:p-8 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--blue)] mb-4">
            Submit Proposal for: {job.title}
          </h1>

          <div className="space-y-4 text-gray-700 mb-8">
            <p className="line-clamp-4">{job.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {job.budget_min && (
                <div className="flex items-center gap-2">
                  <FaDollarSign className="text-[var(--orange)]" />
                  Budget: ${job.budget_min}{job.budget_max ? ` – $${job.budget_max}` : '+'}
                </div>
              )}
              <div className="flex items-center gap-2">
                <FaClock className="text-[var(--orange)]" />
                Duration: {job.duration || 'Flexible'}
              </div>
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt className="text-[var(--orange)]" />
                Location: {job.location || 'Remote'}
              </div>
              <div className="flex items-center gap-2">
                <FaUserTie className="text-[var(--orange)]" />
                Posted by: {job.customer?.first_name} {job.customer?.last_name ? job.customer.last_name.charAt(0) + '.' : ''}
              </div>
            </div>

            {job.skills?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {job.skills.map((skill: string) => (
                  <span key={skill} className="px-3 py-1 bg-[var(--orange)]/10 text-[var(--orange)] rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Proposal Form */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-[var(--blue)] mb-6">
            Your Proposal
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Message / Cover Letter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message to Customer *
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={6}
                placeholder="Explain why you're the best fit, your approach, relevant experience..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none resize-y"
                required
              />
            </div>

            {/* Proposed Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proposed Price *
                </label>
                <div className="relative">
                  <FaDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={proposedPrice}
                    onChange={e => setProposedPrice(e.target.value)}
                    placeholder="e.g. 25000"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none"
                    required
                    min="1"
                  />
                </div>
              </div>

              {/* Timeline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Timeline
                </label>
                <input
                  type="text"
                  value={timeline}
                  onChange={e => setTimeline(e.target.value)}
                  placeholder="e.g. 2 weeks, 5 days, 1 month"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none"
                />
              </div>
            </div>

            {/* Attachment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachment (optional – quote, portfolio, etc.)
              </label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer flex items-center gap-2 px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl hover:bg-gray-200 transition">
                  <FaFileUpload className="text-[var(--orange)]" />
                  <span>Choose File</span>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.png,.jpeg"
                  />
                </label>
                {attachment && (
                  <span className="text-sm text-gray-600 truncate max-w-[200px]">
                    {attachment.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Max 10MB. PDF, Word, images supported.
              </p>
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-6 bg-[var(--orange)] hover:bg-orange-600 text-white font-medium rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting && <FaSpinner className="animate-spin" />}
                {submitting ? 'Submitting...' : 'Send Proposal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}