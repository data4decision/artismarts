'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { FaEdit, FaTrash, FaUpload, FaSpinner, FaSave, FaTimes, FaCheck, FaImage } from 'react-icons/fa'

type PortfolioItem = {
  url: string
  name?: string
  type?: string
  uploaded_at?: string
}

export default function PortfolioManagerPage() {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [originalItems, setOriginalItems] = useState<PortfolioItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingNameIndex, setEditingNameIndex] = useState<number | null>(null)
  const [editingNameValue, setEditingNameValue] = useState('')

  const nameInputRef = useRef<HTMLInputElement>(null)

  // ─── Load portfolio ────────────────────────────────────────────────
  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          toast.error('Please sign in')
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('portfolio_items')
          .eq('id', user.id)
          .maybeSingle()

        if (error && error.code !== 'PGRST116') throw error

        if (data?.portfolio_items && Array.isArray(data.portfolio_items)) {
          const valid = data.portfolio_items.filter(
            (i): i is PortfolioItem => i && typeof i.url === 'string' && i.url.trim()
          )
          setItems(valid)
          setOriginalItems(valid)
        }
      } catch (err) {
        console.error('Load failed:', err)
        toast.error('Failed to load portfolio')
      }
    }

    loadPortfolio()

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (['SIGNED_IN', 'TOKEN_REFRESHED', 'INITIAL_SESSION'].includes(event)) {
        loadPortfolio()
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  // Auto-focus name input
  useEffect(() => {
    if (editingNameIndex !== null && nameInputRef.current) {
      nameInputRef.current.focus()
    }
  }, [editingNameIndex])

  // ─── Upload handler ────────────────────────────────────────────────
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }

    setUploading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `portfolio/${fileName}`

      const { error: uploadErr } = await supabase.storage
        .from('portfolio')
        .upload(filePath, file, { upsert: true })

      if (uploadErr) throw uploadErr

      const { data: urlData } = supabase.storage
        .from('portfolio')
        .getPublicUrl(filePath)

      const newItem: PortfolioItem = {
        url: urlData.publicUrl,
        name: file.name,
        type: file.type,
        uploaded_at: new Date().toISOString(),
      }

      setItems(prev => [...prev, newItem])
      toast.success('Image added successfully')
    } catch (err: any) {
      console.error('Upload failed:', err)
      toast.error(err.message || 'Failed to upload image')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  // ─── Remove image ──────────────────────────────────────────────────
  const removeItem = (index: number) => {
    if (!confirm('Remove this image?')) return
    setItems(prev => prev.filter((_, i) => i !== index))
    toast.success('Image removed')
  }

  // ─── Start editing name ────────────────────────────────────────────
  const startEditName = (index: number) => {
    setEditingNameIndex(index)
    setEditingNameValue(items[index].name || '')
  }

  // ─── Save edited name ──────────────────────────────────────────────
  const saveName = (index: number) => {
    if (editingNameIndex !== index) return

    const trimmed = editingNameValue.trim()
    const updated = [...items]
    updated[index] = {
      ...updated[index],
      name: trimmed || undefined,
    }
    setItems(updated)
    setEditingNameIndex(null)
    setEditingNameValue('')
    toast.success('Name updated')
  }

  // ─── Cancel name edit ──────────────────────────────────────────────
  const cancelNameEdit = () => {
    setEditingNameIndex(null)
    setEditingNameValue('')
  }

  // ─── Save all changes ──────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({
          portfolio_items: items,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      toast.success('Portfolio saved successfully!')
      setOriginalItems(items)
      setIsEditMode(false)
      setEditingNameIndex(null)
    } catch (err: any) {
      console.error('Save failed:', err)
      toast.error(err.message || 'Failed to save portfolio')
    } finally {
      setSaving(false)
    }
  }

  // ─── Cancel edit mode ──────────────────────────────────────────────
  const handleCancel = () => {
    setItems(originalItems)
    setIsEditMode(false)
    setEditingNameIndex(null)
    toast.success('Changes discarded')
  }

  return (
    <div className=" bg-gray-50 py-2 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">

        {/* Header */}
        <div className="px-10 py-4">
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--blue)] mb-3">
            Your Portfolio
          </h1>
          <p className="text-[var(--blue)] max-w-2xl mx-auto text-sm  ">
            Showcase your best work. {isEditMode ? 'Edit below.' : 'Click Edit to update.'}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          <div className="p-5 sm:p-8">

            {/* Title + Mode Controls */}
            <div className="flex items-center justify-between sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h2 className="text-[15px] sm:text-xl font-bold text-[var(--blue)] flex items-center gap-3">
                <span className="text-[var(--orange)] text-[15px] sm:text-xl"><FaImage/></span>
                Portfolio {items.length > 0 && `(${items.length})`}
              </h2>

              {!isEditMode ? (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="px-2 py-1 bg-[var(--orange)] text-white rounded-lg font-medium hover:bg-[var(--blue)] transition flex items-center justify-center gap-2  sm:w-auto"
                >
                  <FaEdit />
                  Edit 
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleSave}
                    disabled={saving || uploading}
                    className="px-4 py-2 bg-[var(--blue)] text-white text-[12px] rounded-lg font-medium hover:bg-[var(--orange)]/90 disabled:opacity-50 transition flex items-center justify-center gap-2 flex-1"
                  >
                    <FaSave />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving || uploading}
                    className="px-4 py-2.5 bg-gray-200 text-[var(--blue)] text-[12px] rounded-lg font-medium hover:bg-gray-300 transition flex items-center justify-center gap-2 flex-1"
                  >
                    <FaTimes />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Portfolio Grid */}
            {items.length === 0 ? (
              <div className="text-center py-12 sm:py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p className="text-[var(--blue)] text-lg sm:text-xl font-medium mb-3">
                  Your portfolio is empty
                </p>
                <p className="text-sm sm:text-xl text-[var(--blue)] max-w-md mx-auto">
                  {isEditMode
                    ? 'Start by uploading images below.'
                    : 'Click "Edit Portfolio" to add your best work.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                {items.map((item, idx) => (
                  <div
                    key={item.url + idx}
                    className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-sm group hover:shadow-lg transition-all duration-300"
                  >
                    <Image
                      src={item.url}
                      alt={item.name || `Portfolio ${idx + 1}`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      quality={80}
                    />

                    {/* Name display */}
                    {item.name && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent pt-8 px-3 pb-2">
                        <p className="text-white text-xs sm:text-sm font-medium truncate">
                          {item.name}
                        </p>
                      </div>
                    )}

                    {/* Edit & Remove controls - only in edit mode */}
                    {isEditMode && (
                      <>
                        {/* Remove button */}
                        <button
                          onClick={() => removeItem(idx)}
                          className="absolute top-3 right-3 bg-red-500/90 text-white p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:bg-red-600 transform hover:scale-110"
                          title="Remove image"
                        >
                          <FaTrash size={16} />
                        </button>

                        {/* Edit name button */}
                        <button
                          onClick={() => startEditName(idx)}
                          className={`absolute ${item.name ? 'bottom-3 right-14' : 'bottom-3 right-3'} bg-[var(--blue)]/90 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg hover:bg-[var(--blue)]`}
                          title="Edit name"
                        >
                          <FaEdit size={16} />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Upload - only visible in Edit Mode */}
            {isEditMode && (
              <div className="mt-8 flex justify-center">
                {uploading ? (
                  <div className="flex items-center gap-3 px-6 py-3 bg-gray-100 text-[var(--blue)] rounded-xl shadow-sm">
                    <FaSpinner className="animate-spin text-xl text-[var(--orange)]" />
                    <span className="font-medium">Uploading...</span>
                  </div>
                ) : (
                  <label className="inline-flex items-center justify-center gap-2 px-2 py-3 bg-[var(--orange)] text-white rounded-xl cursor-pointer hover:bg-[var(--orange)]/90 transition shadow-md w-full max-w-xs">
                    <FaUpload className="text-lg" />
                    <span className="font-medium">Add New Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUpload}
                      disabled={uploading || items.length >= 10}
                    />
                  </label>
                )}
              </div>
            )}

            {/* Max limit warning */}
            {isEditMode && items.length >= 10 && (
              <p className="text-center text-amber-600 mt-6 text-sm font-medium">
                Maximum 10 images reached. Remove some to add more.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}