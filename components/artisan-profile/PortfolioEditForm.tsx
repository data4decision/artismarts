'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { FaUpload, FaTrash } from 'react-icons/fa'

interface PortfolioItem {
  type: string
  url: string
  name: string
  uploaded_at: string
}

interface Props {
  initialItems?: PortfolioItem[] | null
  maxItems?: number
  onPortfolioChange?: (updatedItems: PortfolioItem[]) => void
}

export default function PortfolioEditForm({
  initialItems = [],
  maxItems = 5,
  onPortfolioChange,
}: Props) {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>(
    Array.isArray(initialItems) ? initialItems : []
  )
  const [loading, setLoading] = useState(true)

  // Load from database once on mount and on auth state change
  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setPortfolioItems([])
          onPortfolioChange?.([])
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('portfolio_items')
          .eq('id', user.id)
          .single()

        if (error) throw error

        const loaded = data?.portfolio_items ?? []
        // Ensure it's an array of the correct shape
        const safeLoaded = Array.isArray(loaded) ? loaded : []
        setPortfolioItems(safeLoaded)
        onPortfolioChange?.(safeLoaded)
      } catch (err) {
        console.error('Failed to load portfolio:', err)
        toast.error('Could not load portfolio items')
      } finally {
        setLoading(false)
      }
    }

    loadPortfolio()

    // Re-load on login/logout
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        loadPortfolio()
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, []) // intentional: no deps → load only once + auth changes

  // Whenever local state changes → notify parent form
  useEffect(() => {
    onPortfolioChange?.(portfolioItems)
  }, [portfolioItems, onPortfolioChange])

  const handlePortfolioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (portfolioItems.length >= maxItems) {
      toast.error(`You can only have up to ${maxItems} portfolio items`)
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be 10MB or smaller')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to upload')
        return
      }

      const ext = file.name.split('.').pop() || 'file'
      const random = Math.random().toString(36).slice(2, 10)
      const filename = `${user.id}-${Date.now()}-${random}.${ext}`
      const filepath = `${user.id}/${filename}`

      toast.loading('Uploading...')

      const { error: uploadError } = await supabase.storage
        .from('portfolio')
        .upload(filepath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('portfolio')
        .getPublicUrl(filepath)

      const newItem: PortfolioItem = {
        type: file.type,
        url: urlData.publicUrl,
        name: file.name,
        uploaded_at: new Date().toISOString(),
      }

      setPortfolioItems(prev => [...prev, newItem])

      toast.dismiss()
      toast.success('Added! Will be saved when you click "Save Changes"')
    } catch (err) {
      toast.dismiss()
      console.error('Upload failed:', err)
      toast.error('Failed to upload file')
    }
  }

  const removePortfolioItem = (index: number) => {
    setPortfolioItems(prev => prev.filter((_, i) => i !== index))
    toast.success('Removed! Will be saved when you click "Save Changes"')
  }

  if (loading) {
    return (
      <div className="text-center py-10 text-gray-500">
        Loading portfolio...
      </div>
    )
  }

  return (
    <div className="border-t pt-10">
      <h3 className="text-xl font-semibold text-gray-800 mb-5">
        Portfolio & Past Work (max {maxItems} items)
      </h3>

      <div className="space-y-8">
        {portfolioItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolioItems.map((item, index) => (
              <div
                key={item.url || index}
                className="group relative border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative h-48 bg-gray-50">
                  {item.type.startsWith('image/') ? (
                    <Image
                      src={item.url}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      onError={() => console.warn('Image failed to load:', item.url)}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-6 text-center text-gray-500">
                      <div>
                        <p className="font-medium">
                          {item.type.includes('pdf') ? 'PDF Document' : 'File'}
                        </p>
                        <p className="text-sm mt-2 break-all">{item.name}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(item.uploaded_at).toLocaleDateString()}
                  </p>
                </div>

                <button
                  onClick={() => removePortfolioItem(index)}
                  className="absolute top-3 right-3 bg-white/90 hover:bg-white text-red-600 p-2 rounded-full shadow-md opacity-90 hover:opacity-100 transition"
                  title="Remove item"
                >
                  <FaTrash size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {portfolioItems.length < maxItems ? (
          <label
            htmlFor="portfolio-upload"
            className="block cursor-pointer border-2 border-dashed border-blue-400 rounded-xl p-8 text-center hover:bg-blue-50 transition"
          >
            <FaUpload className="mx-auto text-4xl text-blue-500 mb-3" />
            <div className="font-medium text-blue-600">Upload Image or Document</div>
            <div className="text-sm text-gray-500 mt-1">
              JPG, PNG, PDF • max 10 MB
            </div>
            <input
              id="portfolio-upload"
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              className="hidden"
              onChange={handlePortfolioFileChange}
            />
          </label>
        ) : (
          <div className="text-center p-6 bg-amber-50 text-amber-800 rounded-xl border border-amber-200">
            Maximum {maxItems} items reached.<br />
            Remove one to add more.
          </div>
        )}
      </div>
    </div>
  )
}