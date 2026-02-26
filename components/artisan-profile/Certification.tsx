'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { FaCertificate, FaPlus, FaTrash, FaEdit, FaSave, FaTimes, FaSpinner } from 'react-icons/fa'

type Certification = {
  title: string
  issuer: string
  issueDate: string        // YYYY-MM-DD
  expiryDate?: string      // optional YYYY-MM-DD
  certificateUrl?: string  // optional URL
}

export default function CertificationsPage() {
  const [certs, setCerts] = useState<Certification[]>([])
  const [originalCerts, setOriginalCerts] = useState<Certification[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [form, setForm] = useState<Certification>({
    title: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    certificateUrl: '',
  })

  // Load certifications
  useEffect(() => {
    const loadCerts = async () => {
      setLoading(true)
      setError(null)

      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          toast.error('Please sign in to view certifications')
          router.push('/login')
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('certifications')
          .eq('id', user.id)
          .maybeSingle()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
          throw error
        }

        const loadedCerts = Array.isArray(data?.certifications) 
          ? data.certifications 
          : []

        setCerts(loadedCerts)
        setOriginalCerts(loadedCerts)
      } catch (err: any) {
        console.error('Load certifications error:', err)
        setError('Failed to load certifications. Please try again.')
        toast.error('Failed to load certifications')
      } finally {
        setLoading(false)
      }
    }

    loadCerts()

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (['SIGNED_IN', 'TOKEN_REFRESHED', 'INITIAL_SESSION'].includes(event)) {
        loadCerts()
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const hasChanges = JSON.stringify(certs) !== JSON.stringify(originalCerts)

  const startEdit = (index: number) => {
    setEditingIndex(index)
    setForm({ ...certs[index] })
  }

  const addNew = () => {
    setEditingIndex(-1) // -1 means adding new
    setForm({
      title: '',
      issuer: '',
      issueDate: '',
      expiryDate: '',
      certificateUrl: '',
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const saveItem = () => {
    if (!form.title.trim() || !form.issuer.trim() || !form.issueDate) {
      toast.error('Title, Issuer and Issue Date are required')
      return false
    }

    // Basic date validation
    if (form.issueDate && !/^\d{4}-\d{2}-\d{2}$/.test(form.issueDate)) {
      toast.error('Invalid issue date format')
      return false
    }
    if (form.expiryDate && !/^\d{4}-\d{2}-\d{2}$/.test(form.expiryDate)) {
      toast.error('Invalid expiry date format')
      return false
    }

    let updated = [...certs]

    if (editingIndex === -1) {
      // Add new
      updated = [...updated, { ...form }]
    } else if (editingIndex !== null) {
      // Update existing
      updated[editingIndex] = { ...form }
    }

    setCerts(updated)
    setEditingIndex(null)
    toast.success(editingIndex === -1 ? 'Certification added' : 'Certification updated')
    return true
  }

  const removeCert = (index: number) => {
    if (!confirm('Remove this certification?')) return
    const updated = certs.filter((_, i) => i !== index)
    setCerts(updated)
    setEditingIndex(null)
    toast.success('Certification removed')
  }

  const saveAll = async () => {
    if (!hasChanges) {
      toast.info('No changes to save')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      const { error } = await supabase
        .from('profiles')
        .update({
          certifications: certs,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      toast.success('All changes saved successfully!')
      setOriginalCerts(certs)
    } catch (err: any) {
      console.error('Save error:', err)
      toast.error(err.message || 'Failed to save certifications')
    } finally {
      setSaving(false)
    }
  }

  const cancel = () => {
    if (hasChanges && !confirm('Discard all unsaved changes?')) return
    setCerts(originalCerts)
    setEditingIndex(null)
    toast.info('Changes discarded')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FaSpinner className="animate-spin text-5xl text-[var(--orange)] mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading certifications...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6 bg-white rounded-xl shadow">
          <p className="text-red-600 text-xl mb-4">Error</p>
          <p className="text-gray-700 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[var(--orange)] text-white rounded-lg hover:bg-orange-600"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[var(--blue)] mb-2 flex items-center justify-center gap-3">
            <FaCertificate className="text-[var(--orange)]" />
            Certifications
          </h1>
          <p className="text-gray-600">
            Showcase your professional qualifications
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl shadow border border-gray-200">
          <h2 className="text-xl font-semibold text-[var(--blue)]">
            Your Certifications {certs.length > 0 && `(${certs.length})`}
          </h2>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={addNew}
              className="px-5 py-2.5 bg-[var(--orange)] text-white rounded-lg font-medium hover:bg-orange-600 transition flex items-center gap-2"
            >
              <FaPlus /> Add New
            </button>

            {hasChanges && (
              <>
                <button
                  onClick={saveAll}
                  disabled={saving}
                  className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-60 transition flex items-center gap-2"
                >
                  <FaSave />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>

                <button
                  onClick={cancel}
                  className="px-5 py-2.5 bg-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-400 transition flex items-center gap-2"
                >
                  <FaTimes /> Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* List */}
        <div className="space-y-5">
          {certs.length === 0 ? (
            <div className="bg-white rounded-xl shadow border border-dashed border-gray-300 p-12 text-center">
              <FaCertificate className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">
                No certifications added yet
              </h3>
              <p className="text-gray-500 mb-6">
                Add your professional certifications to strengthen your profile
              </p>
              <button
                onClick={addNew}
                className="px-6 py-3 bg-[var(--orange)] text-white rounded-lg font-medium hover:bg-orange-600 transition"
              >
                Add Your First Certification
              </button>
            </div>
          ) : (
            certs.map((cert, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl shadow border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                {editingIndex === idx ? (
                  // Edit form inline
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Title *
                        </label>
                        <input
                          name="title"
                          value={form.title}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Issuer *
                        </label>
                        <input
                          name="issuer"
                          value={form.issuer}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Issue Date *
                        </label>
                        <input
                          type="date"
                          name="issueDate"
                          value={form.issueDate}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Expiry Date (optional)
                        </label>
                        <input
                          type="date"
                          name="expiryDate"
                          value={form.expiryDate || ''}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Certificate URL (optional)
                        </label>
                        <input
                          name="certificateUrl"
                          value={form.certificateUrl || ''}
                          onChange={handleChange}
                          placeholder="https://..."
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mt-6">
                      <button
                        onClick={() => {
                          if (saveItem()) setEditingIndex(null)
                        }}
                        className="flex-1 px-6 py-3 bg-[var(--orange)] text-white rounded-lg font-medium hover:bg-orange-600 transition flex items-center justify-center gap-2"
                      >
                        <FaSave /> Update
                      </button>
                      <button
                        onClick={() => setEditingIndex(null)}
                        className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition flex items-center justify-center gap-2"
                      >
                        <FaTimes /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-[var(--blue)] mb-1">
                        {cert.title}
                      </h3>
                      <p className="text-gray-700 font-medium">{cert.issuer}</p>
                      <div className="mt-3 text-sm text-gray-600 flex flex-wrap gap-x-6 gap-y-1">
                        <div>
                          <span className="font-medium">Issued:</span>{' '}
                          {new Date(cert.issueDate).toLocaleDateString('en-GB', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        {cert.expiryDate && (
                          <div>
                            <span className="font-medium">Expires:</span>{' '}
                            {new Date(cert.expiryDate).toLocaleDateString('en-GB', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        )}
                      </div>
                      {cert.certificateUrl && (
                        <a
                          href={cert.certificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center gap-2 text-[var(--orange)] hover:underline font-medium"
                        >
                          View Certificate →
                        </a>
                      )}
                    </div>

                    <div className="flex gap-3 self-start mt-4 sm:mt-0">
                      <button
                        onClick={() => startEdit(idx)}
                        className="p-3 text-[var(--blue)] hover:bg-blue-50 rounded-lg transition"
                        title="Edit"
                      >
                        <FaEdit size={20} />
                      </button>
                      <button
                        onClick={() => removeCert(idx)}
                        className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Remove"
                      >
                        <FaTrash size={20} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Add new form - shown when clicking Add New */}
          {editingIndex === -1 && (
            <div className="bg-white rounded-xl shadow border border-dashed border-[var(--orange)] p-6 mt-6">
              <h3 className="text-xl font-semibold text-[var(--blue)] mb-6 flex items-center gap-3">
                <FaPlus className="text-[var(--orange)]" />
                Add New Certification
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Certified Master Electrician"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issuer *
                  </label>
                  <input
                    name="issuer"
                    value={form.issuer}
                    onChange={handleChange}
                    placeholder="e.g. City & Guilds"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    name="issueDate"
                    value={form.issueDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date (optional)
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={form.expiryDate || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none transition"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificate URL (optional)
                  </label>
                  <input
                    name="certificateUrl"
                    value={form.certificateUrl || ''}
                    onChange={handleChange}
                    placeholder="https://example.com/cert.pdf"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none transition"
                  />
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => {
                    if (saveItem()) setEditingIndex(null)
                  }}
                  className="flex-1 px-8 py-4 bg-[var(--orange)] text-white rounded-lg font-medium hover:bg-orange-600 transition flex items-center justify-center gap-2 text-lg"
                >
                  <FaSave /> Add Certification
                </button>
                <button
                  onClick={() => setEditingIndex(null)}
                  className="flex-1 px-8 py-4 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition flex items-center justify-center gap-2 text-lg"
                >
                  <FaTimes /> Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}