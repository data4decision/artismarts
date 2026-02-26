'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Image from 'next/image'

// ─── Schema ────────────────────────────────────────────────────────
const formSchema = z.object({
  skills: z.array(z.string()).min(1, 'Select at least one skill'),
})

type FormValues = z.infer<typeof formSchema>

// ─── Categories ────────────────────────────────────────────────────
const skillCategories = [
  { title: "Home & Building Services", skills: ["Plumber", "Electrician", "Carpenter", "Mason / Bricklayer", "Painter / Decorator", "Tiler"] },
  { title: "Mechanical & Technical Services", skills: ["Generator Repair Technician", "AC Technician (Installation & Repairs)", "Refrigerator & Freezer Technician", "Washing Machine Technician"] },
  { title: "General Maintenance", skills: ["Handyman (Minor repairs)", "Welder / Fabricator", "Aluminum Fabricator (Doors & Windows)"] },
  { title: "Interior & Finishing Services", skills: ["POP Ceiling Installer", "Interior Decorator", "Furniture Maker", "Upholsterer"] },
  { title: "Security & Installations", skills: ["CCTV Installer", "Solar Panel Installer", "Electric Fence Installer"] },
  { title: "ICT & Digital Technicians", skills: ["Computer Repair Technician", "Phone Repair Technician", "Network / Internet Technician"] },
  { title: "Personal & Domestic Services", skills: ["Cleaner / Janitorial Services", "Home Care Assistant", "Laundry & Dry Cleaning Agent", "Barber/Hairdresser"] },
  { title: "Automotive Artisans", skills: ["Auto Mechanic", "Auto Electrician", "Panel Beater", "Car Painter"] },
  { title: "Specialised & Industrial Artisans", skills: ["Industrial Electrician", "Industrial Plumber", "HVAC Engineer", "Heavy Equipment Technician"] },
  { title: "Event & Creative Service Artisans", skills: ["Event Electrician", "Event Sound Technician", "Event Lighting Technician", "Stage Fabricator"] },
] as const

export default function ArtisanSkillsPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [openCategory, setOpenCategory] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { skills: [] },
  })

  const { handleSubmit, watch, setValue, reset } = form
  const selectedSkills = watch('skills') ?? []

  // ─── Load skills reliably ─────────────────────────────────────────
  useEffect(() => {
    let mounted = true

    const loadSkills = async () => {
  if (!mounted) return
  setLoading(true)

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Please sign in')
      router.replace('/login')
      return
    }

    console.log('[Skills] Loading for user:', user.id)

    const { data, error } = await supabase
      .from('profiles')
      .select('skills')
      .eq('id', user.id)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('[Skills] Fetch error:', error)
      toast.error('Failed to load skills')
      return
    }

    let skillsFromDb: string[] = []

    if (data?.skills) {
      if (typeof data.skills === 'string') {
        try {
          const parsed = JSON.parse(data.skills)
          if (Array.isArray(parsed)) {
            skillsFromDb = parsed.filter((s): s is string => typeof s === 'string')
            console.log('[Skills] Parsed string skills:', skillsFromDb)
          }
        } catch (e) {
          console.warn('[Skills] Invalid skills string format:', data.skills)
        }
      } else if (Array.isArray(data.skills)) {
        skillsFromDb = data.skills
        console.log('[Skills] Direct array skills:', skillsFromDb)
      }
    }

    if (mounted) {
      console.log('[Skills] Final skills set to form:', skillsFromDb)
      setValue('skills', skillsFromDb, { shouldValidate: true })
      reset({ skills: skillsFromDb })
    }
  } catch (err) {
    console.error('[Skills] Unexpected:', err)
    if (mounted) toast.error('Error loading skills')
  } finally {
    if (mounted) setLoading(false)
  }
}

    // Re-load on auth change
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Skills] Auth event:', event)
      if (['SIGNED_IN', 'TOKEN_REFRESHED', 'INITIAL_SESSION'].includes(event) && session?.user?.id) {
        loadSkills()
      } else if (event === 'SIGNED_OUT' && mounted) {
        setValue('skills', [])
      }
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [router, setValue, reset])

  // ─── Toggle skill (client can add/remove) ─────────────────────────
  const toggleSkill = (skill: string) => {
    const current = selectedSkills ?? []
    const updated = current.includes(skill)
      ? current.filter(s => s !== skill)
      : [...current, skill]

    setValue('skills', updated, { shouldValidate: true })
  }

  // ─── Save to database ─────────────────────────────────────────────
  const onSubmit = handleSubmit(async (data) => {
    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in')
        router.push('/login')
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          skills: data.skills,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      toast.success('Skills saved successfully')
      console.log('[Skills] Saved to DB:', data.skills)
    } catch (err: any) {
      console.error('[Skills] Save failed:', err)
      toast.error(err.message || 'Failed to save skills')
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <div className=" bg-gray-50  px-4 sm:px-6 lg:px-8 py-6.5">
      <div className="max-w-4xl mx-auto rounded-2xl shadow-xl border-1 border-gray-200 ">
        <h1 className="text-xl md:text-2xl font-bold px-7 md:px-10 py-2.5 text-[var(--blue)] mb-3 ">
          Select Your Skills
        </h1>
        

        {/* Selected skills (always visible when loaded) */}
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
                          width={28}
                          height={28}
                          priority
                          alt="Loading..."
                          className="object-contain"
                        />
                      </div>
                    </div>
                  </div>
                </div>
        ) : (
          <>
            {selectedSkills.length > 0 && (
              <div className="mb-10 p-6 bg-[var(--white)] rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-sm md:text-xl font-semibold text-[var(--blue)] mb-4">
                  Your Current Skills ({selectedSkills.length})
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {selectedSkills.map(skill => (
                    <div
                      key={skill}
                      className="flex text-sm md:text-xl items-center gap-2 px-4 py-2 bg-[var(--white)] text-[var(--blue)] rounded-full border border-[var(--blue)]/80"
                    >
                      <span className="font-medium text-sm md:text-xl">{skill}</span>
                      <button
                        onClick={() => toggleSkill(skill)}
                        className="text-[var(--orange)]/80 hover:text-[var(--orange)] text-sm md:text-xl leading-none font-bold"
                        title="Remove skill"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden p-6 md:p-10 space-y-10">
              {form.formState.errors.skills && (
                <p className="text-center text-sm md:text-xl text-[var(--orange)] font-medium">
                  {form.formState.errors.skills.message}
                </p>
              )}

              <div className="space-y-4">
                {skillCategories.map(category => (
                  <div key={category.title} className="border text-sm md:text-xl border-gray-200 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenCategory(prev => prev === category.title ? null : category.title)}
                      className="w-full text-sm md:text-xl px-6 py-4 text-left flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-[15px] md:text-[17px] font-medium text-[var(--blue)]">{category.title}</span>
                      <span className="text-2xl font-bold text-[var(--blue)]">
                        {openCategory === category.title ? '−' : '+'}
                      </span>
                    </button>

                    {openCategory === category.title && (
                      <div className="px-6 pb-6 pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {category.skills.map(skill => {
                          const isSelected = selectedSkills.includes(skill)
                          return (
                            <label
                              key={skill}
                              className={`flex items-center gap-3 p-3.5 border rounded-lg cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-[var(--blue)]/80 bg-[var(--blue)]/50'
                                  : 'border-gray-200 hover:border-[var(--blue)]/70 hover:bg-[var(--blue)]/50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSkill(skill)}
                                className="h-5 w-5 text-[var(--blue)] rounded border-gray-300 focus:ring-[var(--blue)]"
                              />
                              <span className="text-[var(--blue)] text-sm md:text-xl font-medium">{skill}</span>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-8 flex justify-center">
                <button
                  type="submit"
                  disabled={submitting || loading}
                  className="px-12 py-3.5 text-sm md:text-xl bg-[var(--orange)] text-white font-medium rounded-lg hover:bg-[var(--orange)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}