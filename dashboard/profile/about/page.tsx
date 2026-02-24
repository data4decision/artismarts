// 'use client'

// import React, { useState, useEffect, useCallback } from 'react'
// import Image from 'next/image'
// import Cropper, { Area } from 'react-easy-crop'
// import { supabase } from '@/lib/supabase'
// import { FaCamera, FaUserEdit, FaSave, FaTimes, FaCheckCircle, FaTimesCircle, FaStar, FaQuestionCircle, FaBriefcase, FaCertificate } from 'react-icons/fa'
// import toast from 'react-hot-toast'

// import getCroppedImg from '@/utils/getCroppedImg'

// interface ArtisanProfile {
//   first_name: string | null
//   last_name: string | null
//   business_name: string | null
//   skills: string | null
//   residential_address: string | null
//   state: string | null
//   lga: string | null
//   profile_image: string | null
//   phone: string | null
//   // Trust fields
//   verification_status: 'verified' | 'pending' | 'not_verified' | null
//   average_rating: number | null
//   rating_count: number | null
//   // About section fields — new
//   bio: string | null
//   years_of_experience: number | null
//   certifications: string | null     // comma-separated e.g. "City & Guilds Plumbing,NEBOSH Certified"
// }

// const ArtisanProfilePage = () => {
//   const [profile, setProfile] = useState<ArtisanProfile | null>(null)
//   const [isLoading, setIsLoading] = useState(true)
//   const [isEditing, setIsEditing] = useState(false)

//   const [formData, setFormData] = useState<Partial<ArtisanProfile>>({})

//   const [file, setFile] = useState<File | null>(null)
//   const [previewUrl, setPreviewUrl] = useState<string | null>(null)
//   const [crop, setCrop] = useState({ x: 0, y: 0 })
//   const [zoom, setZoom] = useState(1)
//   const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
//   const [croppedPreview, setCroppedPreview] = useState<string | null>(null)

//   useEffect(() => {
//     const fetchProfile = async () => {
//       try {
//         setIsLoading(true)

//         const { data: { user }, error: authError } = await supabase.auth.getUser()
//         if (authError || !user) {
//           toast.error('Please sign in to view your profile')
//           return
//         }

//         const { data, error } = await supabase
//           .from('profiles')
//           .select(`
//             first_name, last_name, business_name, skills,
//             residential_address, state, lga, profile_image, phone,
//             verification_status, average_rating, rating_count,
//             bio, years_of_experience, certifications
//           `)
//           .eq('id', user.id)
//           .maybeSingle()

//         if (error) {
//           console.error('[Profile] Query error:', error)
//           toast.error(error.code === '42501' ? 'Permission denied – check RLS' : 'Failed to load profile')
//           return
//         }

//         if (!data) {
//           toast('Profile not found – please complete it', { icon: '⚠️' })
//           setIsEditing(true)
//           return
//         }

//         setProfile(data)
//         setPreviewUrl(data.profile_image || null)
//         setFormData({
//           first_name: data.first_name || '',
//           last_name: data.last_name || '',
//           business_name: data.business_name || '',
//           skills: data.skills || '',
//           residential_address: data.residential_address || '',
//           state: data.state || '',
//           lga: data.lga || '',
//           phone: data.phone || '',
//           bio: data.bio || '',
//           years_of_experience: data.years_of_experience || null,
//           certifications: data.certifications || '',
//         })

//       } catch (err) {
//         console.error(err)
//         toast.error('Something went wrong')
//       } finally {
//         setIsLoading(false)
//       }
//     }

//     fetchProfile()

//     const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
//       if (session?.user) fetchProfile()
//       else setProfile(null)
//     })

//     return () => subscription.unsubscribe()
//   }, [])

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target
//     if (name === 'years_of_experience') {
//       setFormData(prev => ({ ...prev, [name]: value ? Number(value) : null }))
//     } else {
//       setFormData(prev => ({ ...prev, [name]: value }))
//     }
//   }

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const selected = e.target.files?.[0]
//     if (!selected) return
//     if (!selected.type.startsWith('image/')) return toast.error('Please select an image')
//     if (selected.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB')

//     const url = URL.createObjectURL(selected)
//     setFile(selected)
//     setPreviewUrl(url)
//     setCroppedPreview(null)
//     setZoom(1)
//     setCrop({ x: 0, y: 0 })
//   }

//   const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
//     setCroppedAreaPixels(croppedAreaPixels)
//   }, [])

//   const createCroppedPreview = useCallback(async () => {
//     if (!previewUrl || !croppedAreaPixels) return
//     try {
//       const cropped = await getCroppedImg(previewUrl, croppedAreaPixels)
//       setCroppedPreview(cropped)
//     } catch (e) {
//       console.error(e)
//     }
//   }, [previewUrl, croppedAreaPixels])

//   useEffect(() => {
//     if (previewUrl && croppedAreaPixels) createCroppedPreview()
//   }, [previewUrl, croppedAreaPixels, createCroppedPreview])

//   // ── handleSubmit ── (expanded to save new fields)
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()

//     const { data: { user } } = await supabase.auth.getUser()
//     if (!user) return toast.error('Not authenticated')

//     let photoUrl = profile?.profile_image || null

//     if (file && croppedPreview) {
//       try {
//         const response = await fetch(croppedPreview)
//         const blob = await response.blob()
//         const uploadFile = new File([blob], file.name || 'profile.jpg', { type: 'image/jpeg' })

//         const fileExt = uploadFile.name.split('.').pop() || 'jpg'
//         const fileName = `${user.id}-${Date.now()}.${fileExt}`

//         const { error: uploadError } = await supabase.storage
//           .from('profile-photos')
//           .upload(fileName, uploadFile, { upsert: true })

//         if (uploadError) throw uploadError

//         const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(fileName)
//         photoUrl = urlData.publicUrl
//       } catch (err) {
//         console.error('Photo upload failed:', err)
//         toast.error('Failed to upload photo')
//         return
//       }
//     }

//     const { error } = await supabase
//       .from('profiles')
//       .update({
//         first_name: formData.first_name || null,
//         last_name: formData.last_name || null,
//         business_name: formData.business_name || null,
//         skills: formData.skills || null,
//         residential_address: formData.residential_address || null,
//         state: formData.state || null,
//         lga: formData.lga || null,
//         phone: formData.phone || null,
//         profile_image: photoUrl,
//         bio: formData.bio || null,
//         years_of_experience: formData.years_of_experience,
//         certifications: formData.certifications || null,
//       })
//       .eq('id', user.id)

//     if (error) {
//       console.error('Update failed:', error)
//       toast.error('Failed to save profile')
//       return
//     }

//     setProfile(prev => prev ? { ...prev, ...formData, profile_image: photoUrl } : null)
//     setPreviewUrl(photoUrl)
//     setFile(null)
//     setCroppedPreview(null)
//     setIsEditing(false)
//     toast.success('Profile updated successfully!')
//   }

//   if (isLoading) {
//     return <div className="flex justify-center items-center min-h-[60vh] text-[var(--blue)]">Loading profile...</div>
//   }

//   if (!profile && !isEditing) {
//     return (
//       <div className="max-w-2xl mx-auto text-center py-16">
//         <h2 className="text-2xl font-bold text-[var(--blue)] mb-4">Welcome! Let’s set up your artisan profile</h2>
//         <p className="text-[var(--blue)] mb-8">Click Edit Profile below to get started.</p>
//         <button
//           onClick={() => setIsEditing(true)}
//           className="inline-flex items-center gap-2 px-8 py-3 bg-[var(--orange)] text-white rounded-lg font-medium hover:bg-[var(--orange)]/90 transition shadow-md"
//         >
//           <FaUserEdit /> Edit Profile
//         </button>
//       </div>
//     )
//   }

//   const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Artisan'
//   const location = [profile?.residential_address, profile?.state, profile?.lga].filter(Boolean).join(', ') || 'No location set'
//   const primarySkill = profile?.skills ? profile.skills.split(',')[0]?.trim() : '—'

//   const VerificationBadge = () => {
//     const status = profile?.verification_status
//     if (status === 'verified') return <span className="inline-flex items-center gap-1.5 text-green-600"><FaCheckCircle /> Verified</span>
//     if (status === 'pending') return <span className="inline-flex items-center gap-1.5 text-amber-600"><FaQuestionCircle /> Pending</span>
//     return <span className="inline-flex items-center gap-1.5 text-red-600"><FaTimesCircle /> Not Verified</span>
//   }

//   return (
//     <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
//       <h1 className="text-2xl sm:text-3xl font-bold text-[var(--blue)] mb-8">My Artisan Profile</h1>

//       <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">

//         {/* 1️⃣ PROFILE OVERVIEW – same as before */}
//         <div className="p-6 sm:p-10 border-b bg-gradient-to-r from-[var(--blue)]/5 to-white">
//           <div className="flex flex-col sm:flex-row items-center gap-8">
//             <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-white shadow-xl">
//               <Image src={previewUrl || '/default-avatar.png'} alt="Profile" fill className="object-cover" sizes="(max-width: 640px) 128px, 160px" />
//               {isEditing && (
//                 <label htmlFor="profile-photo" className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer hover:bg-black/60 transition">
//                   <FaCamera className="text-white text-4xl" />
//                   <input id="profile-photo" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
//                 </label>
//               )}
//             </div>

//             <div className="text-center sm:text-left space-y-3 flex-1">
//               <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--blue)]">{displayName}</h2>
//               {profile?.business_name && <p className="text-xl font-medium text-[var(--blue)]">{profile.business_name}</p>}
//               {primarySkill && <p className="text-lg text-gray-700 font-medium">{primarySkill}</p>}
//               <p className="text-sm text-gray-600">{location}</p>

//               <div className="flex flex-wrap items-center gap-5 pt-2 justify-center sm:justify-start">
//                 <div className="flex items-center gap-1.5 text-base font-medium"><VerificationBadge /></div>
//                 {profile?.average_rating ? (
//                   <div className="flex items-center gap-1.5 text-base font-medium">
//                     <FaStar className="text-amber-500 text-lg" />
//                     <span>{profile.average_rating.toFixed(1)}</span>
//                     {profile.rating_count && <span className="text-gray-500">({profile.rating_count})</span>}
//                   </div>
//                 ) : (
//                   <div className="text-gray-500 text-sm">No ratings yet</div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* 2️⃣ ABOUT THE ARTISAN */}
//         <div className="p-6 sm:p-10 border-b">
//           <h3 className="text-xl font-bold text-[var(--blue)] mb-6 flex items-center gap-3">
//             <FaBriefcase className="text-[var(--orange)]" /> About Me
//           </h3>

//           {isEditing ? (
//             <div className="space-y-6">
//               <div>
//                 <label className="block text-sm font-medium text-[var(--blue)] mb-1.5">Professional Bio / About</label>
//                 <textarea
//                   name="bio"
//                   value={formData.bio || ''}
//                   onChange={handleChange}
//                   rows={5}
//                   placeholder="Tell customers about your experience, specialties, and what sets you apart..."
//                   className="w-full px-4 py-2.5 border border-[var(--blue)] rounded-lg focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none resize-y"
//                 />
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <label className="block text-sm font-medium text-[var(--blue)] mb-1.5">Years of Experience</label>
//                   <input
//                     type="number"
//                     name="years_of_experience"
//                     value={formData.years_of_experience ?? ''}
//                     onChange={handleChange}
//                     min={0}
//                     placeholder="e.g. 8"
//                     className="w-full px-4 py-2.5 border border-[var(--blue)] rounded-lg focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-[var(--blue)] mb-1.5">Certifications / Training</label>
//                   <input
//                     name="certifications"
//                     value={formData.certifications || ''}
//                     onChange={handleChange}
//                     placeholder="e.g. City & Guilds, NEBOSH, Master Craftsman"
//                     className="w-full px-4 py-2.5 border border-[var(--blue)] rounded-lg focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none"
//                   />
//                 </div>
//               </div>
//             </div>
//           ) : (
//             <div className="space-y-6 text-[var(--blue)]">
//               {profile?.bio ? (
//                 <p className="leading-relaxed">{profile.bio}</p>
//               ) : (
//                 <p className="text-gray-500 italic">No bio added yet.</p>
//               )}

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <h4 className="text-sm font-medium uppercase tracking-wide text-gray-600">Experience</h4>
//                   <p className="mt-1 text-lg font-medium">
//                     {profile?.years_of_experience != null ? `${profile.years_of_experience} years` : '—'}
//                   </p>
//                 </div>

//                 <div>
//                   <h4 className="text-sm font-medium uppercase tracking-wide text-gray-600">Certifications</h4>
//                   <p className="mt-1">
//                     {profile?.certifications ? (
//                       <ul className="list-disc list-inside space-y-1">
//                         {profile.certifications.split(',').map((cert, i) => (
//                           <li key={i} className="text-gray-800">{cert.trim()}</li>
//                         ))}
//                       </ul>
//                     ) : '—'}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Edit / Save buttons – placed at bottom for now */}
//         <div className="p-6 sm:p-10 bg-gray-50 text-center">
//           {isEditing ? (
//             <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
//               <button
//                 type="submit"
//                 onClick={handleSubmit}
//                 className="flex-1 bg-[var(--orange)] text-white py-3 px-6 rounded-lg font-medium hover:bg-[var(--orange)]/90 transition flex items-center justify-center gap-2 shadow-sm"
//               >
//                 <FaSave /> Save Changes
//               </button>
//               <button
//                 type="button"
//                 onClick={() => setIsEditing(false)}
//                 className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition flex items-center justify-center gap-2"
//               >
//                 <FaTimes /> Cancel
//               </button>
//             </div>
//           ) : (
//             <button
//               onClick={() => setIsEditing(true)}
//               className="inline-flex items-center gap-2 px-8 py-3 bg-[var(--blue)] text-white rounded-lg font-medium hover:bg-[var(--blue)]/90 transition shadow-md"
//             >
//               <FaUserEdit /> Edit Profile
//             </button>
//           )}
//         </div>

//       </div>
//     </div>
//   )
// }

// export default ArtisanProfilePage