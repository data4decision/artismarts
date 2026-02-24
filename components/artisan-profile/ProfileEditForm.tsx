

'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import Cropper, { Area } from 'react-easy-crop'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { FaSave, FaTimes, FaCamera } from 'react-icons/fa'
import getCroppedImg from '@/utils/getCroppedImg'
import PortfolioEditForm from './PortfolioEditForm' 
// import SkillsSection from '@/components/artisan-profile/SkillsSection'

interface ArtisanProfileFormData {
  first_name?: string | null
  last_name?: string | null
  business_name?: string | null
  primary_skill?: string | null
  phone?: string | null
  residential_address?: string | null
  state?: string | null
  lga?: string | null
  bio?: string | null
  skills?: string | null
  working_days?: string | null
  available_time_slots?: string | null
  profile_image?: string | null
  portfolio_items?: unknown[] | null }

type Props = {
  initialData: ArtisanProfileFormData | null
  onSave: (updated: ArtisanProfileFormData) => void
  onCancel: () => void
}

export default function ProfileEditForm({ initialData, onSave, onCancel }: Props) {
  const [formData, setFormData] = useState<ArtisanProfileFormData>(
    initialData ?? {}
  )

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialData?.profile_image ?? null
  )

  const [file, setFile] = useState<File | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Sync profile photo preview
  useEffect(() => {
    if (initialData?.profile_image && !previewUrl) {
      setPreviewUrl(initialData.profile_image)
    }
  }, [initialData, previewUrl])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value || null }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (!selected.type.startsWith('image/')) {
      toast.error('Please select an image file for profile photo')
      return
    }
    if (selected.size > 5 * 1024 * 1024) {
      toast.error('Profile photo must be under 5MB')
      return
    }

    const url = URL.createObjectURL(selected)
    setFile(selected)
    setPreviewUrl(url)
    setCroppedPreview(null)
    setZoom(1)
    setCrop({ x: 0, y: 0 })
  }

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const createCroppedPreview = useCallback(async () => {
    if (!previewUrl || !croppedAreaPixels) return
    try {
      const cropped = await getCroppedImg(previewUrl, croppedAreaPixels)
      setCroppedPreview(cropped)
    } catch (err: unknown) {
      console.error('Failed to create cropped preview:', err)
    }
  }, [previewUrl, croppedAreaPixels])

  useEffect(() => {
    if (previewUrl && croppedAreaPixels) createCroppedPreview()
  }, [previewUrl, croppedAreaPixels, createCroppedPreview])

  // ── Form Submit ──────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSaving(true);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No authenticated user');
    }

    let photoUrl = initialData?.profile_image ?? null;

    // Handle profile photo upload only if changed
    if (croppedPreview && file) {
      const blob = await fetch(croppedPreview).then((r) => r.blob());
      const uploadFile = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
      const fileName = `${user.id}-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, uploadFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      photoUrl = urlData.publicUrl;
    }

    // Prepare final data to save (formData already contains latest portfolio_items via callback)
    const finalData = {
      ...formData,
      profile_image: photoUrl,
      // If you have any other computed / normalized fields, add them here
    };

    const { error } = await supabase
      .from('profiles')
      .update(finalData)
      .eq('id', user.id);

    if (error) throw error;

    // Success path
    onSave({
      ...finalData,
    });

    toast.success('Profile updated successfully!');
  } catch (err: unknown) {
    console.error('Profile update failed:', err);
    toast.error('Failed to save profile. Please try again.');
  } finally {
    setIsSaving(false);
  }
};

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-10 space-y-10"
    >
      {/* Personal Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name</label>
          <input
            name="first_name"
            value={formData.first_name ?? ''}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none transition"
            placeholder="Your first name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name</label>
          <input
            name="last_name"
            value={formData.last_name ?? ''}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none transition"
            placeholder="Your last name"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Business / Brand Name</label>
          <input
            name="business_name"
            value={formData.business_name ?? ''}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none transition"
            placeholder="e.g. Chinedu's Tailoring Hub"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Primary Skill / Trade</label>
          <input
            name="primary_skill"
            value={formData.primary_skill ?? ''}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none transition"
            placeholder="e.g. Plumbing, Tailoring, Makeup Artistry"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone ?? ''}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none transition"
            placeholder="+234 800 000 0000"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Residential Address (private)</label>
          <input
            name="residential_address"
            value={formData.residential_address ?? ''}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none transition"
            placeholder="Street name, area (not shown publicly)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
          <input
            name="state"
            value={formData.state ?? ''}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none transition"
            placeholder="Lagos, Abuja, Rivers..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">LGA</label>
          <input
            name="lga"
            value={formData.lga ?? ''}
            onChange={handleChange}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none transition"
            placeholder="Ikeja, Surulere, Port Harcourt..."
          />
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Professional Bio</label>
        <textarea
          name="bio"
          value={formData.bio ?? ''}
          onChange={handleChange}
          rows={5}
          placeholder="Describe your experience, specialties, turnaround time, what makes your work special..."
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none resize-y min-h-[120px] transition"
        />
      </div>

      {/* Skills */}
     

{/* <SkillsSelector
  value={{
    categories: formData.primary_categories ?? [],
    skills: formData.skills ?? [],
  }}
  onChange={(newValue) => {
    setFormData(prev => ({
      ...prev,
      primary_categories: newValue.categories,
      skills: newValue.skills,
    }))
  }}
/> */}

      {/* Availability */}
      <div className="border-t pt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Availability & Working Schedule
        </h3>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Working Days (separate with comma)
            </label>
            <input
              name="working_days"
              value={formData.working_days ?? ''}
              onChange={handleChange}
              placeholder="Monday,Tuesday,Wednesday,Thursday,Friday"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Typical Available Hours / Slots
            </label>
            <input
              name="available_time_slots"
              value={formData.available_time_slots ?? ''}
              onChange={handleChange}
              placeholder="08:00-17:00, Monday to Friday"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none transition"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Example: 8am-5pm, Weekdays only, Morning hours preferred
            </p>
          </div>
        </div>
      </div>

      {/* Profile Photo Cropper */}
      {previewUrl && (
        <div className="border-t pt-8">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Profile Photo – Adjust & Preview
          </label>
          <div className="relative h-80 w-full max-w-md mx-auto bg-gray-100 rounded-xl overflow-hidden shadow-inner">
            <Cropper
              image={previewUrl}
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

          <div className="mt-5 flex items-center gap-4 max-w-md mx-auto">
            <label className="text-sm text-gray-600 whitespace-nowrap">Zoom:</label>
            <input
              type="range"
              min={1}
              max={5}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-[var(--orange)] cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-700 w-12 text-right">
              {zoom.toFixed(1)}×
            </span>
          </div>

          <label className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition text-gray-700 font-medium border border-gray-300">
            <FaCamera className="text-[var(--blue)]" />
            Change Photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>
      )}

      {/* Portfolio Section – separate component */}
      <PortfolioEditForm
  initialItems={initialData?.portfolio_items as PortfolioItem[] | undefined}
  onPortfolioChange={(updated) => {
    setFormData(prev => ({ ...prev, portfolio_items: updated }))
  }}
/>

      {/* Save / Cancel */}
      <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t">
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 bg-[var(--orange)] text-white py-3.5 rounded-xl font-medium hover:bg-orange-700 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-sm"
        >
          <FaSave className="text-lg" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-200 text-gray-800 py-3.5 rounded-xl font-medium hover:bg-gray-300 transition flex items-center justify-center gap-2"
        >
          <FaTimes className="text-lg" />
          Cancel
        </button>
      </div>
    </form>
  )
}