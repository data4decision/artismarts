

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

import { FaSpinner, FaCalendar, FaClock, FaMapMarkerAlt, FaDollarSign, FaFileUpload } from 'react-icons/fa'
import Image from 'next/image'
import Link from 'next/link'

export default function CustomerJobRequestPage() {
  const router = useRouter()

  const [artisans, setArtisans] = useState<any[]>([])
  const [selectedArtisanId, setSelectedArtisanId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [budgetMin, setBudgetMin] = useState('')
  const [budgetMax, setBudgetMax] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [preferredTime, setPreferredTime] = useState('')
  const [location, setLocation] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loadingArtisans, setLoadingArtisans] = useState(true)

  useEffect(() => {
    fetchVerifiedArtisans()
  }, [])

  const fetchVerifiedArtisans = async () => {
    setLoadingArtisans(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, primary_skill, work_location')
        .eq('role', 'artisan')
        .eq('verification_status', 'approved')
        .order('first_name')

      if (error) throw error
      setArtisans(data || [])
    } catch (err: any) {
      toast.error('Failed to load artisans')
    } finally {
      setLoadingArtisans(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !description.trim()) {
      toast.error('Title and description required')
      return
    }

    if (!selectedArtisanId) {
      toast.error('Please select a preferred artisan')
      return
    }

    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please sign in')

      let attachmentUrl = null

      if (attachment) {
        const ext = attachment.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${ext}`
        const path = `requests/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('requests') // create public bucket
          .upload(path, attachment)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from('requests').getPublicUrl(path)
        attachmentUrl = urlData.publicUrl
      }

      const { error } = await supabase
        .from('job_requests')
        .insert({
          customer_id: user.id,
          preferred_artisan_id: selectedArtisanId,
          title,
          description,
          budget_min: budgetMin ? Number(budgetMin) : null,
          budget_max: budgetMax ? Number(budgetMax) : null,
          job_type: 'quote', // or let customer choose
          duration: null,
          location,
          skills: [], // can auto-detect from title/description later
          status: 'pending',
          attachment_url: attachmentUrl,
        })

      if (error) throw error

      toast.success('Job request sent! Admin will review and assign an artisan.')
      router.push('/dashboard/customer/my-requests')
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard/customer/artisans" className="text-[var(--orange)] hover:underline flex items-center gap-2 mb-6">
          ← Back to Artisans
        </Link>

        <div className="bg-white rounded-2xl shadow-md border p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--blue)] mb-6">
            Send Job Request
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Fix leaking kitchen sink"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--orange)]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe what you need *
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={5}
                placeholder="Details: problem, urgency, materials, etc."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--orange)]"
                required
              />
            </div>

            {/* Preferred Artisan */}
            <div>
              <label className="block text-sm font-medium text-[var(--blue)] mb-2">
                Preferred Artisan *
              </label>
              {loadingArtisans ? (
               <div className="min-h-screen flex items-center justify-center bg-[var(--white)]">
                            <div className="relative flex items-center justify-center">
                              {/* Outer spinning ring */}
                              <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-[var(--orange)] border-opacity-70 shadow-md"></div>
                          
                              {/* Inner static logo with subtle pulse */}
                              <div className="absolute inset-0 flex items-center justify-center animate-pulse-slow">
                                <div className="bg-[var(--white)] rounded-full p-2 shadow-sm">
                                  <Image src="/log.png" width={48} height={48} priority alt="Loading..." className="object-contain"/>
                                </div>
                              </div>
                            </div>
                          </div>
              ) : (
                <select
                  value={selectedArtisanId}
                  onChange={e => setSelectedArtisanId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--orange)]"
                  required
                >
                  <option value="">Select preferred artisan</option>
                  {artisans.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.first_name} {a.last_name} 
                      {a.primary_skill ? ` (${a.primary_skill})` : ''}
                      {a.work_location ? ` - ${a.work_location}` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--blue)] mb-2">
                  Budget Min (₦)
                </label>
                <input
                  type="number"
                  value={budgetMin}
                  onChange={e => setBudgetMin(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--orange)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--blue)] mb-2">
                  Budget Max (₦)
                </label>
                <input
                  type="number"
                  value={budgetMax}
                  onChange={e => setBudgetMax(e.target.value)}
                  placeholder="e.g. 30000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--orange)]"
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--blue)] mb-2">
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={e => setPreferredDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--orange)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--blue)] mb-2">
                  Preferred Time Slot
                </label>
                <select
                  value={preferredTime}
                  onChange={e => setPreferredTime(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--orange)]"
                >
                  <option value="">Anytime</option>
                  <option value="morning">Morning (8AM–12PM)</option>
                  <option value="afternoon">Afternoon (12PM–5PM)</option>
                  <option value="evening">Evening (5PM–9PM)</option>
                </select>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-[var(--blue)] mb-2">
                Job Location / Address *
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. 123 Main St, Ilorin, Kwara"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--orange)]"
                required
              />
            </div>

            {/* Attachment */}
            <div>
              <label className="block text-sm font-medium text-[var(--blue)] mb-2">
                Attachment (photos, plans – optional)
              </label>
              <label className="cursor-pointer flex items-center gap-3 px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl hover:bg-gray-200 transition">
                <FaFileUpload className="text-[var(--orange)]" />
                <span>Choose File</span>
                <input
                  type="file"
                  onChange={e => setAttachment(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              {attachment && <p className="mt-2 text-sm text-[var(--blue)]">Selected: {attachment.name}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-[var(--orange)] hover:bg-orange-600 text-white font-medium rounded-xl transition disabled:opacity-50 mt-6 flex items-center justify-center gap-2"
            >
              {submitting && <div className="min-h-screen flex items-center justify-center bg-[var(--white)]">
                            <div className="relative flex items-center justify-center">
                              {/* Outer spinning ring */}
                              <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-[var(--orange)] border-opacity-70 shadow-md"></div>
                          
                              {/* Inner static logo with subtle pulse */}
                              <div className="absolute inset-0 flex items-center justify-center animate-pulse-slow">
                                <div className="bg-[var(--white)] rounded-full p-2 shadow-sm">
                                  <Image src="/log.png" width={48} height={48} priority alt="Loading..." className="object-contain"/>
                                </div>
                              </div>
                            </div>
                          </div>}
              {submitting ? 'Sending...' : 'Send Request to Admin'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}