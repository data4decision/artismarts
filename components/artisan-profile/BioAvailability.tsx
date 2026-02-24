'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { FaEdit, FaSpinner, FaPlus } from 'react-icons/fa'
import Image from 'next/image'

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
] as const

type DayOfWeek = typeof DAYS[number]

// Format 24-hour time string to 12-hour with AM/PM
const formatTime = (timeStr: string | null | undefined): string => {
  if (!timeStr || typeof timeStr !== 'string' || timeStr.trim() === '') {
    return '--:-- --'
  }

  const cleaned = timeStr.trim()
  const [hourPart, minutePart = '00'] = cleaned.split(':')

  const hour = parseInt(hourPart, 10)
  const minute = parseInt(minutePart, 10)

  if (
    isNaN(hour) ||
    isNaN(minute) ||
    hour < 0 || hour > 23 ||
    minute < 0 || minute > 59
  ) {
    return '--:-- --'
  }

  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  const displayMinute = minute.toString().padStart(2, '0')

  return `${displayHour}:${displayMinute} ${period}`
}

export default function BioAndAvailabilityView() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [bio, setBio] = useState<string | null>(null)
  const [workingDays, setWorkingDays] = useState<DayOfWeek[]>([])
  const [timeRanges, setTimeRanges] = useState<Record<DayOfWeek, string[]>>(
    {} as Record<DayOfWeek, string[]>
  )

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          toast.error('Please sign in')
          router.push('/login')
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('bio, working_days, available_time_slots')
          .eq('id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') throw error

        setBio(data?.bio?.trim() ?? null)

        // Parse working days
        if (data?.working_days) {
          const days = data.working_days
            .split(',')
            .map(d => d.trim())
            .filter((d): d is DayOfWeek => DAYS.includes(d as DayOfWeek))
          setWorkingDays(days)
        }

        // Parse available_time_slots
        if (data?.available_time_slots) {
          const parsed: Record<DayOfWeek, string[]> = {} as Record<DayOfWeek, string[]>

          const entries = data.available_time_slots.split(';')
          for (const entry of entries) {
            const trimmed = entry.trim()
            if (!trimmed) continue

            const colonIndex = trimmed.indexOf(':')
            if (colonIndex === -1) continue

            const dayPart = trimmed.substring(0, colonIndex).trim()
            const day = dayPart as DayOfWeek

            if (!DAYS.includes(day)) continue

            const rangesPart = trimmed.substring(colonIndex + 1).trim()
            if (!rangesPart) continue

            const ranges = rangesPart
              .split(',')
              .map(r => r.trim())
              .filter(r => r.length > 0 && r.includes('-'))

            if (ranges.length > 0) {
              parsed[day] = ranges
            }
          }

          setTimeRanges(parsed)
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Could not load data'
        console.error('Fetch error:', err)
        toast.error(msg)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  if (loading) {
    return (
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
    )
  }

  const hasAvailability = workingDays.length > 0 || Object.keys(timeRanges).length > 0

  return (
    <div className=" bg-gray-50 py-2 md:py-0 px-4  sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto rounded-2xl shadow-xl pt-4.5 border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="  px-6 py-1 text-[var(--blue)]">
          <h1 className="text-xl md:text-2xl font-bold">Bio & Availability</h1>
          <p className="mt-1 opacity-90">
            Your professional summary and when clients can reach you
          </p>
        </div>

        <div className="p-6 md:p-10 ">
          {/* Bio */}
          <section className="pb-10 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[var(--blue)]">Professional Bio</h2>
              <button
                onClick={() => router.push('/dashboard/artisan/profile/bio-availability/edit')}
                className="flex items-center gap-2 px-5 py-2.5 bg-[var(--orange)] text-white rounded-lg font-medium hover:opacity-90 transition"
              >
                <FaEdit size={14} />
                Edit Bio
              </button>
            </div>

            {bio ? (
              <div className="prose prose-gray max-w-none text-[var(--blue)] leading-relaxed">
                {bio.split('\n').map((line, i) => (
                  <p key={i} className="mb-4">{line}</p>
                ))}
              </div>
            ) : (
              <p className="text-[var(--blue)] italic text-center py-6">
                No professional bio added yet.
              </p>
            )}
          </section>

          {/* Availability */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <h2 className="text-xl font-semibold text-[var(--blue)]">Availability</h2>
              <button
                onClick={() => router.push('/dashboard/artisan/profile/bio-availability/edit')}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--orange)] text-white rounded-xl font-medium hover:opacity-90 transition shadow-md w-full sm:w-auto"
              >
                <FaEdit size={16} />
                Edit Availability
              </button>
            </div>

            {!hasAvailability ? (
              <div className="bg-gray-50 p-8 rounded-xl text-center border border-gray-200">
                <p className="text-[var(--blue)] text-lg mb-3 font-medium">
                  No availability set yet
                </p>
                <p className="text-text-[var(--blue)] mb-6">
                  Let clients know when you're available by adding your working days and time ranges.
                </p>
                <button
                  onClick={() => router.push('/dashboard/artisan/profile/bio-availability/edit')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--orange)] text-white rounded-xl font-medium hover:opacity-90 transition"
                >
                  <FaPlus size={16} />
                  Set Availability Now
                </button>
              </div>
            ) : (
              <div className="space-y-10">
                {workingDays.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-[var(--blue)] mb-4">Working Days</h3>
                    <div className="flex flex-wrap gap-3">
                      {workingDays.map(day => (
                        <span
                          key={day}
                          className="inline-flex px-5 py-2.5 bg-[var(--orange)]/10 text-[var(--orange)] rounded-full text-sm font-medium border border-[var(--orange)]/30 shadow-sm"
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {Object.keys(timeRanges).length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-[var(--blue)] mb-4">Available Time Ranges</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(timeRanges).map(([dayKey, ranges]) => {
                        const day = dayKey as DayOfWeek

                        return (
                          <div
                            key={day}
                            className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm"
                          >
                            <h4 className="text-base font-semibold text-[var(--blue)] mb-4">
                              {day}
                            </h4>
                            <div className="flex flex-wrap gap-3">
                              {ranges.map((range, i) => {
                                const parts = range.split('-').map(p => p.trim())

                                if (parts.length !== 2 || !parts[0] || !parts[1]) {
                                  return (
                                    <span
                                      key={i}
                                      className="inline-flex px-4 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-700"
                                    >
                                      Invalid range: {range}
                                    </span>
                                  )
                                }

                                const startFormatted = formatTime(parts[0])
                                const endFormatted = formatTime(parts[1])

                                return (
                                  <span
                                    key={i}
                                    className="inline-flex px-4 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-[var(--blue)] font-medium shadow-sm"
                                  >
                                    {startFormatted} – {endFormatted}
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}