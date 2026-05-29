// 'use client'

// import { useState, useEffect } from 'react'
// import { supabase } from '@/lib/supabase'
// import toast from 'react-hot-toast'
// import { 
//   FaSpinner, 
//   FaExclamationTriangle, 
//   FaCheckCircle, 
//   FaTimesCircle, 
//   FaUserTie, 
//   FaMapMarkerAlt, 
//   FaDollarSign, 
//   FaClock, 
//   FaRedo,
//   FaHourglassHalf,
//   FaUserCheck,
//   FaTrashAlt,
//   FaEye,
//   FaCommentDots,
//   FaHistory,
//   FaStar
// } from 'react-icons/fa'
// import Link from 'next/link'
// import Image from 'next/image'
// import CustomerArtisanTracker from '@/components/CustomerArtisanTracker'

// interface CustomerRequest {
//   id: string
//   title: string
//   description: string
//   budget_min: number | null
//   budget_max: number | null
//   location: string
//   area: string
//   preferred_date: string | null
//   preferred_time: string | null
//   status: string
//   created_at: string
//   assigned_artisan: {
//     first_name: string | null
//     last_name: string | null
//     primary_skill: string | null
//   } | null
//   status_logs?: { status: string; changed_at: string; notes?: string | null }[]
// }

// export default function MyRequestsPage() {
//   const [requests, setRequests] = useState<CustomerRequest[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)
//   const [selectedRequest, setSelectedRequest] = useState<CustomerRequest | null>(null)
//   const [cancelling, setCancelling] = useState<string | null>(null)
//   const [cancelModalOpen, setCancelModalOpen] = useState<string | null>(null)
//   const [cancelReason, setCancelReason] = useState('')

//   useEffect(() => {
//     fetchMyRequests()
//   }, [])

//   const fetchMyRequests = async () => {
//     setLoading(true)
//     setError(null)

//     try {
//       const { data: { user } } = await supabase.auth.getUser()
//       if (!user) {
//         toast.error('Please sign in')
//         return
//       }

//       const { data, error } = await supabase
//         .from('job_requests')
//         .select(`
//           id,
//           title,
//           description,
//           budget_min,
//           budget_max,
//           location,
//           area,
//           preferred_date,
//           preferred_time,
//           status,
//           created_at,
//           assigned_artisan:assigned_artisan_id (first_name, last_name, primary_skill),
//           status_logs:request_status_logs (status, changed_at, notes)
//         `)
//         .eq('customer_id', user.id)
//         .order('created_at', { ascending: false })

//       if (error) throw error

//       const typedRequests: CustomerRequest[] = (data || []).map((item: any) => ({
//         id: item.id || '',
//         title: item.title || '',
//         description: item.description || '',
//         budget_min: item.budget_min ?? null,
//         budget_max: item.budget_max ?? null,
//         location: item.location || '',
//         area: item.area || '',
//         preferred_date: item.preferred_date ?? null,
//         preferred_time: item.preferred_time ?? null,
//         status: item.status || 'pending',
//         created_at: item.created_at || '',
//         assigned_artisan: item.assigned_artisan
//           ? {
//               first_name: item.assigned_artisan.first_name ?? null,
//               last_name: item.assigned_artisan.last_name ?? null,
//               primary_skill: item.assigned_artisan.primary_skill ?? null,
//             }
//           : null,
//         status_logs: item.status_logs || [],
//       }))

//       setRequests(typedRequests)
//     } catch (err: any) {
//       console.error('Fetch error:', err)
//       setError(err.message || 'Failed to load your requests')
//       toast.error('Failed to load requests')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleCancel = async (requestId: string) => {
//     if (!cancelReason.trim()) {
//       toast.error('Please provide a reason for cancelling')
//       return
//     }

//     setCancelling(requestId)

//     try {
//       const { error } = await supabase
//         .from('job_requests')
//         .update({
//           status: 'cancelled',
//           updated_at: new Date().toISOString(),
//         })
//         .eq('id', requestId)
//         .eq('status', 'pending')

//       if (error) throw error

//       await supabase
//         .from('request_status_logs')
//         .insert({
//           request_id: requestId,
//           status: 'cancelled',
//           changed_by: (await supabase.auth.getUser()).data.user?.id,
//           notes: `Cancelled by customer: ${cancelReason.trim()}`,
//         })

//       toast.success('Request cancelled successfully')
//       setCancelModalOpen(null)
//       setCancelReason('')
//       fetchMyRequests()
//     } catch (err: any) {
//       toast.error(err.message || 'Failed to cancel request')
//     } finally {
//       setCancelling(null)
//     }
//   }

//   const getEstimatedTimeRemaining = (createdAt: string) => {
//     const created = new Date(createdAt)
//     const now = new Date()
//     const diffMs = now.getTime() - created.getTime()
//     const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

//     if (diffHours < 1) return 'Just submitted'
//     if (diffHours < 24) return `Submitted ${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
//     const days = Math.floor(diffHours / 24)
//     return `Submitted ${days} day${days === 1 ? '' : 's'} ago`
//   }

//   const getStatusBadge = (status?: string) => {
//     const s = status || 'unknown'
//     const base = 'inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm'
//     switch (s) {
//       case 'pending':
//         return <span className={`${base} bg-yellow-100 text-yellow-800 border border-yellow-200`}><FaHourglassHalf className="mr-1.5" /> Pending Review</span>
//       case 'assigned':
//         return <span className={`${base} bg-blue-100 text-blue-800 border border-blue-200`}><FaUserCheck className="mr-1.5" /> Assigned</span>
//       case 'in_progress':
//         return <span className={`${base} bg-purple-100 text-purple-800 border border-purple-200`}>In Progress</span>
//       case 'completed_pending_review':
//         return <span className={`${base} bg-green-100 text-green-800 border border-green-200 animate-pulse`}><FaStar className="mr-1.5" /> Ready for Review</span>
//       case 'completed':
//         return <span className={`${base} bg-green-100 text-green-800 border border-green-200`}><FaCheckCircle className="mr-1.5" /> Completed</span>
//       case 'cancelled':
//         return <span className={`${base} bg-gray-100 text-gray-700 border border-gray-200`}><FaTimesCircle className="mr-1.5" /> Cancelled</span>
//       default:
//         return <span className={`${base} bg-gray-100 text-gray-700 border border-gray-200`}>{s}</span>
//     }
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-6xl mx-auto space-y-8">
//         {/* Header */}
//         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//           <div>
//             <h1 className="text-3xl sm:text-4xl font-bold text-[var(--blue)] tracking-tight">
//               My Requests
//             </h1>
//             <p className="mt-2 text-gray-600 text-lg">
//               Track all your service requests in one place
//             </p>
//           </div>

//           <button
//             onClick={fetchMyRequests}
//             disabled={loading}
//             className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--orange)] hover:bg-orange-600 text-white font-medium rounded-xl transition disabled:opacity-60 shadow-md hover:shadow-lg"
//           >
//             <FaRedo className={loading ? 'animate-spin' : ''} />
//             Refresh
//           </button>
//         </div>

//         {/* Loading */}
//         {loading && (
//           <div className="min-h-screen flex items-center justify-center bg-[var(--white)]">
//             <div className="relative flex items-center justify-center">
//               <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-[var(--orange)] border-opacity-70 shadow-md"></div>
//               <div className="absolute inset-0 flex items-center justify-center animate-pulse-slow">
//                 <div className="bg-[var(--white)] rounded-full p-2 shadow-sm">
//                   <Image src="/log.png" width={48} height={48} priority alt="Loading..." className="object-contain" />
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Error */}
//         {error && !loading && (
//           <div className="bg-red-50 border border-red-200 rounded-2xl p-10 text-center shadow-inner">
//             <FaExclamationTriangle className="text-red-500 text-7xl mx-auto mb-6" />
//             <h3 className="text-2xl font-bold text-red-800 mb-3">
//               Oops! Something went wrong
//             </h3>
//             <p className="text-red-700 mb-8 text-lg">{error}</p>
//             <button
//               onClick={fetchMyRequests}
//               className="px-10 py-4 bg-red-600 hover:bg-red-700 text-white font-medium text-lg rounded-xl transition shadow-md"
//             >
//               Try Again
//             </button>
//           </div>
//         )}

//         {/* Content */}
//         {!loading && !error && (
//           <>
//             {requests.length === 0 ? (
//               <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-16 text-center">
//                 <FaExclamationTriangle className="text-[var(--orange)] text-8xl mx-auto mb-8 opacity-70" />
//                 <h3 className="text-3xl font-bold text-[var(--blue)] mb-4">
//                   No requests yet
//                 </h3>
//                 <p className="text-gray-600 text-xl mb-10 max-w-2xl mx-auto">
//                   When you request a service from an artisan, it will appear here with real-time status updates.
//                 </p>
//                 <Link
//                   href="/dashboard/customer/find-artisans"
//                   className="inline-flex items-center gap-3 px-10 py-5 bg-[var(--orange)] hover:bg-orange-600 text-white font-bold text-lg rounded-2xl transition shadow-xl hover:shadow-2xl"
//                 >
//                   Find an Artisan Now →
//                 </Link>
//               </div>
//             ) : (
//               <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
//                 {requests.map((req) => (
//                   <div
//                     key={req.id}
//                     onClick={() => setSelectedRequest(req)}
//                     className="group bg-white rounded-3xl shadow-md border border-gray-200 overflow-hidden hover:shadow-2xl hover:border-[var(--orange)]/40 transition-all duration-300 cursor-pointer"
//                   >
//                     {/* Card Header */}
//                     <div className="bg-gradient-to-r from-[var(--blue)] to-blue-900 px-6 py-5 text-white">
//                       <h3 className="font-bold text-xl line-clamp-1 group-hover:text-[var(--orange)] transition-colors">
//                         {req.title}
//                       </h3>
//                       <p className="text-sm opacity-90 mt-1">
//                         {new Date(req.created_at).toLocaleDateString()} • {getEstimatedTimeRemaining(req.created_at)}
//                       </p>
//                     </div>

//                     {/* Status */}
//                     <div className="px-6 pt-5 pb-2">
//                       {getStatusBadge(req.status)}
//                     </div>

//                     {/* Content */}
//                     <div className="px-6 pb-6 space-y-4">
//                       <p className="text-gray-700 line-clamp-3 text-sm leading-relaxed">
//                         {req.description}
//                       </p>

//                       <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
//                         <div className="flex items-center gap-2">
//                           {/* <FaDollarSign className="text-[var(--orange)] text-lg" /> */}
//                           {/* <span className="font-medium">
//                             {req.budget_min ? `₦${req.budget_min.toLocaleString()}` : '—'}
//                             {req.budget_max ? ` – ₦${req.budget_max.toLocaleString()}` : ''}
//                           </span> */}
//                           <FaMapMarkerAlt className="text-[var(--orange)] text-lg" />
//                           <span className="truncate font-medium">Area: {req.area || 'Not specified'}</span>
//                         </div>

//                         <div className="flex items-center gap-2">
//                           <FaMapMarkerAlt className="text-[var(--orange)] text-lg" />
//                           <span className="truncate font-medium">LGA: {req.location || 'Not specified'}</span>
//                         </div>

//                         <div className="flex items-center gap-2 col-span-2">
//                           <FaClock className="text-[var(--orange)] text-lg" />
//                           <span className="font-medium">
//                             Preferred Date: {req.preferred_date || 'Flexible'} 
//                           </span>
//                           <span className="font-medium">
//                             Preferred Time: {req.preferred_time ? `${req.preferred_time}` : ''}
//                           </span>
//                         </div>
//                       </div>

//                       {/* Assigned Artisan */}
//                       {req.assigned_artisan && (
//                         <div className="pt-4 border-t border-gray-100">
//                           <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
//                             <FaUserCheck className="text-[var(--orange)]" />
//                             Assigned Artisan
//                           </p>
//                           <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
//                             <div className="w-12 h-12 rounded-full bg-[var(--orange)]/10 flex items-center justify-center">
//                               <FaUserTie className="text-[var(--orange)] text-xl" />
//                             </div>
//                             <div>
//                               <p className="font-medium text-gray-900">
//                                 {req.assigned_artisan.first_name} {req.assigned_artisan.last_name}
//                               </p>
//                               <p className="text-xs text-gray-600">
//                                 {req.assigned_artisan.primary_skill || 'Professional Artisan'}
//                               </p>
//                             </div>
//                           </div>
//                         </div>
//                       )}
//                     </div>

//                     {/* Footer Actions */}
//                     <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
//                       <button
//                         onClick={(e) => {
//                           e.stopPropagation()
//                           setSelectedRequest(req)
//                         }}
//                         className="text-[var(--blue)] hover:text-[var(--orange)] font-medium flex items-center gap-2 transition"
//                       >
//                         <FaEye />
//                         View Details
//                       </button>

//                       {/* Make Payment button - appears when artisan is assigned and job is in progress */}
//                       {req.assigned_artisan && req.status === 'in_progress' && (
//                         <Link
//                           href={`/dashboard/customer/payment/${req.id}`}
//                           onClick={(e) => e.stopPropagation()}
//                           className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-xl transition shadow-md hover:shadow-lg"
//                         >
//                           <FaDollarSign />
//                           Make Payment
//                         </Link>
//                       )}

//                       {req.status === 'completed_pending_review' && (
//                         <Link
//                           href={`/dashboard/customer/jobs/${req.id}/review`}
//                           onClick={(e) => e.stopPropagation()}
//                           className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition shadow-md"
//                         >
//                           <FaStar />
//                           Review & Confirm
//                         </Link>
//                       )}

//                       {req.status === 'pending' && (
//                         <button
//                           onClick={(e) => {
//                             e.stopPropagation()
//                             setCancelModalOpen(req.id)
//                           }}
//                           disabled={cancelling === req.id}
//                           className="text-red-600 hover:text-red-700 font-medium flex items-center gap-2 transition disabled:opacity-50"
//                         >
//                           {cancelling === req.id ? (
//                             <FaSpinner className="animate-spin" />
//                           ) : (
//                             <FaTrashAlt />
//                           )}
//                           Cancel Request
//                         </button>
//                       )}

//                       <Link
//                         href="/dashboard/customer/messages"
//                         onClick={(e) => e.stopPropagation()}
//                         className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--blue)] hover:bg-blue-700 text-white font-medium rounded-xl transition shadow-md"
//                       >
//                         <FaCommentDots />
//                         Chat with Admin
//                       </Link>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </>
//         )}

//         {/* Full Details Modal */}
//         {selectedRequest && (
//           <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
//             <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
//               {/* Modal Header */}
//               <div className="sticky top-0 bg-gradient-to-r from-[var(--blue)] to-blue-900 text-white px-8 py-6 rounded-t-3xl z-10">
//                 <div className="flex items-center justify-between">
//                   <h2 className="text-2xl font-bold">
//                     {selectedRequest.title}
//                   </h2>
//                   <button
//                     onClick={() => setSelectedRequest(null)}
//                     className="text-white hover:text-[var(--orange)] text-3xl leading-none"
//                   >
//                     ×
//                   </button>
//                 </div>
//                 <p className="mt-2 opacity-90">
//                   Submitted {new Date(selectedRequest.created_at).toLocaleString()}
//                 </p>
//               </div>

//               {/* Modal Body */}
//               <div className="p-8 space-y-8">
//                 <div>
//                   <h3 className="text-lg font-semibold text-[var(--blue)] mb-3 flex items-center gap-2">
//                     <FaHourglassHalf className="text-[var(--orange)]" />
//                     Status
//                   </h3>
//                   <div className="inline-block">
//                     {getStatusBadge(selectedRequest.status)}
//                   </div>
//                 </div>
//                 <CustomerArtisanTracker jobRequestId={jobRequestId} />

//                 {/* Make Payment button in modal */}
//                 {selectedRequest.assigned_artisan && selectedRequest.status === 'in_progress' && (
//                   <div className="pt-4">
//                     <Link
//                       href={`/dashboard/customer/payment/${selectedRequest.id}`}
//                       className="inline-flex items-center justify-center gap-3 w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-lg rounded-2xl transition shadow-lg hover:shadow-xl"
//                     >
//                       <FaDollarSign size={20} />
//                       Proceed to Payment
//                     </Link>
//                     <p className="text-center text-sm text-gray-500 mt-3">
//                       Secure payment via Flutterwave
//                     </p>
//                   </div>
//                 )}

//                 {selectedRequest.status === 'completed_pending_review' && (
//                   <div className="pt-4">
//                     <Link
//                       href={`/dashboard/customer/jobs/${selectedRequest.id}/review`}
//                       className="inline-flex items-center justify-center gap-3 w-full py-4 px-6 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-2xl transition shadow-lg"
//                     >
//                       <FaStar size={20} />
//                       Review & Confirm Job
//                     </Link>
//                   </div>
//                 )}

//                 <div>
//                   <h3 className="text-lg font-semibold text-[var(--blue)] mb-3">
//                     Description
//                   </h3>
//                   <p className="text-gray-700 whitespace-pre-line leading-relaxed">
//                     {selectedRequest.description}
//                   </p>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   {/* <div className="bg-gray-50 p-5 rounded-2xl">
//                     <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
//                       <FaDollarSign className="text-[var(--orange)]" />
//                       Budget
//                     </h4>
//                     <p className="text-xl font-bold text-gray-900">
//                       {selectedRequest.budget_min ? `₦${selectedRequest.budget_min.toLocaleString()}` : '—'}
//                       {selectedRequest.budget_max ? ` – ₦${selectedRequest.budget_max.toLocaleString()}` : ''}
//                     </p>
//                   </div> */}

//                   <div className="bg-gray-50 p-5 rounded-2xl">
//                     <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
//                       <FaMapMarkerAlt className="text-[var(--orange)]" />
//                       Location
//                     </h4>
//                     <p className="text-gray-900 font-medium">
//                       {selectedRequest.location || 'Not specified'}
//                     </p>
//                   </div>

//                   <div className="bg-gray-50 p-5 rounded-2xl col-span-2 md:col-span-1">
//                     <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
//                       <FaClock className="text-[var(--orange)]" />
//                       Preferred Time
//                     </h4>
//                     <p className="text-gray-900 font-medium">
//                       {selectedRequest.preferred_date || 'Flexible'}
//                       {selectedRequest.preferred_time && ` • ${selectedRequest.preferred_time}`}
//                     </p>
//                   </div>
//                 </div>

//                 {selectedRequest.assigned_artisan && (
//                   <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
//                     <h3 className="text-lg font-semibold text-[var(--blue)] mb-4 flex items-center gap-2">
//                       <FaUserCheck className="text-[var(--orange)]" />
//                       Assigned Artisan
//                     </h3>
//                     <div className="flex items-center gap-4">
//                       <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
//                         <FaUserTie className="text-blue-600 text-2xl" />
//                       </div>
//                       <div>
//                         <p className="font-bold text-xl text-gray-900">
//                           {selectedRequest.assigned_artisan.first_name} {selectedRequest.assigned_artisan.last_name}
//                         </p>
//                         <p className="text-gray-700">
//                           {selectedRequest.assigned_artisan.primary_skill || 'Professional Artisan'}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {selectedRequest.status_logs && selectedRequest.status_logs.length > 0 && (
//                   <div>
//                     <h3 className="text-lg font-semibold text-[var(--blue)] mb-4 flex items-center gap-2">
//                       <FaHistory className="text-[var(--orange)]" />
//                       Request History
//                     </h3>
//                     <div className="space-y-3 bg-gray-50 p-5 rounded-2xl">
//                       {selectedRequest.status_logs.map((log, index) => (
//                         <div key={index} className="flex justify-between items-center text-sm">
//                           <div>
//                             <span className="font-medium capitalize">{log.status}</span>
//                             {log.notes && <span className="text-gray-500 ml-2">({log.notes})</span>}
//                           </div>
//                           <span className="text-gray-500">
//                             {new Date(log.changed_at).toLocaleString()}
//                           </span>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}

//                 {/* Chat button in modal */}
//                 <div className="pt-6">
//                   <Link
//                     href="/dashboard/customer/messages"
//                     className="inline-flex items-center justify-center gap-3 w-full py-4 px-6 bg-[var(--blue)] hover:bg-blue-700 text-white font-bold text-lg rounded-2xl transition shadow-lg hover:shadow-xl"
//                   >
//                     <FaCommentDots size={20} />
//                     Chat with Admin
//                   </Link>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Cancel Reason Modal */}
//         {cancelModalOpen && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//             <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
//               <h3 className="text-xl font-bold text-[var(--blue)] mb-4">
//                 Why are you cancelling this request?
//               </h3>

//               <textarea
//                 value={cancelReason}
//                 onChange={e => setCancelReason(e.target.value)}
//                 placeholder="e.g. Changed my mind, found another artisan, no longer needed..."
//                 rows={4}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] resize-none mb-4"
//                 required
//               />

//               <div className="flex gap-4">
//                 <button
//                   onClick={() => {
//                     setCancelModalOpen(null)
//                     setCancelReason('')
//                   }}
//                   className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl transition"
//                 >
//                   Cancel
//                 </button>

//                 <button
//                   onClick={() => handleCancel(cancelModalOpen)}
//                   disabled={cancelling === cancelModalOpen || !cancelReason.trim()}
//                   className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
//                 >
//                   {cancelling === cancelModalOpen && <FaSpinner className="animate-spin" />}
//                   Cancel Request
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }


'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  FaSpinner, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaUserTie, 
  FaMapMarkerAlt, 
  FaDollarSign, 
  FaClock, 
  FaRedo,
  FaHourglassHalf,
  FaUserCheck,
  FaTrashAlt,
  FaEye,
  FaCommentDots,
  FaHistory,
  FaStar
} from 'react-icons/fa'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import ArtisanLiveMap from '@/components/ArtisanLiveMap'
import CustomerLiveMap from '@/components/CustomerLiveMap'

// Dynamic import to prevent SSR issues
const CustomerArtisanTracker = dynamic(
  () => import('@/components/CustomerArtisanTracker'),
  { ssr: false }
)

interface CustomerRequest {
  id: string
  title: string
  description: string
  budget_min: number | null
  budget_max: number | null
  location: string
  area: string
  preferred_date: string | null
  preferred_time: string | null
  status: string
  created_at: string
  assigned_artisan: {
    first_name: string | null
    last_name: string | null
    primary_skill: string | null
  } | null
  status_logs?: { status: string; changed_at: string; notes?: string | null }[]
}

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<CustomerRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<CustomerRequest | null>(null)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [cancelModalOpen, setCancelModalOpen] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  useEffect(() => {
    fetchMyRequests()
  }, [])

  const fetchMyRequests = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in')
        return
      }

      const { data, error } = await supabase
        .from('job_requests')
        .select(`
          id,
          title,
          description,
          budget_min,
          budget_max,
          location,
          area,
          preferred_date,
          preferred_time,
          status,
          created_at,
          assigned_artisan:assigned_artisan_id (first_name, last_name, primary_skill),
          status_logs:request_status_logs (status, changed_at, notes)
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      let typedRequests: CustomerRequest[] = (data || []).map((item: any) => ({
        id: item.id || '',
        title: item.title || '',
        description: item.description || '',
        budget_min: item.budget_min ?? null,
        budget_max: item.budget_max ?? null,
        location: item.location || '',
        area: item.area || '',
        preferred_date: item.preferred_date ?? null,
        preferred_time: item.preferred_time ?? null,
        status: item.status || 'pending',
        created_at: item.created_at || '',
        assigned_artisan: item.assigned_artisan
          ? {
              first_name: item.assigned_artisan.first_name ?? null,
              last_name: item.assigned_artisan.last_name ?? null,
              primary_skill: item.assigned_artisan.primary_skill ?? null,
            }
          : null,
        status_logs: item.status_logs || [],
      }))

      // Sort: Assigned → In Progress → Completed Pending Review → Completed → Others
      const statusOrder = ['assigned', 'in_progress', 'completed_pending_review', 'completed', 'cancelled', 'pending']
      typedRequests.sort((a, b) => {
        const orderA = statusOrder.indexOf(a.status)
        const orderB = statusOrder.indexOf(b.status)
        return (orderA === -1 ? 999 : orderA) - (orderB === -1 ? 999 : orderB)
      })

      setRequests(typedRequests)
    } catch (err: any) {
      console.error('Fetch error:', err)
      setError(err.message || 'Failed to load your requests')
      toast.error('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (requestId: string) => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancelling')
      return
    }

    setCancelling(requestId)

    try {
      const { error } = await supabase
        .from('job_requests')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)

      if (error) throw error

      await supabase
        .from('request_status_logs')
        .insert({
          request_id: requestId,
          status: 'cancelled',
          changed_by: (await supabase.auth.getUser()).data.user?.id,
          notes: `Cancelled by customer: ${cancelReason.trim()}`,
        })

      toast.success('Request cancelled successfully')
      setCancelModalOpen(null)
      setCancelReason('')
      fetchMyRequests()
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel request')
    } finally {
      setCancelling(null)
    }
  }

  const getEstimatedTimeRemaining = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffMs = now.getTime() - created.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffHours < 1) return 'Just submitted'
    if (diffHours < 24) return `Submitted ${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    const days = Math.floor(diffHours / 24)
    return `Submitted ${days} day${days === 1 ? '' : 's'} ago`
  }

  const getStatusBadge = (status?: string) => {
    const s = status || 'unknown'
    const base = 'inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm'
    switch (s) {
      case 'pending':
        return <span className={`${base} bg-yellow-100 text-yellow-800 border border-yellow-200`}><FaHourglassHalf className="mr-1.5" /> Pending</span>
      case 'assigned':
        return <span className={`${base} bg-blue-100 text-blue-800 border border-blue-200`}><FaUserCheck className="mr-1.5" /> Assigned</span>
      case 'in_progress':
        return <span className={`${base} bg-purple-100 text-purple-800 border border-purple-200`}>In Progress</span>
      case 'completed_pending_review':
        return <span className={`${base} bg-green-100 text-green-800 border border-green-200 animate-pulse`}><FaStar className="mr-1.5" /> Ready for Review</span>
      case 'completed':
        return <span className={`${base} bg-green-100 text-green-800 border border-green-200`}><FaCheckCircle className="mr-1.5" /> Completed</span>
      case 'cancelled':
        return <span className={`${base} bg-gray-100 text-gray-700 border border-gray-200`}><FaTimesCircle className="mr-1.5" /> Cancelled</span>
      default:
        return <span className={`${base} bg-gray-100 text-gray-700 border border-gray-200`}>{s}</span>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--blue)] tracking-tight">
              My Requests
            </h1>
            <p className="mt-2 text-gray-600 text-lg">
              Track all your service requests in one place
            </p>
          </div>

          <button
            onClick={fetchMyRequests}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--orange)] hover:bg-orange-600 text-white font-medium rounded-xl transition disabled:opacity-60 shadow-md hover:shadow-lg"
          >
            <FaRedo className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Loading */}
        {loading && (
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
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-10 text-center shadow-inner">
            <FaExclamationTriangle className="text-red-500 text-7xl mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-red-800 mb-3">Oops! Something went wrong</h3>
            <p className="text-red-700 mb-8 text-lg">{error}</p>
            <button onClick={fetchMyRequests} className="px-10 py-4 bg-red-600 hover:bg-red-700 text-white font-medium text-lg rounded-xl transition shadow-md">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {requests.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-16 text-center">
                <FaExclamationTriangle className="text-[var(--orange)] text-8xl mx-auto mb-8 opacity-70" />
                <h3 className="text-3xl font-bold text-[var(--blue)] mb-4">No requests yet</h3>
                <Link href="/dashboard/customer/find-artisans" className="inline-flex items-center gap-3 px-10 py-5 bg-[var(--orange)] hover:bg-orange-600 text-white font-bold text-lg rounded-2xl transition shadow-xl">
                  Find an Artisan Now →
                </Link>
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className="group bg-white rounded-3xl shadow-md border border-gray-200 overflow-hidden hover:shadow-2xl hover:border-[var(--orange)]/40 transition-all duration-300 cursor-pointer"
                  >
                    <div className="bg-gradient-to-r from-[var(--blue)] to-blue-900 px-6 py-5 text-white">
                      <h3 className="font-bold text-xl line-clamp-1">{req.title}</h3>
                      <p className="text-sm opacity-90 mt-1">
                        {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="px-6 pt-5 pb-2">
                      {getStatusBadge(req.status)}
                    </div>

                    <div className="px-6 pb-6 space-y-4">
                      <p className="text-gray-700 line-clamp-3 text-sm leading-relaxed">
                        {req.description}
                      </p>

                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <FaMapMarkerAlt className="text-[var(--orange)]" />
                        <span>{req.area}, {req.location}</span>
                      </div>

                      {req.assigned_artisan && (
                        <div className="pt-4 border-t">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Assigned Artisan</p>
                          <p className="font-medium">
                            {req.assigned_artisan.first_name} {req.assigned_artisan.last_name}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedRequest(req); }} 
                        className="text-[var(--blue)] hover:text-[var(--orange)] font-medium flex items-center gap-2"
                      >
                        <FaEye /> View Details
                      </button>

                      {req.assigned_artisan && req.status === 'in_progress' && (
                        <Link 
                          href={`/dashboard/customer/payment/${req.id}`} 
                          onClick={(e) => e.stopPropagation()} 
                          className="px-5 py-2 bg-green-600 text-white rounded-xl text-sm font-medium"
                        >
                          Pay Now
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ==================== REQUEST DETAIL MODAL ==================== */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-[var(--blue)] to-blue-900 text-white px-8 py-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedRequest.title}</h2>
                  <p className="text-sm opacity-90 mt-1">Submitted {new Date(selectedRequest.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => setSelectedRequest(null)} className="text-4xl leading-none hover:text-[var(--orange)]">×</button>
              </div>

              <div className="flex-1 overflow-auto p-8 space-y-8">
                <div>{getStatusBadge(selectedRequest.status)}</div>

                {/* Live Tracker */}
                {(selectedRequest.status === 'in_progress' || selectedRequest.status === 'assigned') && 
                  selectedRequest.assigned_artisan && (
                  <div className="h-[420px] bg-gray-100 rounded-2xl overflow-hidden border">
                    {/* <CustomerArtisanTracker jobRequestId={selectedRequest.id} /> */}
                    {/* <ArtisanLiveMap jobRequestId={selectedRequest.id} isVisible={true} userType="customer" /> */}
                    <CustomerLiveMap jobRequestId={selectedRequest.id} isVisible={true} />


                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-lg mb-3">Description</h3>
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">{selectedRequest.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-5 rounded-2xl">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <FaMapMarkerAlt className="text-[var(--orange)]" /> Location
                    </h4>
                    <p className="font-medium">{selectedRequest.area}, {selectedRequest.location}</p>
                  </div>

                  <div className="bg-gray-50 p-5 rounded-2xl">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <FaClock className="text-[var(--orange)]" /> Preferred Time
                    </h4>
                    <p>{selectedRequest.preferred_date || 'Flexible'} {selectedRequest.preferred_time && `• ${selectedRequest.preferred_time}`}</p>
                  </div>
                </div>

                {selectedRequest.assigned_artisan && (
                  <div className="bg-blue-50 p-6 rounded-2xl">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <FaUserCheck className="text-[var(--orange)]" /> Assigned Artisan
                    </h3>
                    <p className="text-xl font-medium">
                      {selectedRequest.assigned_artisan.first_name} {selectedRequest.assigned_artisan.last_name}
                    </p>
                  </div>
                )}

                <div className="pt-6 flex flex-col gap-4">
                  {selectedRequest.status === 'in_progress' && selectedRequest.assigned_artisan && (
                    <Link
                      href={`/dashboard/customer/payment/${selectedRequest.id}`}
                      className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-2xl text-center transition"
                    >
                      Make Payment
                    </Link>
                  )}

                  <Link
                    href="/dashboard/customer/messages"
                    className="w-full py-4 bg-[var(--blue)] hover:bg-blue-700 text-white font-bold text-lg rounded-2xl text-center transition"
                  >
                    Chat with Admin
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Modal */}
        {cancelModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-8">
              <h3 className="text-xl font-bold mb-4">Cancel Request</h3>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation..."
                className="w-full h-32 border border-gray-300 rounded-2xl p-4 mb-6"
              />
              <div className="flex gap-4">
                <button onClick={() => { setCancelModalOpen(null); setCancelReason(''); }} className="flex-1 py-4 bg-gray-200 rounded-2xl">Cancel</button>
                <button onClick={() => handleCancel(cancelModalOpen)} disabled={!cancelReason.trim()} className="flex-1 py-4 bg-red-600 text-white rounded-2xl disabled:opacity-50">Confirm Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}