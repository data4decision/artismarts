

// 'use client'

// import { useState, useEffect, useRef } from 'react'
// import { useParams, useRouter } from 'next/navigation'
// import { supabase } from '@/lib/supabase'
// import toast from 'react-hot-toast'
// import { 
//   FaSpinner, FaCheckCircle, FaUpload, FaImage, FaCommentDots, 
//   FaArrowLeft, FaInfoCircle, FaTimes, FaDownload,
//   FaExclamationTriangle, FaExpand, FaTools, FaPlayCircle,
//   FaUserTie,
//   FaMapMarkerAlt
// } from 'react-icons/fa'
// import Image from 'next/image'
// import Link from 'next/link'

// interface Job {
//   id: string
//   title: string
//   description: string
//   status: string
//   location: string
//   assigned_artisan_id: string
//   progress_photo_urls: string[]
//   completion_photo_urls: string[]
//   progress_notes: string[]
//   completion_note: string | null
//   completed_at: string | null
//   customer: {
//     first_name: string | null
//     last_name: string | null
//     phone: string | null
//   } | null
// }



// export default function ArtisanActiveJob() {
//   const params = useParams()
//   const jobId = params.jobId as string
//   const router = useRouter()

//   const [job, setJob] = useState<Job | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [photos, setPhotos] = useState<File[]>([])
//   const [previewUrls, setPreviewUrls] = useState<string[]>([])
//   const [note, setNote] = useState('')
//   const [submitting, setSubmitting] = useState(false)
//   const [actionType, setActionType] = useState<'ongoing' | 'complete' | null>(null)
//   const [isCompleted, setIsCompleted] = useState(false)

//   const [zoomedPhoto, setZoomedPhoto] = useState<{ url: string; type: string } | null>(null)

//   const fileInputRef = useRef<HTMLInputElement>(null)

//   useEffect(() => {
//     if (!jobId) {
//       toast.error('Job ID missing')
//       router.replace('/dashboard/artisan/active-jobs')
//       return
//     }
//     fetchJob()
//   }, [jobId, router])

//   const fetchJob = async () => {
//     if (!jobId) return

//     setLoading(true)
//     try {
//       const { data: { user } } = await supabase.auth.getUser()
//       if (!user) {
//         router.replace('/login')
//         return
//       }

//       const { data, error } = await supabase
//         .from('job_requests')
//         .select(`
//           id,
//           title,
//           description,
//           status,
//           location,
//           assigned_artisan_id,
//           progress_photo_urls,
//           completion_photo_urls,
//           progress_notes,
//           completion_note,
//           completed_at,
//           customer:customer_id (first_name, last_name, phone)
//         `)
//         .eq('id', jobId)
//         .eq('assigned_artisan_id', user.id)
//         .single()

//       if (error) throw error
//       if (!data) throw new Error('Job not found or not assigned to you')

//       // Option 1: Safe manual mapping - no 'as Job' needed
//       const mappedJob: Job = {
//         id: String(data.id ?? ''),
//         title: String(data.title ?? 'Untitled Job'),
//         description: String(data.description ?? ''),
//         status: String(data.status ?? 'in_progress'),
//         location: String(data.location ?? 'Not specified'),
//         assigned_artisan_id: String(data.assigned_artisan_id ?? ''),
//         progress_photo_urls: Array.isArray(data.progress_photo_urls) 
//           ? data.progress_photo_urls.filter((u): u is string => typeof u === 'string')
//           : [],
//         completion_photo_urls: Array.isArray(data.completion_photo_urls) 
//           ? data.completion_photo_urls.filter((u): u is string => typeof u === 'string')
//           : [],
//         progress_notes: (() => {
//   if (!data.progress_notes) return []

//   // If already array
//   if (Array.isArray(data.progress_notes)) {
//     return data.progress_notes.filter((n): n is string => typeof n === 'string')
//   }

//   // If it's a string (JSON from Supabase)
//   if (typeof data.progress_notes === 'string') {
//     try {
//       const parsed = JSON.parse(data.progress_notes)
//       return Array.isArray(parsed) ? parsed : []
//     } catch {
//       return []
//     }
//   }

//   return []
// })(),
//         completion_note: data.completion_note !== undefined ? String(data.completion_note ?? null) : null,
//         completed_at: data.completed_at ?? null,
//         customer: data.customer ? {
//   first_name: (data.customer as any).first_name ?? null,
//   last_name: (data.customer as any).last_name ?? null,
//   phone: (data.customer as any).phone ?? null,
// } : null,
//       }

//       setJob(mappedJob)

//       if (data.status === 'completed_pending_review' || data.status === 'completed') {
//         setIsCompleted(true)
//       } else {
//         setIsCompleted(false)
//       }
//     } catch (err: any) {
//       console.error('Fetch error:', err)
//       toast.error(err.message || 'Failed to load job details')
//       router.back()
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (!e.target.files?.length) return

//     const newFiles = Array.from(e.target.files)
//     if (photos.length + newFiles.length > 10) {
//       toast.error('Maximum 10 photos per update')
//       return
//     }

//     const newPreviews = newFiles.map(file => URL.createObjectURL(file))
//     setPreviewUrls(prev => [...prev, ...newPreviews])
//     setPhotos(prev => [...prev, ...newFiles])
//   }

//   const removePreviewPhoto = (index: number) => {
//     URL.revokeObjectURL(previewUrls[index])
//     setPhotos(prev => prev.filter((_, i) => i !== index))
//     setPreviewUrls(prev => prev.filter((_, i) => i !== index))
//   }

//   const handleDownload = async (url: string, filename = 'photo.jpg') => {
//     try {
//       const response = await fetch(url, { mode: 'cors' })
//       if (!response.ok) throw new Error('Network response was not ok')
//       const blob = await response.blob()
//       const blobUrl = URL.createObjectURL(blob)
//       const link = document.createElement('a')
//       link.href = blobUrl
//       link.download = filename
//       document.body.appendChild(link)
//       link.click()
//       document.body.removeChild(link)
//       URL.revokeObjectURL(blobUrl)
//       toast.success('Download started!')
//     } catch (err) {
//       console.error('Download error:', err)
//       toast.error('Failed to download. Try right-click → Save image as.')
//     }
//   }

//   const handleSubmit = async (type: 'ongoing' | 'complete') => {
//     if (type === 'complete' && photos.length === 0 && !note.trim()) {
//       if (!confirm('No new photos or note added. Still mark as complete?')) return
//     }

//     if (type === 'ongoing' && photos.length === 0 && !note.trim()) {
//       toast.error('Please add at least a photo or note for progress update')
//       return
//     }

//     setSubmitting(true)
//     setActionType(type)

//     try {
//       const newPhotoUrls: string[] = []

//       if (photos.length > 0) {
//         for (const file of photos) {
//           const ext = file.name.split('.').pop() || 'jpg'
//           const path = `progress/${jobId}/${Date.now()}.${ext}`

//           const { error: uploadError } = await supabase.storage
//             .from('job-progress-photos')
//             .upload(path, file)

//           if (uploadError) throw uploadError

//           const { data } = supabase.storage.from('job-progress-photos').getPublicUrl(path)
//           newPhotoUrls.push(data.publicUrl)
//         }
//       }

//       const currentProgress = job?.progress_photo_urls || []
//       const updatedProgress = type === 'ongoing' 
//         ? [...currentProgress, ...newPhotoUrls]
//         : currentProgress

//       const updateData: any = {
//         updated_at: new Date().toISOString(),
//         progress_photo_urls: updatedProgress,
//       }

//       // Progress notes (ongoing updates only)
//       if (type === 'ongoing' && note.trim()) {
//         const currentNotes = Array.isArray(job?.progress_notes)
//   ? job.progress_notes
//   : []
//         const timestamp = new Date().toLocaleString('en-NG', {
//           dateStyle: 'medium',
//           timeStyle: 'short'
//         })
//         const newNoteEntry = `${timestamp}: ${note.trim()}`
//         updateData.progress_notes = [...currentNotes, newNoteEntry]
//       }

//       // Completion note (final submit only)
//       if (type === 'complete') {
//         updateData.status = 'completed_pending_review'
//         updateData.completion_photo_urls = newPhotoUrls.length > 0 ? newPhotoUrls : null
//         updateData.completed_at = new Date().toISOString()
//         if (note.trim()) {
//           updateData.completion_note = note.trim()
//         }
//       }

//       const { error } = await supabase
//         .from('job_requests')
//         .update(updateData)
//         .eq('id', jobId)

//       if (error) throw error

//       toast.success(
//         type === 'complete'
//           ? 'Job submitted for review!'
//           : 'Progress saved (photos & note)!'
//       )

//       previewUrls.forEach(url => URL.revokeObjectURL(url))
//       setPhotos([])
//       setPreviewUrls([])
//       setNote('')

//       await fetchJob()

//       if (type === 'complete') {
//         setIsCompleted(true)
//       }
//     } catch (err: any) {
//       console.error('Submit error:', err)
//       toast.error(err.message || 'Failed to submit update')
//     } finally {
//       setSubmitting(false)
//       setActionType(null)
//     }
//   }

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-[var(--white)]">
//         <div className="relative flex items-center justify-center">
//           <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-[var(--orange)] border-opacity-70 shadow-md"></div>
//           <div className="absolute inset-0 flex items-center justify-center animate-pulse-slow">
//             <div className="bg-[var(--white)] rounded-full p-2 shadow-sm">
//               <Image src="/log.png" width={48} height={48} priority alt="Loading..." className="object-contain" />
//             </div>
//           </div>
//         </div>
//       </div>
//     )
//   }

//   if (!job) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-[var(--white)]">
//         <div className="text-center max-w-md p-8 bg-[var(--white)] rounded-2xl shadow-lg border border-[var(--blue)]/20">
//           <FaExclamationTriangle className="text-[var(--orange)] text-6xl mx-auto mb-4" />
//           <h2 className="text-2xl font-bold text-[var(--blue)] mb-3">Job not found</h2>
//           <p className="text-[var(--blue)] mb-6">
//             This job may no longer be active or you don't have access.
//           </p>
//           <button
//             onClick={() => router.push('/dashboard/artisan/active-jobs')}
//             className="px-6 py-3 bg-[var(--orange)] text-[var(--white)] rounded-xl hover:bg-orange-600 transition font-medium"
//           >
//             Back to Active Jobs
//           </button>
//         </div>
//       </div>
//     )
//   }

//   const allUploadedPhotos = [
//     ...(job.progress_photo_urls || []).map((url: string) => ({ url, type: 'progress' })),
//     ...(job.completion_photo_urls || []).map((url: string) => ({ url, type: 'completion' })),
//   ]

//   return (
//     <div className="min-h-screen bg-[var(--white)] py-6 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-5xl mx-auto">
//         {/* Navigation */}
//         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
//           <button
//             onClick={() => router.push('/dashboard/artisan/jobs')}
//             className="flex items-center gap-2 text-[var(--blue)] hover:text-[var(--orange)] transition font-medium text-lg"
//           >
//             <FaArrowLeft /> Back to Active Jobs
//           </button>

//           <Link
//             href={`/dashboard/artisan/messages?jobId=${jobId}`}
//             className="flex items-center gap-2 px-6 py-3 bg-[var(--blue)] hover:bg-blue-700 text-[var(--white)] rounded-xl transition shadow-md font-medium"
//           >
//             <FaCommentDots /> Chat with Customer/Admin
//           </Link>
//         </div>

//         {/* Main Content */}
//         <div className="bg-[var(--white)] rounded-2xl shadow-xl border border-[var(--blue)]/10 overflow-hidden">
//           {/* Header */}
//           <div className="bg-gradient-to-r from-[var(--blue)] to-blue-800 text-[var(--white)] p-6 sm:p-8">
//             <h1 className="text-2xl sm:text-3xl font-bold">{job.title}</h1>
//             <div className="mt-3 flex flex-wrap items-center gap-4 text-sm opacity-90">
//               <div className="flex items-center gap-2">
//                 <FaUserTie />
//                 Customer: {job.customer?.first_name ?? ''} {job.customer?.last_name ?? ''}
//               </div>
//               {job.customer?.phone && (
//                 <div className="flex items-center gap-2">
//                   <span>•</span> {job.customer.phone}
//                 </div>
//               )}
//               <div className="flex items-center gap-2">
//                 <FaMapMarkerAlt />
//                 {job.location || 'Location not specified'}
//               </div>
//             </div>
//           </div>

//           {/* Guide */}
//           {!isCompleted && (
//             <div className="p-6 sm:p-8 bg-gradient-to-b from-gray-50 to-white border-b border-[var(--blue)]/10">
//               <div className="flex items-start gap-4">
//                 <div className="text-[var(--orange)] text-5xl mt-1 flex-shrink-0">
//                   <FaInfoCircle />
//                 </div>
//                 <div>
//                   <h2 className="text-xl font-bold text-[var(--blue)] mb-4">
//                     How This Active Workspace Works
//                   </h2>
//                   <ul className="space-y-3 text-[var(--blue)] text-base">
//                     <li className="flex items-start gap-3">
//                       <FaTools className="text-[var(--orange)] mt-1.5 flex-shrink-0" />
//                       <span>Upload clear photos of your work as you go</span>
//                     </li>
//                     <li className="flex items-start gap-3">
//                       <FaCommentDots className="text-[var(--orange)] mt-1.5 flex-shrink-0" />
//                       <span>Add notes describing progress — saved with timestamps</span>
//                     </li>
//                     <li className="flex items-start gap-3">
//                       <FaPlayCircle className="text-[var(--orange)] mt-1.5 flex-shrink-0" />
//                       <span>"Save Progress" updates without finishing</span>
//                     </li>
//                     <li className="flex items-start gap-3">
//                       <FaCheckCircle className="text-[var(--orange)] mt-1.5 flex-shrink-0" />
//                       <span>"Mark as Complete" submits for customer review</span>
//                     </li>
//                   </ul>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Completion Success */}
//           {isCompleted && (
//             <div className="bg-green-50 border-l-4 border-green-500 p-8 mx-6 mt-8 rounded-r-xl">
//               <div className="flex items-start gap-5">
//                 <FaCheckCircle className="text-green-600 text-6xl mt-1 flex-shrink-0" />
//                 <div>
//                   <h3 className="text-3xl font-bold text-green-800 mb-3">
//                     Job Submitted for Review!
//                   </h3>
//                   <p className="text-green-700 text-xl mb-4">
//                     Thank you! All photos and notes have been sent to the customer.
//                   </p>

//                   {job.completion_note && (
//                     <div className="bg-white p-5 rounded-xl border border-green-200 mb-6">
//                       <p className="text-sm text-gray-500 mb-2 font-medium">Final Completion Note:</p>
//                       <p className="text-lg text-[var(--blue)] leading-relaxed whitespace-pre-wrap">
//                         {job.completion_note}
//                       </p>
//                     </div>
//                   )}

//                   {job.completed_at && (
//                     <p className="text-green-600 text-lg mb-8">
//                       Completed on: {new Date(job.completed_at).toLocaleString()}
//                     </p>
//                   )}

//                   <button
//                     onClick={() => router.push('/dashboard/artisan/jobs')}
//                     className="px-10 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-bold shadow-lg text-lg"
//                   >
//                     Back to Active Jobs
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}

//           <div className="p-6 sm:p-8 space-y-12">
//             {/* Photos Gallery */}
//             <div className="bg-gradient-to-b from-gray-50 to-white p-6 rounded-2xl border border-[var(--blue)]/10 shadow-inner">
//               <h3 className="text-2xl font-bold text-[var(--blue)] mb-6 flex items-center gap-3">
//                 <FaImage className="text-[var(--orange)] text-3xl" />
//                 Your Uploaded Photos
//               </h3>

//               {allUploadedPhotos.length === 0 ? (
//                 <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-[var(--blue)]/30">
//                   <FaImage className="mx-auto text-7xl text-gray-300 mb-4" />
//                   <p className="text-2xl font-medium text-[var(--blue)]">No photos yet</p>
//                   <p className="text-lg text-[var(--blue)]/80 mt-2">
//                     {!isCompleted 
//                       ? 'Upload progress photos above — they appear here after saving.'
//                       : 'Completed without additional photos.'}
//                   </p>
//                 </div>
//               ) : (
//                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
//                   {allUploadedPhotos.map(({ url, type }, idx) => (
//                     <div 
//                       key={url}
//                       className="group relative rounded-2xl overflow-hidden shadow-lg border border-gray-200 hover:border-[var(--orange)] hover:shadow-2xl transition-all duration-300 bg-white"
//                     >
//                       <div 
//                         className="relative cursor-zoom-in aspect-square"
//                         onClick={() => setZoomedPhoto({ url, type })}
//                       >
//                         <Image
//                           src={url}
//                           alt={`${type} photo ${idx + 1}`}
//                           fill
//                           className="object-cover transition-transform duration-500 group-hover:scale-110"
//                         />
//                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
//                           <FaExpand className="text-white text-5xl drop-shadow-2xl" />
//                         </div>
//                       </div>

//                       <div className="absolute top-3 left-3">
//                         <span className={`px-3 py-1 text-xs font-semibold rounded-full shadow-md ${
//                           type === 'progress' ? 'bg-[var(--orange)] text-white' : 'bg-green-600 text-white'
//                         }`}>
//                           {type === 'progress' ? 'Progress' : 'Completion'}
//                         </span>
//                       </div>

//                       <button
//                         onClick={() => handleDownload(url, `${type}-photo-${idx + 1}.jpg`)}
//                         className="absolute bottom-3 right-3 bg-[var(--orange)] text-white p-3 rounded-full shadow-lg hover:bg-orange-700 transition transform hover:scale-110 active:scale-95"
//                         title="Download"
//                       >
//                         <FaDownload size={18} />
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>

//             {/* Progress Notes History */}
//             <div className="bg-gradient-to-b from-gray-50 to-white p-6 rounded-2xl border border-[var(--blue)]/10 shadow-inner">
//               <h3 className="text-2xl font-bold text-[var(--blue)] mb-6 flex items-center gap-3">
//                 <FaCommentDots className="text-[var(--orange)] text-3xl" />
//                 Progress Notes History
//               </h3>

//               {job?.progress_notes?.length > 0 ? (
//                 <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
//                   {job.progress_notes.map((noteEntry: string, idx: number) => (
//                     <div 
//                       key={idx}
//                       className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-[var(--orange)] transition"
//                     >
//                       <p className="text-sm text-gray-500 mb-2 font-medium">
//                         {noteEntry.split(': ')[0]}
//                       </p>
//                       <p className="text-[var(--blue)] leading-relaxed">
//                         {noteEntry.split(': ').slice(1).join(': ')}
//                       </p>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-[var(--blue)]/30">
//                   <FaCommentDots className="mx-auto text-6xl text-gray-300 mb-4" />
//                   <p className="text-xl font-medium text-[var(--blue)]">
//                     No progress notes yet
//                   </p>
//                   <p className="text-lg text-[var(--blue)]/80 mt-2">
//                     {!isCompleted 
//                       ? 'Add a note when saving progress — it will appear here with timestamp.'
//                       : 'No notes were added during this job.'}
//                   </p>
//                 </div>
//               )}
//             </div>

//             {/* Upload & Note Section */}
//             {!isCompleted && (
//               <div className="bg-gradient-to-b from-gray-50 to-white p-6 rounded-2xl border border-[var(--blue)]/10 shadow-inner">
//                 <h3 className="text-2xl font-bold text-[var(--blue)] mb-6 flex items-center gap-3">
//                   <FaUpload className="text-[var(--orange)]" />
//                   Add New Progress Update
//                 </h3>

//                 <label className="block mb-8 cursor-pointer">
//                   <div className="border-3 border-dashed border-[var(--blue)]/40 rounded-2xl p-12 sm:p-16 text-center hover:border-[var(--orange)] hover:bg-[var(--orange)]/5 transition-all duration-300">
//                     <input
//                       ref={fileInputRef}
//                       type="file"
//                       accept="image/*"
//                       multiple
//                       onChange={handlePhotoSelect}
//                       className="hidden"
//                     />
//                     <div className="mx-auto w-24 h-24 rounded-full bg-[var(--orange)]/10 flex items-center justify-center mb-5">
//                       <FaUpload className="text-[var(--orange)] text-5xl" />
//                     </div>
//                     <p className="text-2xl font-medium text-[var(--blue)] mb-3">
//                       Click or drag photos here
//                     </p>
//                     <p className="text-lg text-[var(--blue)]/80">
//                       Up to 10 images • JPG, PNG
//                     </p>
//                   </div>
//                 </label>

//                 {previewUrls.length > 0 && (
//                   <div className="mb-10">
//                     <p className="text-lg font-medium text-[var(--blue)] mb-4 flex items-center gap-2">
//                       <FaImage /> New photos ({previewUrls.length})
//                     </p>
//                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
//                       {previewUrls.map((url, idx) => (
//                         <div 
//                           key={idx}
//                           className="relative group rounded-2xl overflow-hidden shadow-md border border-[var(--blue)]/10 hover:border-[var(--orange)] transition-all duration-200"
//                         >
//                           <Image
//                             src={url}
//                             alt={`preview ${idx + 1}`}
//                             width={400}
//                             height={400}
//                             className="object-cover w-full aspect-square"
//                           />
//                           <button
//                             onClick={() => removePreviewPhoto(idx)}
//                             className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-red-600 transition transform hover:scale-110"
//                           >
//                             <FaTimes size={18} />
//                           </button>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}

//                 <div className="mb-10">
//                   <label className="block text-lg font-medium text-[var(--blue)] mb-3">
//                     Progress Note (highly recommended)
//                   </label>
//                   <textarea
//                     value={note}
//                     onChange={e => setNote(e.target.value)}
//                     placeholder="Describe what you did today... (e.g., Installed all pipes, tested system, waiting for final inspection tomorrow...)"
//                     rows={4}
//                     className="w-full px-5 py-4 border border-[var(--blue)]/30 rounded-xl focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] resize-none bg-white text-[var(--blue)]"
//                   />
//                 </div>
//               </div>
//             )}

//             {/* Actions */}
//             <div className="pt-8 border-t border-[var(--blue)]/10">
//               {isCompleted ? (
//                 <div className="text-center py-10">
//                   <FaCheckCircle className="text-green-600 text-7xl mx-auto mb-6" />
//                   <h3 className="text-3xl font-bold text-green-700 mb-4">
//                     Job Submitted for Review
//                   </h3>
//                   <p className="text-xl text-green-700 mb-6 max-w-2xl mx-auto">
//                     Thank you! All photos and notes have been sent to the customer.
//                   </p>

//                   {job.completion_note && (
//                     <div className="bg-white p-6 rounded-xl border border-green-200 mb-8 max-w-3xl mx-auto">
//                       <p className="text-sm text-gray-500 mb-2 font-medium">Final Completion Note:</p>
//                       <p className="text-lg text-[var(--blue)] leading-relaxed whitespace-pre-wrap">
//                         {job.completion_note}
//                       </p>
//                     </div>
//                   )}

//                   {job.completed_at && (
//                     <p className="text-green-600 text-lg mb-8">
//                       Completed on: {new Date(job.completed_at).toLocaleString()}
//                     </p>
//                   )}

//                   <button
//                     onClick={() => router.push('/dashboard/artisan/jobs')}
//                     className="px-10 py-4 bg-[var(--orange)] text-white rounded-xl hover:bg-orange-700 transition font-bold shadow-lg text-lg"
//                   >
//                     Back to Active Jobs
//                   </button>
//                 </div>
//               ) : (
//                 <div className="flex flex-col sm:flex-row gap-5 justify-center">
//                   <button
//                     onClick={() => handleSubmit('ongoing')}
//                     disabled={submitting || (photos.length === 0 && !note.trim())}
//                     className={`flex-1 max-w-md py-5 px-8 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition shadow-lg ${
//                       submitting || (photos.length === 0 && !note.trim())
//                         ? 'bg-[var(--blue)]/50 cursor-not-allowed text-white'
//                         : 'bg-[var(--orange)] hover:bg-orange-600 text-white'
//                     }`}
//                   >
//                     {submitting && actionType === 'ongoing' && <FaSpinner className="animate-spin" />}
//                     Save Progress Update
//                   </button>

//                   <button
//                     onClick={() => handleSubmit('complete')}
//                     disabled={submitting}
//                     className={`flex-1 max-w-md py-5 px-8 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition shadow-lg ${
//                       submitting
//                         ? 'bg-[var(--blue)]/50 cursor-not-allowed text-white'
//                         : 'bg-green-600 hover:bg-green-700 text-white'
//                     }`}
//                   >
//                     {submitting && actionType === 'complete' && <FaSpinner className="animate-spin" />}
//                     <FaCheckCircle className="text-xl" />
//                     Mark Job as Complete
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Zoom Modal */}
//       {zoomedPhoto && (
//         <div 
//           className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
//           onClick={() => setZoomedPhoto(null)}
//         >
//           <button 
//             className="absolute top-6 right-6 text-white bg-black/60 p-5 rounded-full hover:bg-black/80 transition text-3xl"
//             onClick={() => setZoomedPhoto(null)}
//           >
//             <FaTimes />
//           </button>

//           <div className="relative max-w-[95vw] max-h-[95vh] w-full h-full flex items-center justify-center">
//             <Image
//               src={zoomedPhoto.url}
//               alt="Zoomed photo"
//               fill
//               className="object-contain"
//               quality={100}
//               priority
//             />

//             <button
//               onClick={(e) => {
//                 e.stopPropagation()
//                 handleDownload(zoomedPhoto.url, `${zoomedPhoto.type}-full.jpg`)
//               }}
//               className="absolute bottom-10 right-10 bg-[var(--orange)] text-white px-8 py-5 rounded-full shadow-2xl hover:bg-orange-700 transition flex items-center gap-4 text-xl font-bold"
//             >
//               <FaDownload /> Download Full Image
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }




'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  FaSpinner, FaCheckCircle, FaUpload, FaImage, FaCommentDots, 
  FaArrowLeft, FaInfoCircle, FaTimes, FaDownload,
  FaExclamationTriangle, FaExpand, FaTools, FaPlayCircle,
  FaUserTie,
  FaMapMarkerAlt, FaStop, FaPlay
} from 'react-icons/fa'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useLiveLocation } from '@/hooks/useLiveLocation'

const ArtisanLiveMap = dynamic(() => import('@/components/ArtisanLiveMap'), { 
  ssr: false 
})

interface Job {
  id: string
  title: string
  description: string
  status: string
  location: string
  assigned_artisan_id: string
  progress_photo_urls: string[]
  completion_photo_urls: string[]
  progress_notes: string[]
  completion_note: string | null
  completed_at: string | null
  customer: {
    first_name: string | null
    last_name: string | null
    phone: string | null
  } | null
}

export default function ArtisanActiveJob() {
  const params = useParams()
  const jobId = params.jobId as string
  const router = useRouter()

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [photos, setPhotos] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [actionType, setActionType] = useState<'ongoing' | 'complete' | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)

  // Location Sharing State
  const [isSharingLocation, setIsSharingLocation] = useState(false)

  const [zoomedPhoto, setZoomedPhoto] = useState<{ url: string; type: string } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Live Location Hook - Fixed property name
  useLiveLocation({ 
    jobRequestId: jobId || '', 
    isActive: isSharingLocation 
  })

  useEffect(() => {
    if (!jobId) {
      toast.error('Job ID missing')
      router.replace('/dashboard/artisan/active-jobs')
      return
    }
    fetchJob()
  }, [jobId, router])

  const fetchJob = async () => {
    if (!jobId) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }

      const { data, error } = await supabase
        .from('job_requests')
        .select(`
          id,
          title,
          description,
          status,
          location,
          assigned_artisan_id,
          progress_photo_urls,
          completion_photo_urls,
          progress_notes,
          completion_note,
          completed_at,
          customer:customer_id (first_name, last_name, phone)
        `)
        .eq('id', jobId)
        .eq('assigned_artisan_id', user.id)
        .single()

      if (error) throw error
      if (!data) throw new Error('Job not found or not assigned to you')

      const mappedJob: Job = {
        id: String(data.id ?? ''),
        title: String(data.title ?? 'Untitled Job'),
        description: String(data.description ?? ''),
        status: String(data.status ?? 'in_progress'),
        location: String(data.location ?? 'Not specified'),
        assigned_artisan_id: String(data.assigned_artisan_id ?? ''),
        progress_photo_urls: Array.isArray(data.progress_photo_urls) 
          ? data.progress_photo_urls.filter((u): u is string => typeof u === 'string')
          : [],
        completion_photo_urls: Array.isArray(data.completion_photo_urls) 
          ? data.completion_photo_urls.filter((u): u is string => typeof u === 'string')
          : [],
        progress_notes: (() => {
          if (!data.progress_notes) return []
          if (Array.isArray(data.progress_notes)) {
            return data.progress_notes.filter((n): n is string => typeof n === 'string')
          }
          if (typeof data.progress_notes === 'string') {
            try {
              const parsed = JSON.parse(data.progress_notes)
              return Array.isArray(parsed) ? parsed : []
            } catch {
              return []
            }
          }
          return []
        })(),
        completion_note: data.completion_note !== undefined ? String(data.completion_note ?? null) : null,
        completed_at: data.completed_at ?? null,
        customer: data.customer ? {
          first_name: (data.customer as any).first_name ?? null,
          last_name: (data.customer as any).last_name ?? null,
          phone: (data.customer as any).phone ?? null,
        } : null,
      }

      setJob(mappedJob)

      if (data.status === 'completed_pending_review' || data.status === 'completed') {
        setIsCompleted(true)
      } else {
        setIsCompleted(false)
      }
    } catch (err: any) {
      console.error('Fetch error:', err)
      toast.error(err.message || 'Failed to load job details')
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const toggleLocationSharing = () => {
    const newState = !isSharingLocation
    setIsSharingLocation(newState)
    toast.success(newState ? '✅ GPS Tracking Started' : '⏹ GPS Tracking Stopped')
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return

    const newFiles = Array.from(e.target.files)
    if (photos.length + newFiles.length > 10) {
      toast.error('Maximum 10 photos per update')
      return
    }

    const newPreviews = newFiles.map(file => URL.createObjectURL(file))
    setPreviewUrls(prev => [...prev, ...newPreviews])
    setPhotos(prev => [...prev, ...newFiles])
  }

  const removePreviewPhoto = (index: number) => {
    URL.revokeObjectURL(previewUrls[index])
    setPhotos(prev => prev.filter((_, i) => i !== index))
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  const handleDownload = async (url: string, filename = 'photo.jpg') => {
    try {
      const response = await fetch(url, { mode: 'cors' })
      if (!response.ok) throw new Error('Network response was not ok')
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
      toast.success('Download started!')
    } catch (err) {
      console.error('Download error:', err)
      toast.error('Failed to download. Try right-click → Save image as.')
    }
  }

  const handleSubmit = async (type: 'ongoing' | 'complete') => {
    if (type === 'complete' && photos.length === 0 && !note.trim()) {
      if (!confirm('No new photos or note added. Still mark as complete?')) return
    }

    if (type === 'ongoing' && photos.length === 0 && !note.trim()) {
      toast.error('Please add at least a photo or note for progress update')
      return
    }

    setSubmitting(true)
    setActionType(type)

    try {
      const newPhotoUrls: string[] = []

      if (photos.length > 0) {
        for (const file of photos) {
          const ext = file.name.split('.').pop() || 'jpg'
          const path = `progress/${jobId}/${Date.now()}.${ext}`

          const { error: uploadError } = await supabase.storage
            .from('job-progress-photos')
            .upload(path, file)

          if (uploadError) throw uploadError

          const { data } = supabase.storage.from('job-progress-photos').getPublicUrl(path)
          newPhotoUrls.push(data.publicUrl)
        }
      }

      const currentProgress = job?.progress_photo_urls || []
      const updatedProgress = type === 'ongoing' 
        ? [...currentProgress, ...newPhotoUrls]
        : currentProgress

      const updateData: any = {
        updated_at: new Date().toISOString(),
        progress_photo_urls: updatedProgress,
      }

      if (type === 'ongoing' && note.trim()) {
        const currentNotes = Array.isArray(job?.progress_notes)
          ? job.progress_notes
          : []
        const timestamp = new Date().toLocaleString('en-NG', {
          dateStyle: 'medium',
          timeStyle: 'short'
        })
        const newNoteEntry = `${timestamp}: ${note.trim()}`
        updateData.progress_notes = [...currentNotes, newNoteEntry]
      }

      if (type === 'complete') {
        updateData.status = 'completed_pending_review'
        updateData.completion_photo_urls = newPhotoUrls.length > 0 ? newPhotoUrls : null
        updateData.completed_at = new Date().toISOString()
        if (note.trim()) {
          updateData.completion_note = note.trim()
        }
      }

      const { error } = await supabase
        .from('job_requests')
        .update(updateData)
        .eq('id', jobId)

      if (error) throw error

      toast.success(
        type === 'complete'
          ? 'Job submitted for review!'
          : 'Progress saved (photos & note)!'
      )

      previewUrls.forEach(url => URL.revokeObjectURL(url))
      setPhotos([])
      setPreviewUrls([])
      setNote('')

      await fetchJob()

      if (type === 'complete') {
        setIsCompleted(true)
      }
    } catch (err: any) {
      console.error('Submit error:', err)
      toast.error(err.message || 'Failed to submit update')
    } finally {
      setSubmitting(false)
      setActionType(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--white)]">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-[var(--orange)] border-opacity-70 shadow-md"></div>
          <div className="absolute inset-0 flex items-center justify-center animate-pulse-slow">
            <div className="bg-[var(--white)] rounded-full p-2 shadow-sm">
              <Image src="/log.png" width={48} height={48} priority alt="Loading..." className="object-contain" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--white)]">
        <div className="text-center max-w-md p-8 bg-[var(--white)] rounded-2xl shadow-lg border border-[var(--blue)]/20">
          <FaExclamationTriangle className="text-[var(--orange)] text-6xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[var(--blue)] mb-3">Job not found</h2>
          <p className="text-[var(--blue)] mb-6">
            This job may no longer be active or you don't have access.
          </p>
          <button
            onClick={() => router.push('/dashboard/artisan/active-jobs')}
            className="px-6 py-3 bg-[var(--orange)] text-[var(--white)] rounded-xl hover:bg-orange-600 transition font-medium"
          >
            Back to Active Jobs
          </button>
        </div>
      </div>
    )
  }

  const allUploadedPhotos = [
    ...(job.progress_photo_urls || []).map((url: string) => ({ url, type: 'progress' })),
    ...(job.completion_photo_urls || []).map((url: string) => ({ url, type: 'completion' })),
  ]

  return (
    <div className="min-h-screen bg-[var(--white)] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <button
            onClick={() => router.push('/dashboard/artisan/jobs')}
            className="flex items-center gap-2 text-[var(--blue)] hover:text-[var(--orange)] transition font-medium text-lg"
          >
            <FaArrowLeft /> Back to Active Jobs
          </button>

          <Link
            href={`/dashboard/artisan/messages?jobId=${jobId}`}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--blue)] hover:bg-blue-700 text-[var(--white)] rounded-xl transition shadow-md font-medium"
          >
            <FaCommentDots /> Chat with Customer/Admin
          </Link>
        </div>

        {/* ==================== LIVE LOCATION MAP ==================== */}
        {!isCompleted && (
          <div className="mb-10 bg-white rounded-3xl shadow-xl border border-[var(--blue)]/10 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaMapMarkerAlt className="text-[var(--orange)] text-2xl" />
                <h3 className="font-semibold text-lg">Live Location Sharing</h3>
              </div>
              <button
                onClick={() => setIsSharingLocation(!isSharingLocation)}
                className={`px-6 py-3 rounded-2xl font-medium flex items-center gap-3 transition-all ${
                  isSharingLocation 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isSharingLocation ? <FaStop /> : <FaPlay />}
                {isSharingLocation ? 'Stop GPS' : 'Start GPS Sharing'}
              </button>
            </div>
            <div className="h-[420px]">
              <ArtisanLiveMap jobRequestId={jobId} isVisible={isSharingLocation} />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-[var(--white)] rounded-2xl shadow-xl border border-[var(--blue)]/10 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[var(--blue)] to-blue-800 text-[var(--white)] p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold">{job.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm opacity-90">
              <div className="flex items-center gap-2">
                <FaUserTie />
                Customer: {job.customer?.first_name ?? ''} {job.customer?.last_name ?? ''}
              </div>
              {job.customer?.phone && (
                <div className="flex items-center gap-2">
                  <span>•</span> {job.customer.phone}
                </div>
              )}
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt />
                {job.location || 'Location not specified'}
              </div>
            </div>
          </div>

          {/* Guide */}
          {!isCompleted && (
            <div className="p-6 sm:p-8 bg-gradient-to-b from-gray-50 to-white border-b border-[var(--blue)]/10">
              <div className="flex items-start gap-4">
                <div className="text-[var(--orange)] text-5xl mt-1 flex-shrink-0">
                  <FaInfoCircle />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--blue)] mb-4">
                    How This Active Workspace Works
                  </h2>
                  <ul className="space-y-3 text-[var(--blue)] text-base">
                    <li className="flex items-start gap-3">
                      <FaTools className="text-[var(--orange)] mt-1.5 flex-shrink-0" />
                      <span>Upload clear photos of your work as you go</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <FaCommentDots className="text-[var(--orange)] mt-1.5 flex-shrink-0" />
                      <span>Add notes describing progress — saved with timestamps</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <FaPlayCircle className="text-[var(--orange)] mt-1.5 flex-shrink-0" />
                      <span>"Save Progress" updates without finishing</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <FaCheckCircle className="text-[var(--orange)] mt-1.5 flex-shrink-0" />
                      <span>"Mark as Complete" submits for customer review</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Completion Success */}
          {isCompleted && (
            <div className="bg-green-50 border-l-4 border-green-500 p-8 mx-6 mt-8 rounded-r-xl">
              <div className="flex items-start gap-5">
                <FaCheckCircle className="text-green-600 text-6xl mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-3xl font-bold text-green-800 mb-3">
                    Job Submitted for Review!
                  </h3>
                  <p className="text-green-700 text-xl mb-4">
                    Thank you! All photos and notes have been sent to the customer.
                  </p>

                  {job.completion_note && (
                    <div className="bg-white p-5 rounded-xl border border-green-200 mb-6">
                      <p className="text-sm text-gray-500 mb-2 font-medium">Final Completion Note:</p>
                      <p className="text-lg text-[var(--blue)] leading-relaxed whitespace-pre-wrap">
                        {job.completion_note}
                      </p>
                    </div>
                  )}

                  {job.completed_at && (
                    <p className="text-green-600 text-lg mb-8">
                      Completed on: {new Date(job.completed_at).toLocaleString()}
                    </p>
                  )}

                  <button
                    onClick={() => router.push('/dashboard/artisan/jobs')}
                    className="px-10 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-bold shadow-lg text-lg"
                  >
                    Back to Active Jobs
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="p-6 sm:p-8 space-y-12">
            {/* Photos Gallery */}
            <div className="bg-gradient-to-b from-gray-50 to-white p-6 rounded-2xl border border-[var(--blue)]/10 shadow-inner">
              <h3 className="text-2xl font-bold text-[var(--blue)] mb-6 flex items-center gap-3">
                <FaImage className="text-[var(--orange)] text-3xl" />
                Your Uploaded Photos
              </h3>

              {allUploadedPhotos.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-[var(--blue)]/30">
                  <FaImage className="mx-auto text-7xl text-gray-300 mb-4" />
                  <p className="text-2xl font-medium text-[var(--blue)]">No photos yet</p>
                  <p className="text-lg text-[var(--blue)]/80 mt-2">
                    {!isCompleted 
                      ? 'Upload progress photos above — they appear here after saving.'
                      : 'Completed without additional photos.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                  {allUploadedPhotos.map(({ url, type }, idx) => (
                    <div 
                      key={url}
                      className="group relative rounded-2xl overflow-hidden shadow-lg border border-gray-200 hover:border-[var(--orange)] hover:shadow-2xl transition-all duration-300 bg-white"
                    >
                      <div 
                        className="relative cursor-zoom-in aspect-square"
                        onClick={() => setZoomedPhoto({ url, type })}
                      >
                        <Image
                          src={url}
                          alt={`${type} photo ${idx + 1}`}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <FaExpand className="text-white text-5xl drop-shadow-2xl" />
                        </div>
                      </div>

                      <div className="absolute top-3 left-3">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full shadow-md ${
                          type === 'progress' ? 'bg-[var(--orange)] text-white' : 'bg-green-600 text-white'
                        }`}>
                          {type === 'progress' ? 'Progress' : 'Completion'}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDownload(url, `${type}-photo-${idx + 1}.jpg`)}
                        className="absolute bottom-3 right-3 bg-[var(--orange)] text-white p-3 rounded-full shadow-lg hover:bg-orange-700 transition transform hover:scale-110 active:scale-95"
                        title="Download"
                      >
                        <FaDownload size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Progress Notes History */}
            <div className="bg-gradient-to-b from-gray-50 to-white p-6 rounded-2xl border border-[var(--blue)]/10 shadow-inner">
              <h3 className="text-2xl font-bold text-[var(--blue)] mb-6 flex items-center gap-3">
                <FaCommentDots className="text-[var(--orange)] text-3xl" />
                Progress Notes History
              </h3>

              {job?.progress_notes?.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {job.progress_notes.map((noteEntry: string, idx: number) => (
                    <div 
                      key={idx}
                      className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-[var(--orange)] transition"
                    >
                      <p className="text-sm text-gray-500 mb-2 font-medium">
                        {noteEntry.split(': ')[0]}
                      </p>
                      <p className="text-[var(--blue)] leading-relaxed">
                        {noteEntry.split(': ').slice(1).join(': ')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-[var(--blue)]/30">
                  <FaCommentDots className="mx-auto text-6xl text-gray-300 mb-4" />
                  <p className="text-xl font-medium text-[var(--blue)]">
                    No progress notes yet
                  </p>
                  <p className="text-lg text-[var(--blue)]/80 mt-2">
                    {!isCompleted 
                      ? 'Add a note when saving progress — it will appear here with timestamp.'
                      : 'No notes were added during this job.'}
                  </p>
                </div>
              )}
            </div>

            {/* Upload & Note Section */}
            {!isCompleted && (
              <div className="bg-gradient-to-b from-gray-50 to-white p-6 rounded-2xl border border-[var(--blue)]/10 shadow-inner">
                <h3 className="text-2xl font-bold text-[var(--blue)] mb-6 flex items-center gap-3">
                  <FaUpload className="text-[var(--orange)]" />
                  Add New Progress Update
                </h3>

                <label className="block mb-8 cursor-pointer">
                  <div className="border-3 border-dashed border-[var(--blue)]/40 rounded-2xl p-12 sm:p-16 text-center hover:border-[var(--orange)] hover:bg-[var(--orange)]/5 transition-all duration-300">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                    <div className="mx-auto w-24 h-24 rounded-full bg-[var(--orange)]/10 flex items-center justify-center mb-5">
                      <FaUpload className="text-[var(--orange)] text-5xl" />
                    </div>
                    <p className="text-2xl font-medium text-[var(--blue)] mb-3">
                      Click or drag photos here
                    </p>
                    <p className="text-lg text-[var(--blue)]/80">
                      Up to 10 images • JPG, PNG
                    </p>
                  </div>
                </label>

                {previewUrls.length > 0 && (
                  <div className="mb-10">
                    <p className="text-lg font-medium text-[var(--blue)] mb-4 flex items-center gap-2">
                      <FaImage /> New photos ({previewUrls.length})
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                      {previewUrls.map((url, idx) => (
                        <div 
                          key={idx}
                          className="relative group rounded-2xl overflow-hidden shadow-md border border-[var(--blue)]/10 hover:border-[var(--orange)] transition-all duration-200"
                        >
                          <Image
                            src={url}
                            alt={`preview ${idx + 1}`}
                            width={400}
                            height={400}
                            className="object-cover w-full aspect-square"
                          />
                          <button
                            onClick={() => removePreviewPhoto(idx)}
                            className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-red-600 transition transform hover:scale-110"
                          >
                            <FaTimes size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-10">
                  <label className="block text-lg font-medium text-[var(--blue)] mb-3">
                    Progress Note (highly recommended)
                  </label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Describe what you did today... (e.g., Installed all pipes, tested system, waiting for final inspection tomorrow...)"
                    rows={4}
                    className="w-full px-5 py-4 border border-[var(--blue)]/30 rounded-xl focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] resize-none bg-white text-[var(--blue)]"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-8 border-t border-[var(--blue)]/10">
              {isCompleted ? (
                <div className="text-center py-10">
                  <FaCheckCircle className="text-green-600 text-7xl mx-auto mb-6" />
                  <h3 className="text-3xl font-bold text-green-700 mb-4">
                    Job Submitted for Review
                  </h3>
                  <p className="text-xl text-green-700 mb-6 max-w-2xl mx-auto">
                    Thank you! All photos and notes have been sent to the customer.
                  </p>

                  {job.completion_note && (
                    <div className="bg-white p-6 rounded-xl border border-green-200 mb-8 max-w-3xl mx-auto">
                      <p className="text-sm text-gray-500 mb-2 font-medium">Final Completion Note:</p>
                      <p className="text-lg text-[var(--blue)] leading-relaxed whitespace-pre-wrap">
                        {job.completion_note}
                      </p>
                    </div>
                  )}

                  {job.completed_at && (
                    <p className="text-green-600 text-lg mb-8">
                      Completed on: {new Date(job.completed_at).toLocaleString()}
                    </p>
                  )}

                  <button
                    onClick={() => router.push('/dashboard/artisan/jobs')}
                    className="px-10 py-4 bg-[var(--orange)] text-white rounded-xl hover:bg-orange-700 transition font-bold shadow-lg text-lg"
                  >
                    Back to Active Jobs
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-5 justify-center">
                  <button
                    onClick={() => handleSubmit('ongoing')}
                    disabled={submitting || (photos.length === 0 && !note.trim())}
                    className={`flex-1 max-w-md py-5 px-8 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition shadow-lg ${
                      submitting || (photos.length === 0 && !note.trim())
                        ? 'bg-[var(--blue)]/50 cursor-not-allowed text-white'
                        : 'bg-[var(--orange)] hover:bg-orange-600 text-white'
                    }`}
                  >
                    {submitting && actionType === 'ongoing' && <FaSpinner className="animate-spin" />}
                    Save Progress Update
                  </button>

                  <button
                    onClick={() => handleSubmit('complete')}
                    disabled={submitting}
                    className={`flex-1 max-w-md py-5 px-8 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition shadow-lg ${
                      submitting
                        ? 'bg-[var(--blue)]/50 cursor-not-allowed text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {submitting && actionType === 'complete' && <FaSpinner className="animate-spin" />}
                    <FaCheckCircle className="text-xl" />
                    Mark Job as Complete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Zoom Modal */}
      {zoomedPhoto && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setZoomedPhoto(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white bg-black/60 p-5 rounded-full hover:bg-black/80 transition text-3xl"
            onClick={() => setZoomedPhoto(null)}
          >
            <FaTimes />
          </button>

          <div className="relative max-w-[95vw] max-h-[95vh] w-full h-full flex items-center justify-center">
            <Image
              src={zoomedPhoto.url}
              alt="Zoomed photo"
              fill
              className="object-contain"
              quality={100}
              priority
            />

            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDownload(zoomedPhoto.url, `${zoomedPhoto.type}-full.jpg`)
              }}
              className="absolute bottom-10 right-10 bg-[var(--orange)] text-white px-8 py-5 rounded-full shadow-2xl hover:bg-orange-700 transition flex items-center gap-4 text-xl font-bold"
            >
              <FaDownload /> Download Full Image
            </button>
          </div>
        </div>
      )}
    </div>
  )
}