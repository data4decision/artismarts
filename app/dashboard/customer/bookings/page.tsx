

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
  // const [budgetMin, setBudgetMin] = useState('')
  // const [budgetMax, setBudgetMax] = useState('')
  const [preferredDate, setPreferredDate] = useState('')
  const [time, setTime] = useState('')
  
  const [attachment, setAttachment] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loadingArtisans, setLoadingArtisans] = useState(true)
  const [selectedLGA, setSelectedLGA] = useState('')
const [selectedArea, setSelectedArea] = useState('')

const handleLocationChange = (value: string) => {
  setSelectedLGA(value)
  setSelectedArea('') // reset area when LGA changes
}
  

  const KWARA_LGA_AREAS: Record<string, string[]> = {
  "Ilorin South": [
    "Offa Garage",
    "Fufu",
    "Tanke",
    "Pipeline",
    "Adewole",
    "Ganmo",
    "Fate Road",
    "Sango"
  ],
  "Ilorin West": [
    "GRA",
    "Tanke",
    "Oko-Olowo",
    "Asa Dam",
    "Post Office",
    "Taiwo Road"
  ],
  "Ilorin East": [
    "Oja-Oba",
    "Gambari",
    "Sawmill",
    "Okelele",
    "Agbo Oba"
  ],
  "Offa": [
    "Owode",
    "Balogun",
    "Shawo",
    "Igosun Road"
  ],
  // 👉 you can continue adding all LGAs gradually
}

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
    toast.error('Title and description are required')
    return
  }

  if (!selectedArtisanId) {
    toast.error('Please select a preferred artisan')
    return
  }

  if (!selectedLGA) {
    toast.error('Please select job location')
    return
  }

  setSubmitting(true)

  try {
    // 1. Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      toast.error('Please sign in to submit a request')
      router.push('/login')
      return
    }

    // 2. Get the user's profile to ensure customer_id exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)        // Important: profiles.id usually matches auth.users.id
      .single()

    if (profileError || !profile) {
      toast.error('Your profile is not complete. Please complete your profile first.')
      router.push('/dashboard/customer/profile')
      return
    }

    let attachmentUrl = null

    // 3. Upload attachment if any
    if (attachment) {
      const fileExt = attachment.name.split('.').pop()
      const fileName = `${Date.now()}-${user.id}.${fileExt}`
      const filePath = `requests/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('requests')
        .upload(filePath, attachment, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('requests')
        .getPublicUrl(filePath)

      attachmentUrl = urlData.publicUrl
    }

    // 4. Insert the job request - FIXED
    const { error: insertError } = await supabase
      .from('job_requests')
      .insert({
        customer_id: user.id,                    // This should match profiles.id
        preferred_artisan_id: selectedArtisanId,
        title: title.trim(),
        description: description.trim(),
        job_type: 'quote',
        status: 'pending',
        location: selectedLGA,
        area: selectedArea || null,
        skills: [],
        attachment_url: attachmentUrl,
        preferred_date: preferredDate || null,
        preferred_time: time || null,
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      throw insertError
    }

    toast.success('Job request sent successfully! Admin will review and assign an artisan.')
    router.push('/dashboard/customer/requests')

  } catch (err: any) {
    console.error('Submit error:', err)
    toast.error(err.message || 'Failed to submit job request. Please try again.')
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
            {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div> */}

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--blue)] mb-2">
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={preferredDate}
                  required
                  onChange={e => setPreferredDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--orange)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--blue)] mb-2">
                  Preferred Time Slot
                </label>
                <input type="time"
                value={time}
                required
                onChange={e => setTime(e.target.value) } 
                 className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--orange)]"
                 />
              </div>
            </div>

            {/* Location & Area*/}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-[var(--blue)] mb-2">
                Job Location / Address *
              </label>
              <select
                value={selectedLGA}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--orange)]"
                required
              >
                <option value="">Select LGA</option>
                {Object.keys(KWARA_LGA_AREAS).map((lga) => (
                  <option key={lga} value={lga}>
                    {lga}
                  </option>
                ))}
              </select>
            </div>

            {/* AREAS */}
             <div>
              <label className="block text-sm font-medium text-[var(--blue)] mb-2">
                Your Area (for better matching)
              </label>
              <select 
              value={selectedArea}
              disabled={!selectedLGA}
              onChange={(e)=> setSelectedArea( e.target.value)}
              className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-white text-[var(--blue)] px-3 py-2">
                <option value=''>{selectedArea ? 'Select Area/Bus Stop' : 'Please Select LGA First'}</option>
                {selectedLGA && KWARA_LGA_AREAS[selectedLGA]?.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
                </select>
            </div>
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
              {submitting && 
                          <FaSpinner className='animate-spin'/>}
              {submitting ? 'Sending...' : 'Send Request to Admin'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}