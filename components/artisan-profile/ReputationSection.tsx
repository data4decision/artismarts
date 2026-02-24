
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { FaStar } from 'react-icons/fa'

interface Props {
  artisanId: string
}

export default function ReputationSection({ artisanId }: Props) {
  const [averageRating, setAverageRating] = useState<number>(0)
  const [reviewCount, setReviewCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  const calculateStats = (reviews: { rating: number }[]) => {
    if (reviews.length === 0) {
      setAverageRating(0)
      setReviewCount(0)
      return
    }
    const total = reviews.reduce((sum, r) => sum + r.rating, 0)
    setAverageRating(total / reviews.length)
    setReviewCount(reviews.length)
  }

  const fetchInitialStats = async () => {
    try {
      setLoading(true)
      const { data, error, count } = await supabase
        .from('reviews')
        .select('rating', { count: 'exact' })
        .eq('artisan_id', artisanId)

      if (error) throw error

      calculateStats(data || [])
      // We could also store count from the query if we want to avoid recalculating
      // but recalculating from data is safer with realtime
    } catch (err: unknown) {
      console.error('Failed to load reputation stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInitialStats()

    const channel = supabase
      .channel(`reputation:reviews_${artisanId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews',
          filter: `artisan_id=eq.${artisanId}`
        },
        (payload: unknown) => {
          // For simplicity we refetch full stats on any change
          // (more efficient ways exist but this is reliable and simple)
          fetchInitialStats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [artisanId])

  if (loading) {
    return <div className="text-gray-500">Loading reputation...</div>
  }

  return (
    <div className="flex flex-col items-center sm:items-start gap-2">
      <div className="flex items-center gap-3">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <FaStar
              key={i}
              className={`text-2xl ${
                i < Math.round(averageRating) ? 'text-amber-500' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-2xl font-bold text-gray-800">
          {averageRating.toFixed(1)}
        </span>
      </div>
      <p className="text-sm text-gray-600">
        {reviewCount === 0
          ? 'No reviews yet'
          : `Based on ${reviewCount} review${reviewCount === 1 ? '' : 's'}`}
      </p>
    </div>
  )
}