// app/dashboard/admin/jobs/[jobId]/complete/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { FaSpinner, FaCheckCircle, FaTimesCircle, FaArrowLeft, FaImage } from 'react-icons/fa'
import Image from 'next/image'

export default function AdminJobCompletion() {
  const { jobId } = useParams<{ jobId: string }>()
  const router = useRouter()

  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchJob()
  }, [jobId])

  const fetchJob = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('job_requests')
        .select(`
          id,
          title,
          description,
          status,
          completion_photo_urls,
          assigned_artisan_id,
          artisan:assigned_artisan_id (first_name, last_name),
          customer:customer_id (first_name, last_name)
        `)
        .eq('id', jobId)
        .single()

      if (error || !data) {
        toast.error('Job not found')
        router.back()
        return
      }

      if (data.status !== 'completed_pending_review') {
        toast.error('Job not ready for final completion')
        router.back()
        return
      }

      setJob(data)
    } catch (err) {
      toast.error('Failed to load job')
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const handleFinalComplete = async () => {
    if (!confirm('Confirm final completion? This will close the job permanently.')) return

    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('job_requests')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)

      if (error) throw error

      toast.success('Job fully completed and closed.')
      router.push('/dashboard/admin/assigned-jobs')
    } catch (err: any) {
      toast.error('Failed to complete job')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <FaSpinner className="animate-spin text-6xl text-[var(--orange)]" />
    </div>
  )

  if (!job) return null

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[var(--blue)] to-blue-800 text-white p-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-3 bg-white/20 rounded-full hover:bg-white/30">
              <FaArrowLeft />
            </button>
            <div>
              <h1 className="text-3xl font-bold">{job.title}</h1>
              <p className="mt-2 opacity-90">
                Final Completion – Artisan: {job.artisan?.first_name} {job.artisan?.last_name}
              </p>
            </div>
          </div>
        </div>

        {/* Photos */}
        {job.completion_photo_urls?.length > 0 ? (
          <div className="p-8">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <FaImage className="text-[var(--orange)]" />
              Artisan Uploaded Photos
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {job.completion_photo_urls.map((url: string, i: number) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden shadow-md">
                  <Image src={url} alt={`Photo ${i+1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500 border-t">
            Artisan did not upload any completion photos.
          </div>
        )}

        {/* Actions */}
        <div className="p-8 border-t bg-gray-50 flex gap-4">
          <button
            onClick={handleFinalComplete}
            disabled={submitting}
            className={`flex-1 py-4 rounded-xl font-bold text-white transition ${
              submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {submitting ? <FaSpinner className="animate-spin inline mr-2" /> : <FaCheckCircle className="inline mr-2" />}
            Final Completion – Close Job
          </button>

          <button
            onClick={() => router.back()}
            className="flex-1 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}