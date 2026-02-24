'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { FaSave, FaTimes, FaSpinner, FaTrashAlt, FaPlus } from 'react-icons/fa'
import TimePicker from 'react-time-picker'
import 'react-time-picker/dist/TimePicker.css'
import 'react-clock/dist/Clock.css'

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
type TimeRange = { start: string; end: string }
type DaySchedule = { day: DayOfWeek; ranges: TimeRange[] }

export default function EditBioAndAvailability() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [bio, setBio] = useState('')
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([])
  const [schedules, setSchedules] = useState<DaySchedule[]>([])

  const normalizeTime = (time: string | null | undefined): string => {
    if (!time || typeof time !== 'string') return ''
    const [h, m] = time.split(':').map(s => s.trim())
    const hh = Number(h)
    const mm = Number(m || '0')
    if (isNaN(hh) || isNaN(mm)) return ''
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          toast.error('Please sign in first')
          router.push('/login')
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('bio, working_days, available_time_slots')
          .eq('id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') throw error

        setBio(data?.bio || '')

        if (data?.working_days) {
          const days = data.working_days
            .split(',')
            .map((d: string) => d.trim())
            .filter((d: string): d is DayOfWeek => DAYS.includes(d as DayOfWeek))
          setSelectedDays(days)
        }

        if (data?.available_time_slots) {
          const parsed: DaySchedule[] = []

          data.available_time_slots
            .split(';')
            .map((slot: string) => slot.trim())
            .filter((slot: string): slot is string => slot.length > 0)
            .forEach((entry: string) => {
              const [dayPart = '', rangesStr = ''] = entry.split(':')
              const day = dayPart.trim() as DayOfWeek

              if (!DAYS.includes(day)) return

              const ranges: TimeRange[] = rangesStr
                ? rangesStr
                    .split(',')
                    .map((rangeStr: string) => {
                      const [startRaw = '', endRaw = ''] = rangeStr.split('-')
                      const start = startRaw.trim()
                      const end = endRaw.trim()
                      return { start, end }
                    })
                    .filter((r): r is TimeRange => r.start.length > 0 && r.end.length > 0)
                : []

              if (ranges.length > 0) {
                parsed.push({ day, ranges })
              }
            })

          setSchedules(parsed)
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Could not load profile'
        console.error('Load error:', err)
        toast.error(msg)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const addRange = (day: DayOfWeek) => {
    setSchedules(prev => {
      const match = prev.find(s => s.day === day)
      if (match) {
        return prev.map(s =>
          s.day === day
            ? { ...s, ranges: [...s.ranges, { start: '09:00', end: '17:00' }] }
            : s
        )
      }
      return [...prev, { day, ranges: [{ start: '09:00', end: '17:00' }] }]
    })
  }

  const updateRange = (
    day: DayOfWeek,
    index: number,
    field: 'start' | 'end',
    value: string | null
  ) => {
    if (value === null) return

    const timeStr = value

    setSchedules(prev =>
      prev.map(s =>
        s.day === day
          ? {
              ...s,
              ranges: s.ranges.map((r, i) =>
                i === index ? { ...r, [field]: timeStr } : r
              )
            }
          : s
      )
    )
  }

  const removeRange = (day: DayOfWeek, index: number) => {
    setSchedules(prev =>
      prev
        .map(s =>
          s.day === day
            ? { ...s, ranges: s.ranges.filter((_, i) => i !== index) }
            : s
        )
        .filter(s => s.ranges.length > 0)
    )
  }

  const handleSave = async () => {
    if (selectedDays.length === 0) {
      toast.error('Please select at least one working day')
      return
    }

    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const userId = user.id

      const working_days = selectedDays.join(',')

      const timeSlotsStr = schedules
        .filter(s => s.ranges.length > 0)
        .map(s => {
          const rangesStr = s.ranges
            .filter(r => r.start && r.end)
            .map(r => `${normalizeTime(r.start)}-${normalizeTime(r.end)}`)
            .join(',')
          return `${s.day}:${rangesStr}`
        })
        .join(';') || null

      const { error } = await supabase
        .from('profiles')
        .update({
          bio: bio.trim() || null,
          working_days,
          available_time_slots: timeSlotsStr
        })
        .eq('id', userId)

      if (error) throw error

      toast.success('Saved successfully!')
      setTimeout(() => {
        router.push('/dashboard/artisan/profile')
      }, 1400)

    } catch (err: unknown) {
      console.error('Save failed:', err)
      const msg = err instanceof Error ? err.message : 'Could not save changes'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <FaSpinner className="animate-spin text-5xl text-[var(--orange)]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--white)] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-10">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
          Edit Bio & Availability
        </h1>

        {/* Bio */}
        <div className="mb-12">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Professional Bio
          </label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={6}
            placeholder="Describe your experience, specialties, turnaround time, unique value..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none resize-y min-h-[160px]"
          />
        </div>

        {/* Availability */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Working Days & Hours
          </h2>

          <div className="mb-10">
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Select Days You Work
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {DAYS.map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`
                    py-3 px-4 rounded-xl text-sm font-medium transition-all border
                    ${selectedDays.includes(day)
                      ? 'bg-[var(--orange)] text-white border-[var(--orange)]'
                      : 'bg-white border-gray-300 hover:border-[var(--orange)] hover:bg-orange-50 text-gray-700'
                    }
                  `}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {selectedDays.length > 0 && (
            <div className="space-y-8">
              {selectedDays.map(day => {
                const schedule = schedules.find(s => s.day === day) || { day, ranges: [] }

                return (
                  <div key={day} className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-semibold text-gray-800">{day}</h3>
                      <button
                        type="button"
                        onClick={() => addRange(day)}
                        className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        <FaPlus size={14} /> Add Time Slot
                      </button>
                    </div>

                    {schedule.ranges.length === 0 ? (
                      <p className="text-sm text-gray-500 italic py-3">
                        No time slots added yet
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {schedule.ranges.map((range, idx) => (
                          <div key={idx} className="flex items-start sm:items-center gap-4">
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">From</label>
                                <TimePicker
                                  onChange={val => updateRange(day, idx, 'start', val)}
                                  value={range.start}
                                  format="HH:mm"
                                  hourPlaceholder="HH"
                                  minutePlaceholder="mm"
                                  disableClock={false}
                                  clearIcon={null}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[var(--orange)]"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">To</label>
                                <TimePicker
                                  onChange={val => updateRange(day, idx, 'end', val)}
                                  value={range.end}
                                  format="HH:mm"
                                  hourPlaceholder="HH"
                                  minutePlaceholder="mm"
                                  disableClock={false}
                                  clearIcon={null}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-[var(--orange)]"
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeRange(day, idx)}
                              className="p-3 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition mt-6 sm:mt-0"
                              title="Remove slot"
                            >
                              <FaTrashAlt size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <p className="mt-6 text-sm text-gray-500 italic">
            Use 24-hour format. Example: 09:00–17:00 or multiple blocks per day.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-12 pt-8 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-[var(--orange)] text-white py-3.5 rounded-xl font-medium hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 transition"
          >
            {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          <button
            onClick={() => router.back()}
            disabled={saving}
            className="flex-1 bg-gray-200 text-gray-800 py-3.5 rounded-xl font-medium hover:bg-gray-300 flex items-center justify-center gap-2 transition"
          >
            <FaTimes />
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}