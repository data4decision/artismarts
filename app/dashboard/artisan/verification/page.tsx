'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  CheckCircle2,
  User,
  Building2,
  ShieldCheck,
} from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// ──────────────────────────────────────────────────────────────
// Steps
// ──────────────────────────────────────────────────────────────
const steps = [
  { id: 1, title: 'Personal',    subtitle: 'Basic details',      icon: <User className="w-6 h-6" /> },
  { id: 2, title: 'Business',    subtitle: 'Shop & addresses',   icon: <Building2 className="w-6 h-6" /> },
  { id: 3, title: 'Documents',   subtitle: 'ID & certificates',  icon: <Upload className="w-6 h-6" /> },
  { id: 4, title: 'Professional',subtitle: 'Skills & experience',icon: <ShieldCheck className="w-6 h-6" /> },
  { id: 5, title: 'Review',      subtitle: 'Check & submit',     icon: <CheckCircle2 className="w-6 h-6" /> },
]

// ──────────────────────────────────────────────────────────────
// Zod Schema
// ──────────────────────────────────────────────────────────────
const formSchema = z.object({
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),
  phone: z.string().min(10, 'Phone number is required'),

  business_name: z.string().min(3, 'Business name is required'),
  business_id_type: z.enum(['nin', 'voters_card', 'driving_licence']),
  business_id_number: z.string().min(5, { message: 'ID number is required' }),

  residential_address: z.string().min(10, 'Residential address is required'),
  shop_address: z.string().min(10, 'Shop address is required'),
  association_name: z.string().min(3, 'Association name is required'),
  association_address: z.string().min(10, 'Association address is required'),
  primary_skill: z.string().optional(),

  skills_categories: z.array(z.string()).min(1, 'Select at least one service'),
  years_of_experience: z.number().min(0).max(60).optional(),
  work_location: z.string().min(3, 'Work location is required'),
}).superRefine((data, ctx) => {
  if (data.business_id_type === 'nin' && !/^\d{11}$/.test(data.business_id_number)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'NIN must be exactly 11 digits',
      path: ['business_id_number'],
    });
  }
});

type FormValues = z.infer<typeof formSchema>

const artisanCategories = [
  { id: 1, name: 'Plumbing' },
  { id: 2, name: 'Electrical' },
  { id: 3, name: 'Carpentry' },
  { id: 4, name: 'Masonry' },
  { id: 5, name: 'Painting' },
  { id: 6, name: 'Tiling' },
]

// const skillCategories = [
//   { title: "Home & Building Services", skills: ["Plumber", "Electrician", "Carpenter", "Mason / Bricklayer", "Painter / Decorator", "Tiler"] },
//   { title: "Mechanical & Technical Services", skills: ["Generator Repair Technician", "AC Technician (Installation & Repairs)", "Refrigerator & Freezer Technician", "Washing Machine Technician"] },
//   { title: "General Maintenance", skills: ["Handyman (Minor repairs)", "Welder / Fabricator", "Aluminum Fabricator (Doors & Windows)"] },
//   { title: "Interior & Finishing Services", skills: ["POP Ceiling Installer", "Interior Decorator", "Furniture Maker", "Upholsterer"] },
//   { title: "Security & Installations", skills: ["CCTV Installer", "Solar Panel Installer", "Electric Fence Installer"] },
//   { title: "ICT & Digital Technicians", skills: ["Computer Repair Technician", "Phone Repair Technician", "Network / Internet Technician"] },
//   { title: "Personal & Domestic Services", skills: ["Cleaner / Janitorial Services", "Home Care Assistant", "Laundry & Dry Cleaning Agent", "Barber/Hairdresser"] },
//   { title: "Automotive Artisans", skills: ["Auto Mechanic", "Auto Electrician", "Panel Beater", "Car Painter"] },
//   { title: "Specialised & Industrial Artisans", skills: ["Industrial Electrician", "Industrial Plumber", "HVAC Engineer", "Heavy Equipment Technician"] },
//   { title: "Event & Creative Service Artisans", skills: ["Event Electrician", "Event Sound Technician", "Event Lighting Technician", "Stage Fabricator"] },
// ] as const

const skillCategories = [
  { 
    title: "Home & Building Services", 
    skills: ["Plumber", "Electrician", "Carpenter", "Mason / Bricklayer", "Painter / Decorator", "Tiler"] 
  },
  { 
    title: "Mechanical & Technical Services", 
    skills: ["Generator Repair Technician", "AC Technician (Installation & Repairs)", "Refrigerator & Freezer Technician", "Washing Machine Technician"] 
  },
  { 
    title: "General Maintenance", 
    skills: ["Handyman (Minor repairs)", "Welder / Fabricator", "Aluminum Fabricator (Doors & Windows)"] 
  },
  { 
    title: "Interior & Finishing Services", 
    skills: ["POP Ceiling Installer", "Interior Decorator", "Furniture Maker", "Upholsterer"] 
  },
  { 
    title: "Security & Installations", 
    skills: ["CCTV Installer", "Solar Panel Installer", "Electric Fence Installer"] 
  },
  { 
    title: "ICT & Digital Technicians", 
    skills: ["Computer Repair Technician", "Phone Repair Technician", "Network / Internet Technician"] 
  },
  { 
    title: "Personal & Domestic Services", 
    skills: [
      "Cleaner / Janitorial Services",
      "Home Care Assistant",
      "Laundry & Dry Cleaning Agent",
      "Barber/Hairdresser",
      "Housekeeper" // ✅ Added here (best fit)
    ] 
  },
  { 
    title: "Automotive Artisans", 
    skills: ["Auto Mechanic", "Auto Electrician", "Panel Beater", "Car Painter"] 
  },
  { 
    title: "Specialised & Industrial Artisans", 
    skills: ["Industrial Electrician", "Industrial Plumber", "HVAC Engineer", "Heavy Equipment Technician"] 
  },
  { 
    title: "Event & Creative Service Artisans", 
    skills: [
      "Event Electrician",
      "Event Sound Technician",
      "Event Lighting Technician",
      "Stage Fabricator",
      "Photographer" // ✅ Fits well here
    ] 
  },

  // ✅ NEW CATEGORY (cleaner than forcing them into wrong places)
  { 
    title: "Beauty & Fashion Services", 
    skills: [
      "Make-up Artist",
      "Fashion Designer",
      "Barber" // (optional: keep here OR in Personal & Domestic, but avoid duplication)
    ] 
  }
] as const;

export default function ArtisanVerificationPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAlreadyVerified, setIsAlreadyVerified] = useState(false)   // ← New state

  const [selectedCategory, setSelectedCategory] = useState('')
  const [availableSkills, setAvailableSkills] = useState<string[]>([])

  const [uploads, setUploads] = useState({
    passport: null as string | null,
    government_id: null as string | null,
    trade_certificate: null as string | null,
    reference_letter: null as string | null,
  })

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      skills_categories: [],
    },
    mode: 'onChange',
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
    getValues,
    setValue,
  } = form

  const idType = watch('business_id_type')

  // Load existing data + check verification status
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (data) {
        // Check if already verified
        if (data.verification_status === 'approved') {
          setIsAlreadyVerified(true)
          return
        }

        // Map DB → form
        setValue('first_name', data.first_name || '')
        setValue('last_name', data.last_name || '')
        setValue('phone', data.phone || '')
        setValue('business_name', data.business_name || '')
        setValue('business_id_type', data.business_id_type || '')
        setValue('business_id_number', data.business_id_number || '')
        setValue('residential_address', data.residential_address || '')
        setValue('shop_address', data.shop_address || '')
        setValue('association_name', data.association_name || '')
        setValue('association_address', data.association_address || '')
        
        setValue('skills_categories', data.skills_categories || [])
        setValue('years_of_experience', data.years_of_experience || undefined)
        setValue('work_location', data.work_location || '')
        setValue('primary_skill', data.primary_skill || '')
  setValue('skills_categories', data.skills_categories || [])

        setUploads({
          passport: data.passport_photo_url,
          government_id: data.government_id_url,
          trade_certificate: data.trade_certificate_url,
          reference_letter: data.reference_letter_url,
        })
      }
    }
    load()
  }, [setValue])

  // Handle category selection for primary skill
  // const handleCategoryChange = (categoryTitle: string) => {
  //   setSelectedCategory(categoryTitle)
  //   const category = skillCategories.find(cat => cat.title === categoryTitle)
  //   setAvailableSkills(category ? [...category.skills] : [])
  // }
  const handleCategoryChange = (categoryTitle: string) => {
  setSelectedCategory(categoryTitle)
  const category = skillCategories.find(cat => cat.title === categoryTitle)
  setAvailableSkills(category ? [...category.skills] : [])
}

  useEffect(() => {
    if (currentStep === 2) trigger('business_id_number')
  }, [idType, currentStep, trigger])

    const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    key: keyof typeof uploads
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    // NEW: Limit file size to 5MB (prevents memory issues)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 5MB.')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return toast.error('Not authenticated')

      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `verifications/${key}/${user.id}-${Date.now()}.${ext}`

      // Optional: Add progress toast for better UX
      const toastId = toast.loading(`Uploading ${key.replace('_', ' ')}...`)

      const { error } = await supabase.storage
        .from('verification-documents')
        .upload(path, file, { 
          upsert: true,
          cacheControl: '3600' 
        })

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(path)

      setUploads(prev => ({ ...prev, [key]: urlData.publicUrl }))

      toast.dismiss(toastId)
      toast.success(`${key.replace('_', ' ')} uploaded successfully`)
    } catch (err: any) {
      console.error('Upload error:', err)
      toast.error('Upload failed. Please try a smaller file.')
    }
  }

  const handleNext = async () => {
    let fieldsToValidate: (keyof FormValues)[] = []

    if (currentStep === 1) {
      fieldsToValidate = ['first_name', 'last_name', 'phone']
    } else if (currentStep === 2) {
      fieldsToValidate = [
        'business_name',
        'business_id_type',
        'business_id_number',
        'residential_address',
        'shop_address',
        'association_name',
        'association_address',
      ]
    } else if (currentStep === 4) {
      fieldsToValidate = ['work_location', 'primary_skill', 'skills_categories']
    } 

    const isValid = await trigger(fieldsToValidate)

    if (!isValid) {
      toast.error('Please complete all required fields')
      return
    }

    if (currentStep === 3) {
      if (!uploads.passport || !uploads.government_id || !uploads.trade_certificate || !uploads.reference_letter) {
        toast.error('All four documents are required')
        return
      }
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    const toastId = toast.loading('Submitting verification...')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const payload = {
        id: user.id,
        artisan_id: user.id,
        role: 'artisan',

        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,

        business_name: data.business_name,
        business_id_type: data.business_id_type,
        business_id_number: data.business_id_number,

        residential_address: data.residential_address,
        shop_address: data.shop_address,
        association_name: data.association_name,
        association_address: data.association_address,

        skills_categories: data.skills_categories,
        years_of_experience: data.years_of_experience,
        work_location: data.work_location,

        passport_photo_url: uploads.passport,
        government_id_url: uploads.government_id,
        trade_certificate_url: uploads.trade_certificate,
        reference_letter_url: uploads.reference_letter,

        verification_status: 'pending',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })

      if (error) throw error

      toast.dismiss(toastId)
      toast.success('Verification submitted successfully!')
      
      // Redirect after successful submission
      setTimeout(() => {
        router.push('/dashboard/artisan')
      }, 1500)
    } catch (err: any) {
      console.error('Submission error:', err)
      toast.dismiss(toastId)
      toast.error(err.message || 'Failed to submit verification')
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100

  if (isAlreadyVerified) {
    return (
      <div className="min-h-screen bg-[var(--white)] py-12 px-4 flex items-center justify-center">
        <div className="max-w-md text-center">
          <CheckCircle2 className="w-20 h-20 text-green-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-[var(--blue)] mb-4">You are already verified</h2>
          <p className="text-[var(--blue)] mb-8">
            Your artisan verification has been approved. You can now access your artisan dashboard.
          </p>
          <button
            onClick={() => router.push('/dashboard/artisan')}
            className="px-8 py-3 bg-[var(--blue)] text-white rounded-xl font-medium hover:bg-blue-700 transition"
          >
            Go to Artisan Dashboard
          </button>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-[var(--white)] py-8 px-4 sm:py-12 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-[var(--blue)] mb-3">
          Artisan Verification
        </h1>
        <p className="text-center text-[var(--blue)] mb-8 sm:mb-10">
          Complete each step to get verified
        </p>

        {/* Progress bar + steps */}
        <div className="mb-8 sm:mb-10">
          <div className="flex justify-between mb-3 gap-2">
            {steps.map(step => (
              <div key={step.id} className="flex-1 text-center">
                <div
                  className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center border-2 mb-1 ${
                    step.id < currentStep
                      ? 'bg-[var(--blue)] border-[var(--blue)] text-white'
                      : step.id === currentStep
                      ? 'border-[var(--orange)] text-[var(--orange)]'
                      : 'border-[var(--blue)] text-[var(--blue)]'
                  }`}
                >
                  {step.icon}
                </div>
                <div className="text-xs sm:text-sm font-medium text-[var(--blue)]">{step.title}</div>
              </div>
            ))}
          </div>
          <div className="h-2 bg-[var(--blue)] bg-opacity-20 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--orange)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-[var(--white)] border border-[var(--blue)] border-opacity-30 rounded-2xl p-6 sm:p-10">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* ─── STEP 1 ─── */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-[var(--blue)]">Personal Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[var(--blue)] mb-1">First Name *</label>
                    <input {...register('first_name')} className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--orange)]" />
                    {errors.first_name && <p className="text-[var(--orange)] text-sm mt-1">{errors.first_name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--blue)] mb-1">Last Name *</label>
                    <input {...register('last_name')} className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--orange)]" />
                    {errors.last_name && <p className="text-[var(--orange)] text-sm mt-1">{errors.last_name.message}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[var(--blue)] mb-1">Phone Number *</label>
                    <input {...register('phone')} className="mt-1 block rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--orange)] w-[50%]" placeholder="+234..." />
                    {errors.phone && <p className="text-[var(--orange)] text-sm mt-1">{errors.phone.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* ─── STEP 2 ─── */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-[var(--blue)]">Business & Address</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[var(--blue)] mb-1.5">Business / Shop Name *</label>
                    <input {...register('business_name')} className="mt-1 block w-[50%] rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--orange)]" placeholder="e.g. Ade's Plumbing Works" />
                    {errors.business_name && <p className="text-[var(--orange)] text-sm mt-1.5">{errors.business_name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--blue)] mb-1.5">ID Type *</label>
                    <select {...register('business_id_type')} className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--orange)]">
                      <option value="">Select...</option>
                      <option value="nin">NIN</option>
                      <option value="voters_card">Voter's Card</option>
                      <option value="driving_licence">Driver's Licence</option>
                    </select>
                    {errors.business_id_type && <p className="text-[var(--orange)] text-sm mt-1.5">{errors.business_id_type.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--blue)] mb-1.5">
                      {idType === 'nin' ? 'NIN (11 digits)' : 'ID Number'} *
                    </label>
                    <input {...register('business_id_number')} className="mt-1 block w-[50%] rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--orange)]" />
                    {errors.business_id_number && <p className="text-[var(--orange)] text-sm mt-1.5">{errors.business_id_number.message}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[var(--blue)] mb-1.5">Residential Address *</label>
                    <input {...register('residential_address')} className="mt-1 block w-[50%] rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--orange)]" placeholder="House number, Street, Area, City" />
                    {errors.residential_address && <p className="text-[var(--orange)] text-sm mt-1.5">{errors.residential_address.message}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[var(--blue)] mb-1.5">Shop / Workshop Address *</label>
                    <input {...register('shop_address')} className="mt-1 block w-[50%] rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--orange)]" placeholder="Market, Street, Area, City" />
                    {errors.shop_address && <p className="text-[var(--orange)] text-sm mt-1.5">{errors.shop_address.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--blue)] mb-1.5">Association Name *</label>
                    <input {...register('association_name')} className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--orange)]" />
                    {errors.association_name && <p className="text-[var(--orange)] text-sm mt-1.5">{errors.association_name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--blue)] mb-1.5">Association Address *</label>
                    <input {...register('association_address')} className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--orange)]" />
                    {errors.association_address && <p className="text-[var(--orange)] text-sm mt-1.5">{errors.association_address.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* ─── STEP 3 ─── */}
            {currentStep === 3 && (
              <div className="space-y-8">
                <h2 className="text-2xl font-semibold text-[var(--blue)]">Required Documents</h2>
                <p className="text-[var(--blue)]">Upload all four files</p>

                {[
                  { key: 'passport', label: 'Passport Photograph', accept: 'image/*', des: 'Your Passport Picture' },
                  { key: 'government_id', label: 'Government ID', accept: 'image/*,application/pdf', des: 'Your Government Issued ID, e.g., Drivers Licence, voters Cord, or NIN slip' },
                  { key: 'trade_certificate', label: 'Trade Certificate', accept: 'image/*,application/pdf', des: 'Trade Certificate from your apprenticeship or training' },
                  { key: 'reference_letter', label: 'Reference Letter', accept: 'image/*,application/pdf', des: 'A letter from a previous client, employer, or association' },
                ].map(item => (
                  <div key={item.key} className="border-2 border-dashed border-[var(--blue)] border-opacity-40 rounded-xl p-6 text-center">
                    <Upload className="w-10 h-10 text-[var(--blue)] mx-auto mb-3 opacity-60" />
                    <p className="font-medium text-[var(--blue)]">{item.label} *</p>
                    <p className="text-sm text-gray-500">{item.des}</p>

                    <input
                      type="file"
                      accept={item.accept}
                      onChange={e => handleFileUpload(e, item.key as keyof typeof uploads)}
                      className="hidden"
                      id={`upload-${item.key}`}
                    />
                    <label
                      htmlFor={`upload-${item.key}`}
                      className="mt-4 inline-block bg-[var(--orange)] text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-opacity-90 transition"
                    >
                      Choose File
                    </label>

                    {uploads[item.key as keyof typeof uploads] && (
                      <p className="text-[var(--orange)] mt-3 font-medium">✓ Uploaded</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ─── STEP 4 ─── */}
                        {/* ─── STEP 4 ─── */}
                        {/* ─── STEP 4 ─── */}
            {currentStep === 4 && (
              <div className="space-y-8">
                <h2 className="text-2xl font-semibold text-[var(--blue)]">Professional Information</h2>

                {/* Improved Primary Skill with Category + Skills Dropdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[var(--blue)] mb-2">Skill Category</label>
                    <select 
                      value={selectedCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--orange)]"
                    >
                      <option value="">Select Category</option>
                      {skillCategories.map(cat => (
                        <option key={cat.title} value={cat.title}>{cat.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--blue)] mb-2">Primary Skill</label>
                    
                    
                     
                      <select
    {...register('primary_skill')}
    onChange={(e) => {
      setValue('primary_skill', e.target.value)
      setValue('skills_categories', [e.target.value])
    }}
    className="mt-1 block w-[30%] rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--orange)]"
  >
    <option value="">Select Primary Skill</option>
    {availableSkills.map(skill => (
      <option key={skill} value={skill}>{skill}</option>
    ))}
  </select>
    <input type="hidden" {...register('skills_categories')} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--blue)] mb-1">Years of Experience</label>
                  <input
                    type="number"
                    {...register('years_of_experience', { valueAsNumber: true })}
                    min="0"
                    max="60"
                    className="mt-1 block w-[30%] rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--orange)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--blue)] mb-1">Preferred Work Location *</label>
                  <input {...register('work_location')} className="mt-1 block w-[40%] rounded-md border border-[var(--orange)] bg-[var(--background)] text-[var(--blue)] shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--orange)]" />
                  {errors.work_location && <p className="text-[var(--orange)] text-sm mt-1">{errors.work_location.message}</p>}
                </div>
              </div>
            )}            {/* ─── STEP 5 ─── */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-[var(--blue)]">Review & Submit</h2>

                <div className="grid md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="font-semibold text-[var(--blue)] mb-2">Personal</p>
                    <p>{getValues('first_name')} {getValues('last_name')}</p>
                    <p>{getValues('phone')}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--blue)] mb-2">Business</p>
                    <p>{getValues('business_name')}</p>
                    <p>ID: {getValues('business_id_number')} ({getValues('business_id_type')?.toUpperCase() || '—'})</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="font-semibold text-[var(--blue)] mb-2">Addresses</p>
                    <p>Residential: {getValues('residential_address')}</p>
                    <p>Shop: {getValues('shop_address')}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--blue)] mb-2">Association</p>
                    <p>{getValues('association_name')} – {getValues('association_address')}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--blue)] mb-2">Documents</p>
                    {['passport', 'government_id', 'trade_certificate', 'reference_letter'].map(k => (
                      <p key={k}>
                        {k.replace(/_/g, ' ')}: {uploads[k as keyof typeof uploads] ? 'Uploaded' : 'Not uploaded'}
                      </p>
                    ))}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--blue)] mb-2">Professional</p>
                    <p>Services: {getValues('primary_skill') || 'None'}</p>
                    <p>Experience: {getValues('years_of_experience') ?? '—'} years</p>
                    <p>Location: {getValues('work_location')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-10 pt-6 border-t border-[var(--blue)] border-opacity-20">
              <button
                type="button"
                onClick={() => currentStep > 1 && setCurrentStep(p => p - 1)}
                disabled={currentStep === 1 || isSubmitting}
                className="flex items-center gap-2 px-6 py-3 border border-[var(--blue)] border-opacity-40 rounded-lg text-[var(--blue)] disabled:opacity-50 hover:bg-[var(--blue)] hover:bg-opacity-10 transition"
              >
                <ArrowLeft className="w-5 h-5" /> Previous
              </button>

              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-3 bg-[var(--orange)] text-white rounded-lg hover:bg-opacity-90 disabled:opacity-60 transition font-medium"
                >
                  Next <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-[var(--orange)] text-white rounded-lg font-semibold hover:bg-opacity-90 transition"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Verification'}
                </button>
              )}            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


