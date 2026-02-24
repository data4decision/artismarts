'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Cropper, { Area } from 'react-easy-crop'
import { supabase } from '@/lib/supabase'
import { FaCamera, FaUserEdit, FaSave, FaTimes } from 'react-icons/fa'
import toast from 'react-hot-toast'


import getCroppedImg from '@/utils/getCroppedImg'  

interface Profile {
  first_name: string | null
  last_name: string | null
  phone: string | null
  residential_address: string | null
  state: string | null
  lga: string | null
  profile_image: string | null
}

const ProfilePage = () => {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    residential_address: '',
    state: '',
    lga: '',
  })

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Cropper states
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true)

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError) {
          console.error('Auth error:', authError)
          toast.error('Authentication problem. Please sign in again.')
          return
        }

        if (!user) {
          console.warn('No authenticated user')
          toast.error('Please sign in to view your profile')
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, phone, residential_address, state, lga, profile_image')
          .eq('id', user.id)
          .maybeSingle()

        if (error) {
          console.error('[Profile] Query error:', error)
          if (error.code === '42501') {
            toast.error('Permission denied – check RLS policies')
          } else {
            toast.error('Failed to load profile data')
          }
          return
        }

        if (!data) {
          toast('Profile not found – please complete your profile', { icon: '⚠️' })
          return
        }

        setProfile(data)
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
          residential_address: data.residential_address || '',
          state: data.state || '',
          lga: data.lga || '',
        })
        setPreviewUrl(data.profile_image || null)

      } catch (err) {
        console.error('[Profile] Unexpected error:', err)
        toast.error('Something went wrong while loading profile')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) fetchProfile()
      else {
        setProfile(null)
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (!selected.type.startsWith('image/')) {
      toast.error('Please select an image')
      return
    }

    if (selected.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }

    const url = URL.createObjectURL(selected)
    setFile(selected)
    setPreviewUrl(url)
    setCroppedPreview(null)
    setZoom(1)
    setCrop({ x: 0, y: 0 })
  }

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const createCroppedPreview = useCallback(async () => {
    try {
      if (!previewUrl || !croppedAreaPixels) return
      const cropped = await getCroppedImg(previewUrl, croppedAreaPixels)
      setCroppedPreview(cropped)
    } catch (e) {
      console.error(e)
    }
  }, [previewUrl, croppedAreaPixels])

  useEffect(() => {
    if (previewUrl && croppedAreaPixels) {
      createCroppedPreview()
    }
  }, [previewUrl, croppedAreaPixels, createCroppedPreview])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Not authenticated')
      return
    }

    let photoUrl = profile?.profile_image || null
    let uploadFile = file

    // Use cropped version if available
    if (croppedPreview && croppedPreview !== previewUrl && file) {
      const response = await fetch(croppedPreview)
      const blob = await response.blob()
      uploadFile = new File([blob], file.name || 'profile.jpg', { type: 'image/jpeg' })
    }

    if (uploadFile) {
      const fileExt = uploadFile.name.split('.').pop() || 'jpg'
      const fileName = `${user.id}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, uploadFile, {
          upsert: true,
          cacheControl: '3600',
        })

      if (uploadError) {
        console.error('[Upload] Error:', uploadError)
        toast.error(`Upload failed: ${uploadError.message}`)
        return
      }

      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName)

      photoUrl = urlData.publicUrl || null
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        first_name: formData.first_name || null,
        last_name: formData.last_name || null,
        phone: formData.phone || null,
        residential_address: formData.residential_address || null,
        state: formData.state || null,
        lga: formData.lga || null,
        profile_image: photoUrl,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Update failed:', updateError)
      toast.error(updateError.message.includes('permission') 
        ? 'Permission denied – check RLS' 
        : 'Failed to save changes')
      return
    }

    setProfile(prev => prev ? { ...prev, ...formData, profile_image: photoUrl } : null)
    setPreviewUrl(photoUrl)
    setFile(null)
    setCroppedPreview(null)
    setIsEditing(false)
    toast.success('Profile updated successfully!')
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <p className="text-lg text-[var(--blue)]">Loading profile...</p>
      </div>
    )
  }

  const displayName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(' ') || 'User'

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold text-[var(--blue)] mb-4">
          Welcome! Let set up your profile
        </h2>
        <p className="text-[var(--blue)] mb-8 max-w-md mx-auto">
          Click <span className="font-bold">Edit Profile</span> below to add your information.
        </p>
        <button
          onClick={() => setIsEditing(true)}
          className="inline-flex items-center gap-2 px-8 py-3 bg-[var(--orange)] text-white rounded-lg font-medium hover:bg-[var(--orange)]/90 transition shadow-md"
        >
          <FaUserEdit /> Edit Profile
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-0">
      <h1 className="text-2xl sm:text-3xl font-bold text-[var(--blue)] mb-8">My Profile</h1>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 sm:p-10 border-b bg-gradient-to-r from-[var(--blue)]/5 to-white">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-white shadow-xl">
              <Image
                src={previewUrl || '/default-avatar.png'}
                alt="Profile photo"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 128px, 160px"
              />
              {isEditing && (
                <label
                  htmlFor="profile-photo"
                  className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer hover:bg-black/60 transition"
                >
                  <FaCamera className="text-white text-4xl" />
                  <input
                    id="profile-photo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>

            <div className="text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--blue)]">{displayName}</h2>
              <p className="text-[var(--blue)] mt-2 text-lg">{profile.phone || 'No phone added'}</p>
              <p className="text-sm text-[var(--blue)] mt-3">
                {profile.residential_address && `${profile.residential_address}, `}
                {profile.state && `${profile.state}, `}
                {profile.lga || ''}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--blue)] mb-1.5">First Name</label>
                  <input
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-[var(--blue)] rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--blue)] mb-1.5">Last Name</label>
                  <input
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-[var(--blue)] rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--blue)] mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-[var(--blue)] rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--blue)] mb-1.5">Residential Address</label>
                <input
                  name="residential_address"
                  value={formData.residential_address}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-[var(--blue)] rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--blue)] mb-1.5">State</label>
                  <input
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-[var(--blue)] rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--blue)] mb-1.5">LGA</label>
                  <input
                    name="lga"
                    value={formData.lga}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-[var(--blue)] rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none"
                  />
                </div>
              </div>

              {/* ── Image Cropper Section ── */}
              {previewUrl && (
                <div className="mt-8 border-t pt-6">
                  <label className="block text-sm font-medium text-[var(--blue)] mb-3">
                    Adjust your profile picture (drag & zoom)
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
                      zoomWithScroll={true}
                    />
                  </div>

                  <div className="mt-4 flex items-center gap-4 max-w-md mx-auto">
                    <label className="text-sm text-gray-600 whitespace-nowrap">Zoom:</label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={0.1}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full accent-[var(--orange)]"
                    />
                    <span className="text-sm text-gray-600 w-10 text-right">
                      {zoom.toFixed(1)}×
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 pt-8">
                <button
                  type="submit"
                  className="flex-1 bg-[var(--orange)] text-white py-3 px-6 rounded-lg font-medium hover:bg-[var(--orange)]/90 transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <FaSave className="text-lg" /> Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false)
                    setFile(null)
                    setPreviewUrl(profile?.profile_image || null)
                    setCroppedPreview(null)
                    setZoom(1)
                    setCrop({ x: 0, y: 0 })
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition flex items-center justify-center gap-2"
                >
                  <FaTimes className="text-lg" /> Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-medium text-[var(--blue)] uppercase tracking-wide">First Name</h3>
                  <p className="mt-2 text-[var(--blue)] text-lg">{profile.first_name || '—'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[var(--blue)] uppercase tracking-wide">Last Name</h3>
                  <p className="mt-2 text-[var(--blue)] text-lg">{profile.last_name || '—'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[var(--blue)] uppercase tracking-wide">Phone</h3>
                  <p className="mt-2 text-[var(--blue)] text-lg">{profile.phone || '—'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[var(--blue)] uppercase tracking-wide">Address</h3>
                  <p className="mt-2 text-[var(--blue)]">{profile.residential_address || '—'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[var(--blue)] uppercase tracking-wide">State</h3>
                  <p className="mt-2 text-[var(--blue)]">{profile.state || '—'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[var(--blue)] uppercase tracking-wide">LGA</h3>
                  <p className="mt-2 text-[var(--blue)]">{profile.lga || '—'}</p>
                </div>
              </div>

              <button
                onClick={() => setIsEditing(true)}
                className="mt-6 inline-flex items-center gap-2 px-7 py-3 bg-[var(--blue)] text-white rounded-lg font-medium hover:bg-[var(--blue)]/90 transition shadow-md"
              >
                <FaUserEdit className="text-lg" /> Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage