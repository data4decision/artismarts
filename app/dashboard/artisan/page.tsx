'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ShieldCheck, Clock, XCircle, AlertCircle, Loader2 } from 'lucide-react'
// Do NOT import supabase here

type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'not_verified' | null

export default function ArtisanDashboard() {
  const router = useRouter()
  const [status, setStatus] = useState<VerificationStatus>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Dynamically import supabase (client-side only)
    import('@/lib/supabase').then(({ supabase }) => {
      // Check session first
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          router.replace('/login')
          return
        }

        // Get current user's profile verification status
        supabase
          .from('profiles')
          .select('verification_status')
          .eq('id', session.user.id)
          .single()
          .then(({ data, error }) => {
            setLoading(false)

            if (error) {
              console.error('Error fetching verification status:', error)
              setError('Could not load verification status')
              return
            }

            setStatus(data?.verification_status as VerificationStatus ?? 'not_verified')
          })
      })
    })
  }, [router])

  const getStatusInfo = () => {
    switch (status) {
      case 'approved':
        return {
          label: 'Verified',
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <ShieldCheck className="w-5 h-5" />,
          description: 'Your artisan profile is fully verified'
        }
      case 'pending':
        return {
          label: 'Verification Pending',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Clock className="w-5 h-5" />,
          description: 'Your documents are under review'
        }
      case 'rejected':
        return {
          label: 'Verification Rejected',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <XCircle className="w-5 h-5" />,
          description: 'Please update your documents and resubmit'
        }
      case 'not_verified':
      default:
        return {
          label: 'Not Verified',
          color: 'bg-gray-100 text-gray-800 border-gray-300',
          icon: <AlertCircle className="w-5 h-5" />,
          description: 'Complete verification to unlock full features'
        }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-[var(--blue)]">
            Welcome to Artisan Dashboard
          </h1>

          {/* Verification Badge */}
          {loading ? (
            <div className="min-h-screen flex items-center justify-center bg-[var(--white)]">
                   <div className="relative flex items-center justify-center">
                     {/* Outer spinning ring */}
                     <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-[var(--orange)] border-opacity-70 shadow-md"></div>
                 
                     {/* Inner static logo with subtle pulse */}
                     <div className="absolute inset-0 flex items-center justify-center animate-pulse-slow">
                       <div className="bg-[var(--white)] rounded-full p-2 shadow-sm">
                         <Image
                           src="/log.png"
                           width={48}
                           height={48}
                           priority
                           alt="Loading..."
                           className="object-contain"
                         />
                       </div>
                     </div>
                   </div>
                 </div>
          ) : error ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full border border-red-200">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-700">{error}</span>
            </div>
          ) : (
            <div
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full border shadow-sm ${statusInfo.color}`}
            >
              {statusInfo.icon}
              <span className="font-medium">{statusInfo.label}</span>
            </div>
          )}
        </div>

        {/* Status message / call to action */}
        {!loading && !error && (
          <div className={`mb-8 p-5 rounded-xl border ${statusInfo.color.replace('100', '50').replace('800', '700')}`}>
            <div className="flex items-start gap-3">
              {statusInfo.icon}
              <div>
                <p className="font-medium mb-1">{statusInfo.description}</p>
                {status !== 'approved' && (
                  <Link
                    href="/dashboard/artisan/verification"
                    className="text-sm text-[var(--blue)] hover:underline inline-flex items-center gap-1 mt-2"
                  >
                    {status === 'not_verified' ? 'Start Verification' : 'Update Verification'}
                    <span aria-hidden="true">→</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dashboard content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
            <h3 className="font-semibold text-lg mb-4">Upcoming Jobs</h3>
            <p className="text-gray-500">No upcoming jobs yet</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
            <h3 className="font-semibold text-lg mb-4">Earnings This Month</h3>
            <p className="text-gray-500">₦0.00</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
            <h3 className="font-semibold text-lg mb-4">Profile Completion</h3>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div
                className="bg-[var(--blue)] h-2.5 rounded-full"
                style={{ width: status === 'approved' ? '100%' : '60%' }}
              ></div>
            </div>
            <p className="text-sm text-[var(--blue)]">
              {status === 'approved' ? '100%' : '60%'} complete
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}