// app/artisan/certifications/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { FaCertificate, FaPlus, FaTrash, FaEdit, FaSave, FaTimes, FaSpinner } from 'react-icons/fa'

type Certification = {
  title: string
  issuer: string
  issueDate: string        // YYYY-MM-DD
  expiryDate?: string      // optional
  certificateUrl?: string  // optional
}

export default function CertificationsPage() {
  const [certs, setCerts] = useState<Certification[]>([])
  const [originalCerts, setOriginalCerts] = useState<Certification[]>([])
  const [editMode, setEditMode] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [form, setForm] = useState<Certification>({
    title: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    certificateUrl: '',
  })
  const [saving, setSaving] = useState(false)

  // Load certifications
  useEffect(() => {
    const loadCerts = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          toast.error('Please sign in')
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('certifications')
          .eq('id', user.id)
          .maybeSingle()

        if (error && error.code !== 'PGRST116') {
          console.error('Load error:', error)
          return
        }

        if (data?.certifications && Array.isArray(data.certifications)) {
          setCerts(data.certifications)
          setOriginalCerts(data.certifications)
        }
      } catch (err) {
        console.error(err)
      }
    }

    loadCerts()

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (['SIGNED_IN', 'TOKEN_REFRESHED', 'INITIAL_SESSION'].includes(event)) {
        loadCerts()
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const resetForm = () => {
    setForm({
      title: '',
      issuer: '',
      issueDate: '',
      expiryDate: '',
      certificateUrl: '',
    })
    setEditingIndex(null)
  }

  const startEdit = (index: number) => {
    setEditingIndex(index)
    setForm(certs[index])
    setEditMode(true)
  }

  const addNew = () => {
    resetForm()
    setEditMode(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const saveCert = () => {
    if (!form.title.trim() || !form.issuer.trim() || !form.issueDate) {
      toast.error('Title, Issuer and Issue Date are required')
      return
    }

    let updated: Certification[]

    if (editingIndex !== null) {
      updated = [...certs]
      updated[editingIndex] = { ...form }
    } else {
      updated = [...certs, { ...form }]
    }

    setCerts(updated)
    resetForm()
    setEditMode(false)
    toast.success(editingIndex !== null ? 'Updated' : 'Added')
  }

  const removeCert = (index: number) => {
    if (!confirm('Remove this certification?')) return
    const updated = certs.filter((_, i) => i !== index)
    setCerts(updated)
    toast.success('Removed')
  }

  const saveAll = async () => {
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

      toast.success('Saved successfully!')
      setOriginalCerts(certs)
      setEditMode(false)
    } catch (err: any) {
      console.error(err)
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const cancel = () => {
    setCerts(originalCerts)
    setEditMode(false)
    resetForm()
    toast.success('Changes discarded')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--blue)] mb-2 flex items-center justify-center gap-3">
            <FaCertificate className="text-[var(--orange)]" />
            Certifications
          </h1>
          <p className="text-[var(--blue)]">
            List your professional certifications
          </p>
        </div>

        {/* Card */}
        <div className="bg-[var(--white)] rounded-2xl shadow-md border border-gray-200 overflow-hidden">

          {/* Controls */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-2xl font-bold text-[var(--blue)]">
                Your Certifications {certs.length > 0 && `(${certs.length})`}
              </h2>

              {!editMode ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={addNew}
                    className="px-6 py-2.5 bg-[var(--orange)] text-white rounded-lg font-medium hover:bg-orange-600 transition flex items-center justify-center gap-2"
                  >
                    <FaPlus /> Add New
                  </button>
                  {certs.length > 0 && (
                    <button
                      onClick={() => setEditMode(true)}
                      className="px-6 py-2.5 bg-[var(--blue)] text-white rounded-lg font-medium hover:bg-[var(--blue)]/80 transition flex items-center justify-center gap-2"
                    >
                      <FaEdit /> Edit
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={saveAll}
                    disabled={saving}
                    className="px-6 py-2.5 bg-[var(--orange)] text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 transition flex items-center justify-center gap-2 flex-1"
                  >
                    <FaSave />
                    {saving ? 'Saving...' : 'Save All'}
                  </button>
                  <button
                    onClick={cancel}
                    className="px-6 py-2.5 bg-gray-200 text-[var(--blue)] rounded-lg font-medium hover:bg-gray-300 transition flex items-center justify-center gap-2 flex-1"
                  >
                    <FaTimes />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {certs.length === 0 && !editMode ? (
              <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <FaCertificate className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-xl font-medium text-gray-600 mb-3">
                  No certifications added
                </p>
                <button
                  onClick={addNew}
                  className="px-6 py-3 bg-[var(--orange)] text-white rounded-lg font-medium hover:bg-orange-600 transition"
                >
                  Add Certification
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {certs.map((cert, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-[var(--blue)]">
                          {cert.title}
                        </h3>
                        <p className="text-gray-700 mt-1">
                          {cert.issuer}
                        </p>
                        <div className="mt-2 text-sm text-gray-600 flex flex-wrap gap-x-6 gap-y-1">
                          <div>
                            <span className="font-medium">Issued:</span>{' '}
                            {new Date(cert.issueDate).toLocaleDateString('en-GB')}
                          </div>
                          {cert.expiryDate && (
                            <div>
                              <span className="font-medium">Expires:</span>{' '}
                              {new Date(cert.expiryDate).toLocaleDateString('en-GB')}
                            </div>
                          )}
                        </div>
                        {cert.certificateUrl && (
                          <a
                            href={cert.certificateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-2 text-[var(--orange)] hover:underline text-sm font-medium"
                          >
                            View Certificate
                          </a>
                        )}
                      </div>

                      {editMode && (
                        <div className="flex gap-3 self-start">
                          <button
                            onClick={() => startEdit(idx)}
                            className="p-2.5 text-[var(--blue)] hover:bg-blue-50 rounded-lg transition"
                          >
                            <FaEdit size={18} />
                          </button>
                          <button
                            onClick={() => removeCert(idx)}
                            className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <FaTrash size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {editMode && (
                  <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 mt-6">
                    <h3 className="text-lg font-semibold text-[var(--blue)] mb-5 flex items-center gap-2">
                      <FaPlus className="text-[var(--orange)]" />
                      {editingIndex !== null ? 'Edit Certification' : 'Add Certification'}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Title *
                        </label>
                        <input
                          name="title"
                          value={form.title}
                          onChange={handleChange}
                          placeholder="e.g. Certified Electrician"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none transition"
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
                          placeholder="e.g. Trade Test Council"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none transition"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--blue)] mb-1.5">
                          Issue Date *
                        </label>
                        <input
                          type="date"
                          name="issueDate"
                          value={form.issueDate}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none transition"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--blue)] mb-1.5">
                          Expiry Date (optional)
                        </label>
                        <input
                          type="date"
                          name="expiryDate"
                          value={form.expiryDate || ''}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none transition"
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
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--orange)] focus:border-[var(--orange)] outline-none transition"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={saveCert}
                        className="flex-1 px-6 py-3 bg-[var(--orange)] text-white rounded-lg font-medium hover:bg-orange-600 transition flex items-center justify-center gap-2"
                      >
                        <FaSave />
                        {editingIndex !== null ? 'Update' : 'Add'}
                      </button>
                      <button
                        onClick={resetForm}
                        className="flex-1 px-6 py-3 bg-gray-200 text-[var(--blue)] rounded-lg font-medium hover:bg-gray-300 transition flex items-center justify-center gap-2"
                      >
                        <FaTimes />
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}