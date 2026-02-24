// /app/dashboard/artisan/profile/edit/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Cropper, { Area } from 'react-easy-crop'
import getCroppedImg from '@/utils/getCroppedImg'
import toast from 'react-hot-toast'
import { FaCamera, FaSave, FaTimes, FaSpinner } from 'react-icons/fa'
import Image from 'next/image'

interface ProfileData {
  first_name?: string | null
  last_name?: string | null
  business_name?: string | null
  primary_skill?: string | null
  phone?: string | null
  residential_address?: string | null
  state?: string | null
  lga?: string | null
  profile_image?: string | null
}

export default function EditArtisanProfile() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<ProfileData>({})

  // Photo states
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [newFile, setNewFile] = useState<File | null>(null)
  const [isCropping, setIsCropping] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [croppedDataUrl, setCroppedDataUrl] = useState<string | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          toast.error('Please sign in first')
          router.push('/login')
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, business_name, primary_skill, phone, residential_address, state, lga, profile_image')
          .eq('id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') throw error

        setProfile(data || {})
        setPreviewUrl(data?.profile_image || null)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error while loading profile'
        console.error(errorMessage, err)
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value || null }))
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB')
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setNewFile(file)
    setPreviewUrl(objectUrl)
    setCroppedDataUrl(null)
    setZoom(1)
    setCrop({ x: 0, y: 0 })
    setIsCropping(true)
  }

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const generateCroppedImage = useCallback(async () => {
    if (!previewUrl || !croppedAreaPixels) return
    try {
      const cropped = await getCroppedImg(previewUrl, croppedAreaPixels)
      setCroppedDataUrl(cropped)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to crop image'
      console.error(errorMessage, err)
      toast.error(errorMessage)
    }
  }, [previewUrl, croppedAreaPixels])

  useEffect(() => {
    if (previewUrl && croppedAreaPixels) {
      generateCroppedImage()
    }
  }, [previewUrl, croppedAreaPixels, generateCroppedImage])

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      let photoUrl = profile.profile_image

      if (croppedDataUrl && newFile) {
        const blob = await fetch(croppedDataUrl).then(r => r.blob())
        const fileName = `${user.id}-${Date.now()}.jpg`
        const uploadFile = new File([blob], fileName, { type: 'image/jpeg' })

        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, uploadFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(fileName)

        photoUrl = urlData.publicUrl
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          ...profile,
          profile_image: photoUrl,
        })
        .eq('id', user.id)

      if (error) throw error

      toast.success('Profile updated successfully!')

      // Redirect to view page after short delay
      setTimeout(() => {
        router.push('/dashboard/artisan/profile')
      }, 1200)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save profile'
      console.error(errorMessage, err)
      toast.error(errorMessage + '. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--white)]">
        <FaSpinner className="animate-spin text-5xl text-[var(--orange)]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--white)] py-8 px-4">
      <div className="max-w-3xl mx-auto bg-[var(--white)] rounded-2xl shadow border border-gray-200 p-6 md:p-10">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center md:text-left">
          Edit Profile
        </h1>

        {/* Photo + Cropper Section */}
        <div className="flex flex-col md:flex-row gap-8 mb-10 pb-10 border-b border-gray-200">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-44 h-44 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg bg-gray-50">
              {previewUrl ? (
                <Image src={previewUrl} alt="Profile" fill className="object-cover" unoptimized={previewUrl.startsWith('blob:')} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl bg-gray-100">
                  No photo
                </div>
              )}
            </div>

            <label className="cursor-pointer flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium border border-gray-300">
              <FaCamera className="text-[var(--blue)]" />
              {previewUrl ? 'Change Photo' : 'Upload Photo'}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
            </label>
          </div>

          {isCropping && (
            <div className="flex-1 space-y-6">
              <div className="relative h-80 w-full max-w-md mx-auto bg-gray-100 rounded-xl overflow-hidden shadow-inner">
                <Cropper
                  image={previewUrl ?? undefined}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  cropShape="round"
                  showGrid={false}
                />
              </div>

              <div className="flex items-center gap-4 max-w-md mx-auto px-2">
                <span className="text-sm text-gray-600 whitespace-nowrap">Zoom:</span>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={0.1}
                  value={zoom}
                  onChange={e => setZoom(Number(e.target.value))}
                  className="w-full accent-[var(--orange)] cursor-pointer"
                />
                <span className="text-sm font-medium w-12 text-right">{zoom.toFixed(1)}×</span>
              </div>
            </div>
          )}
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
            <input name="first_name" value={profile.first_name ?? ''} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none transition" placeholder="First name" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
            <input name="last_name" value={profile.last_name ?? ''} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none transition" placeholder="Last name" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Business / Brand Name</label>
            <input name="business_name" value={profile.business_name ?? ''} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none transition" placeholder="e.g. Kayode Plumbing Services" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Primary Skill / Trade</label>
            <input name="primary_skill" value={profile.primary_skill ?? ''} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none transition" placeholder="e.g. Plumber" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
            <input type="tel" name="phone" value={profile.phone ?? ''} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none transition" placeholder="+234 800 000 0000" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Residential Address <span className="text-xs text-gray-500">(private – not shown publicly)</span></label>
            <input name="residential_address" value={profile.residential_address ?? ''} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none transition" placeholder="Street, Area" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
            <input name="state" value={profile.state ?? ''} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none transition" placeholder="Oyo, Lagos..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">LGA</label>
            <input name="lga" value={profile.lga ?? ''} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none transition" placeholder="Ibadan North, Ilorin West..." />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-[var(--orange)] text-[var(--white)] py-3.5 rounded-xl font-medium hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 shadow-md transition"
          >
            {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          <button
            onClick={handleCancel}
            disabled={saving}
            className="flex-1 bg-gray-200 text-gray-800 py-3.5 rounded-xl font-medium hover:bg-gray-300 flex items-center justify-center gap-2 shadow-md transition"
          >
            <FaTimes />
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}