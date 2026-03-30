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
import { FaStar, FaSpinner, FaCheckCircle, FaTrash } from 'react-icons/fa'
import Image from 'next/image'

export default function FeaturedRatingPage() {
  const [allRatings, setAllRatings] = useState<any[]>([])
  const [selectedRatings, setSelectedRatings] = useState<any[]>([]) // Array for multiple selections
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchAllRatings()
    fetchCurrentFeatured()
  }, [])

  const fetchAllRatings = async () => {
    const { data, error } = await supabase
      .from('app_ratings')
      .select(`
        id,
        rating,
        comment,
        created_at,
        profiles:user_id (
          first_name,
          last_name,
          profile_image
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to load ratings')
      return
    }
    setAllRatings(data || [])
    setLoading(false)
  }

  const fetchCurrentFeatured = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'featured_ratings')
      .single()

    if (data?.value && Array.isArray(data.value)) {
      setSelectedRatings(data.value)
    } else {
      setSelectedRatings([])
    }
  }

  const toggleSelection = (rating: any) => {
    const isAlreadySelected = selectedRatings.some(r => r.id === rating.id)

    if (isAlreadySelected) {
      // Remove from selection
      setSelectedRatings(prev => prev.filter(r => r.id !== rating.id))
    } else {
      // Add new one - with limit check
      if (selectedRatings.length >= 10) {
        toast.error("You can only feature up to 10 reviews. Please remove one first.")
        return
      }

      const newItem = {
        id: rating.id,
        rating: rating.rating,
        comment: rating.comment,
        user_name: `${rating.profiles?.first_name || ''} ${rating.profiles?.last_name || ''}`.trim() || 'Happy Customer',
        profile_image: rating.profiles?.profile_image || null
      }

      setSelectedRatings(prev => [...prev, newItem])
    }
  }

  const saveFeaturedRatings = async () => {
    if (selectedRatings.length === 0) {
      toast.error("Please select at least one review")
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'featured_ratings',
          value: selectedRatings
        }, { onConflict: 'key' })

      if (error) throw error

      toast.success(`Successfully saved ${selectedRatings.length} featured reviews!`)
    } catch (err) {
      toast.error('Failed to save featured reviews')
    } finally {
      setSaving(false)
    }
  }

  const removeAll = () => {
    if (!confirm('Remove all featured reviews?')) return
    setSelectedRatings([])
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-[var(--blue)]">Featured Testimonials</h1>
          <p className="text-gray-600">Select up to 10 reviews to show on the landing page</p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={removeAll}
            className="px-5 py-2 text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2"
          >
            <FaTrash /> Clear All
          </button>
          <button
            onClick={saveFeaturedRatings}
            disabled={saving || selectedRatings.length === 0}
            className="px-8 py-3 bg-[var(--orange)] hover:bg-orange-600 text-white font-semibold rounded-2xl flex items-center gap-2 disabled:bg-gray-400"
          >
            {saving ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
            Save Featured Reviews ({selectedRatings.length}/10)
          </button>
        </div>
      </div>

      {loading ? (
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allRatings.map((rating) => {
            const isSelected = selectedRatings.some(r => r.id === rating.id)

            return (
              <div
                key={rating.id}
                onClick={() => toggleSelection(rating)}
                className={`bg-white p-6 rounded-3xl shadow cursor-pointer transition-all border-4 ${
                  isSelected ? 'border-[var(--orange)] shadow-xl' : 'border-transparent hover:border-gray-200'
                }`}
              >
                <div className="flex gap-4 items-start mb-5">
                  {rating.profiles?.profile_image ? (
                    <Image
                      src={rating.profiles.profile_image}
                      alt=""
                      width={60}
                      height={60}
                      className="rounded-2xl object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-15 h-15 bg-gray-200 rounded-2xl flex items-center justify-center text-3xl">
                      👤
                    </div>
                  )}

                  <div className="flex-1">
                    <p className="font-semibold text-lg">
                      {rating.profiles?.first_name} {rating.profiles?.last_name}
                    </p>
                    <div className="flex gap-1 mt-1">
                      {[1,2,3,4,5].map(s => (
                        <FaStar key={s} className={s <= rating.rating ? 'text-[var(--orange)]' : 'text-gray-200'} />
                      ))}
                    </div>
                  </div>
                </div>

                <p className="italic text-gray-700 line-clamp-4">
                  “{rating.comment || 'No comment provided'}”
                </p>

                {isSelected && (
                  <div className="mt-4 text-[var(--orange)] text-sm font-medium flex items-center gap-2">
                    <FaCheckCircle /> Selected for homepage
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Selected Summary */}
      {selectedRatings.length > 0 && (
        <div className="mt-12 bg-gray-50 p-6 rounded-2xl">
          <h3 className="font-semibold mb-4">Selected Reviews ({selectedRatings.length}/10)</h3>
          <div className="flex flex-wrap gap-2">
            {selectedRatings.map((r, i) => (
              <div key={i} className="bg-white px-4 py-2 rounded-full text-sm border flex items-center gap-2">
                {r.user_name}
                <button
                  onClick={() => setSelectedRatings(prev => prev.filter(item => item.id !== r.id))}
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}