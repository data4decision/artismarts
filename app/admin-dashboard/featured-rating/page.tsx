'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { FaStar, FaSpinner, FaCheckCircle } from 'react-icons/fa'

export default function FeaturedRatingPage() {
  const [ratings, setRatings] = useState<any[]>([])
  const [selectedRating, setSelectedRating] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchRatings()
  }, [])

  const fetchRatings = async () => {
    const { data } = await supabase
      .from('app_ratings')
      .select(`*, user:user_id (first_name, last_name, profile_image)`)
      .order('created_at', { ascending: false })
    setRatings(data || [])
    setLoading(false)
  }

  const featureRating = async () => {
    if (!selectedRating) return

    setSaving(true)
    try {
      // You can store the featured rating in a simple settings table or just use one row
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'featured_app_rating',
          value: {
            id: selectedRating.id,
            rating: selectedRating.rating,
            comment: selectedRating.comment,
            user_name: `${selectedRating.user?.first_name} ${selectedRating.user?.last_name}`.trim(),
            profile_image: selectedRating.user?.profile_image,
            created_at: selectedRating.created_at
          }
        }, { onConflict: 'key' })

      if (error) throw error

      toast.success('Featured rating updated! It will now appear on the landing page.')
    } catch (err) {
      toast.error('Failed to feature rating')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold text-[var(--blue)] mb-8">Feature a Rating on Landing Page</h1>

      {loading ? (
        <FaSpinner className="animate-spin text-5xl text-[var(--orange)] mx-auto" />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {ratings.map((r) => (
            <div
              key={r.id}
              onClick={() => setSelectedRating(r)}
              className={`bg-white p-8 rounded-3xl shadow cursor-pointer transition hover:shadow-2xl border-4 ${
                selectedRating?.id === r.id ? 'border-[var(--orange)]' : 'border-transparent'
              }`}
            >
              <div className="flex gap-4 items-center mb-6">
                {r.user?.profile_image && (
                  <img src={r.user.profile_image} alt="" className="w-16 h-16 rounded-2xl object-cover" />
                )}
                <div>
                  <p className="font-semibold">{r.user?.first_name} {r.user?.last_name}</p>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => <FaStar key={s} className={s <= r.rating ? 'text-[var(--orange)]' : 'text-gray-200'} />)}
                  </div>
                </div>
              </div>
              {r.comment && <p className="italic text-gray-700">“{r.comment}”</p>}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={featureRating}
        disabled={!selectedRating || saving}
        className="mt-12 w-full py-6 bg-[var(--orange)] hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-2xl font-bold text-xl flex items-center justify-center gap-3"
      >
        {saving ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
        {saving ? 'Saving...' : 'Feature This Rating on Landing Page'}
      </button>
    </div>
  )
}