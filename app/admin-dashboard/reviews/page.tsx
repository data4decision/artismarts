// 'use client'

// import { useState, useEffect } from 'react'
// import { supabase } from '@/lib/supabase'
// import toast from 'react-hot-toast'
// import { FaStar, FaSpinner, FaTrash, FaCheck } from 'react-icons/fa'
// import Image from 'next/image'

// type AppRating = {
//   id: string
//   rating: number
//   comment: string | null
//   created_at: string
//   profiles: {
//     first_name?: string | null
//     last_name?: string | null
//     profile_image?: string | null
//   } | null
// }

// export default function AdminFeaturedReviewPage() {
//   const [ratings, setRatings] = useState<AppRating[]>([])
//   const [featuredId, setFeaturedId] = useState<string | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [saving, setSaving] = useState(false)

//   useEffect(() => {
//     loadAllData()
//   }, [])

//   // Load both ratings and current featured in one function
//   const loadAllData = async () => {
//     setLoading(true)
//     try {
//       // Fetch all ratings
//       const { data: ratingsData, error: ratingsError } = await supabase
//         .from('app_ratings')
//         .select(`
//           id,
//           rating,
//           comment,
//           created_at,
//           profiles (
//             first_name,
//             last_name,
//             profile_image
//           )
//         `)
//         .order('created_at', { ascending: false })
//         .limit(20)

//       if (ratingsError) throw ratingsError

//       setRatings((ratingsData as AppRating[]) || [])

//       // Fetch current featured review
//       const { data: settingsData } = await supabase
//         .from('site_settings')
//         .select('value')
//         .eq('key', 'featured_app_rating')
//         .single()

//       if (settingsData?.value?.id) {
//         setFeaturedId(settingsData.value.id)
//       } else {
//         setFeaturedId(null)
//       }
//     } catch (err: any) {
//       console.error('Error loading data:', err)
//       toast.error('Failed to load reviews. Make sure site_settings table exists.')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const setAsFeatured = async (rating: AppRating) => {
//     setSaving(true)

//     const featuredData = {
//       id: rating.id,
//       rating: rating.rating,
//       comment: rating.comment,
//       user_name: rating.profiles 
//         ? `${rating.profiles.first_name || ''} ${rating.profiles.last_name || ''}`.trim() || 'Happy Customer'
//         : 'Happy Customer',
//       profile_image: rating.profiles?.profile_image || null
//     }

//     try {
//       const { error } = await supabase
//         .from('site_settings')
//         .upsert({
//           key: 'featured_app_rating',
//           value: featuredData
//         }, { onConflict: 'key' })

//       if (error) throw error

//       setFeaturedId(rating.id)
//       toast.success('Featured review updated successfully!')
//     } catch (err) {
//       toast.error('Failed to set featured review')
//     } finally {
//       setSaving(false)
//     }
//   }

//   const removeFeatured = async () => {
//     if (!confirm('Remove the current featured review?')) return

//     try {
//       const { error } = await supabase
//         .from('site_settings')
//         .delete()
//         .eq('key', 'featured_app_rating')

//       if (error) throw error

//       setFeaturedId(null)
//       toast.success('Featured review removed')
//     } catch (err) {
//       toast.error('Failed to remove featured review')
//     }
//   }

//   if (loading) {
//     return (
//       <div className="p-6 max-w-7xl mx-auto flex justify-center py-32">
//         <FaSpinner className="animate-spin text-5xl text-[var(--orange)]" />
//       </div>
//     )
//   }

//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       <div className="flex justify-between items-center mb-10">
//         <div>
//           <h1 className="text-4xl font-bold text-[var(--blue)]">Featured Review</h1>
//           <p className="text-gray-600">Choose which customer review appears on the homepage</p>
//         </div>

//         {featuredId && (
//           <button
//             onClick={removeFeatured}
//             className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition"
//           >
//             <FaTrash /> Remove Current Featured
//           </button>
//         )}
//       </div>

//       {ratings.length === 0 ? (
//         <div className="bg-white rounded-3xl shadow p-20 text-center">
//           <FaStar className="text-7xl text-gray-200 mx-auto mb-6" />
//           <h3 className="text-2xl font-semibold text-gray-700">No reviews yet</h3>
//           <p className="text-gray-500 mt-2">Customer ratings will appear here once submitted.</p>
//         </div>
//       ) : (
//         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
//           {ratings.map((rating) => {
//             const isCurrent = rating.id === featuredId
//             const name = rating.profiles 
//               ? `${rating.profiles.first_name || ''} ${rating.profiles.last_name || ''}`.trim() || 'Anonymous'
//               : 'Anonymous'

//             return (
//               <div
//                 key={rating.id}
//                 className={`bg-white rounded-3xl shadow p-6 transition-all ${
//                   isCurrent ? 'ring-2 ring-[var(--orange)] shadow-lg' : ''
//                 }`}
//               >
//                 <div className="flex items-start justify-between mb-4">
//                   <div className="flex items-center gap-3">
//                     {rating.profiles?.profile_image ? (
//                       <Image
//                         src={rating.profiles.profile_image}
//                         alt={name}
//                         width={50}
//                         height={50}
//                         className="rounded-full object-cover"
//                         unoptimized
//                       />
//                     ) : (
//                       <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-2xl">
//                         👤
//                       </div>
//                     )}
//                     <div>
//                       <p className="font-semibold">{name}</p>
//                       <p className="text-xs text-gray-500">
//                         {new Date(rating.created_at).toLocaleDateString()}
//                       </p>
//                     </div>
//                   </div>

//                   <div className="flex">
//                     {[1,2,3,4,5].map((s) => (
//                       <FaStar
//                         key={s}
//                         className={`text-xl ${s <= rating.rating ? 'text-[var(--orange)]' : 'text-gray-200'}`}
//                       />
//                     ))}
//                   </div>
//                 </div>

//                 <p className="text-gray-700 italic mb-6 line-clamp-3 min-h-[80px]">
//                   “{rating.comment || 'No comment'}”
//                 </p>

//                 <button
//                   onClick={() => setAsFeatured(rating)}
//                   disabled={isCurrent || saving}
//                   className={`w-full py-3 rounded-2xl font-medium transition flex items-center justify-center gap-2
//                     ${isCurrent 
//                       ? 'bg-green-100 text-green-700 cursor-default' 
//                       : 'bg-[var(--orange)] hover:bg-orange-600 text-white'
//                     }`}
//                 >
//                   {isCurrent ? (
//                     <>✓ Currently Featured</>
//                   ) : (
//                     <>Set as Featured Review</>
//                   )}
//                 </button>
//               </div>
//             )
//           })}
//         </div>
//       )}
//     </div>
//   )
// }

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { FaStar, FaSpinner, FaTrash } from 'react-icons/fa'
import Image from 'next/image'

type AppRating = {
  id: string
  rating: number
  comment: string | null
  created_at: string
  profiles: {
    first_name?: string | null
    last_name?: string | null
    profile_image?: string | null
  } | null
}

export default function AdminFeaturedReviewPage() {
  const [ratings, setRatings] = useState<AppRating[]>([])
  const [featuredId, setFeaturedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      // Fetch ratings
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('app_ratings')
        .select(`
          id, rating, comment, created_at,
          profiles (first_name, last_name, profile_image)
        `)
        .order('created_at', { ascending: false })
        .limit(20)

      if (ratingsError) throw ratingsError
      setRatings((ratingsData as AppRating[]) || [])

      // Fetch current featured
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'featured_app_rating')
        .single()

      setFeaturedId(settingsData?.value?.id || null)
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const setAsFeatured = async (rating: AppRating) => {
    setSaving(true)
    const featuredData = {
      id: rating.id,
      rating: rating.rating,
      comment: rating.comment,
      user_name: rating.profiles 
        ? `${rating.profiles.first_name || ''} ${rating.profiles.last_name || ''}`.trim() || 'Happy Customer'
        : 'Happy Customer',
      profile_image: rating.profiles?.profile_image || null
    }

    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key: 'featured_app_rating', value: featuredData }, { onConflict: 'key' })

      if (error) throw error

      setFeaturedId(rating.id)
      toast.success('Featured review updated!')
      loadAllData() // Refresh
    } catch (err) {
      toast.error('Failed to set featured review')
    } finally {
      setSaving(false)
    }
  }

  const removeFeatured = async () => {
    if (!confirm('Are you sure you want to remove the featured review?')) return

    try {
      const { error } = await supabase
        .from('site_settings')
        .delete()
        .eq('key', 'featured_app_rating')

      if (error) throw error

      setFeaturedId(null)
      toast.success('Featured review removed successfully')

      // Force refresh everything
      loadAllData()
    } catch (err) {
      toast.error('Failed to remove featured review')
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex justify-center py-32">
        <FaSpinner className="animate-spin text-5xl text-[var(--orange)]" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-[var(--blue)]">Featured Review</h1>
          <p className="text-gray-600">Choose which customer review appears on the homepage</p>
        </div>

        {featuredId && (
          <button
            onClick={removeFeatured}
            className="flex items-center gap-2 px-5 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition"
          >
            <FaTrash /> Remove Featured Review
          </button>
        )}
      </div>

      {ratings.length === 0 ? (
        <div className="bg-white rounded-3xl shadow p-20 text-center">
          <FaStar className="text-7xl text-gray-200 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold text-gray-700">No reviews yet</h3>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {ratings.map((rating) => {
            const isCurrent = rating.id === featuredId
            const name = rating.profiles 
              ? `${rating.profiles.first_name || ''} ${rating.profiles.last_name || ''}`.trim() || 'Anonymous'
              : 'Anonymous'

            return (
              <div
                key={rating.id}
                className={`bg-white rounded-3xl shadow p-6 transition-all ${
                  isCurrent ? 'ring-2 ring-[var(--orange)]' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {rating.profiles?.profile_image ? (
                      <Image
                        src={rating.profiles.profile_image}
                        alt={name}
                        width={50}
                        height={50}
                        className="rounded-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-2xl">
                        👤
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(rating.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex">
                    {[1,2,3,4,5].map((s) => (
                      <FaStar
                        key={s}
                        className={`text-xl ${s <= rating.rating ? 'text-[var(--orange)]' : 'text-gray-200'}`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-gray-700 italic mb-6 line-clamp-3">
                  “{rating.comment || 'No comment'}”
                </p>

                <button
                  onClick={() => setAsFeatured(rating)}
                  disabled={isCurrent || saving}
                  className={`w-full py-3 rounded-2xl font-medium transition flex items-center justify-center gap-2
                    ${isCurrent 
                      ? 'bg-green-100 text-green-700 cursor-default' 
                      : 'bg-[var(--orange)] hover:bg-orange-600 text-white'
                    }`}
                >
                  {isCurrent ? <>✓ Currently Featured</> : <>Set as Featured Review</>}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}