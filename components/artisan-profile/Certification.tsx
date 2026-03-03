'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { FaCertificate, FaPlus, FaTrash, FaEdit, FaSave, FaTimes, FaSpinner } from 'react-icons/fa'

type Certification = {
  title: string
  issuer: string
  issueDate: string
  expiryDate?: string
  certificateUrl?: string
}

export default function CertificationsPage() {
  const [certs, setCerts] = useState<Certification[]>([])
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
  const [loading, setLoading] = useState(true)

  // Load certifications once
  useEffect(() => {
    const loadCerts = async () => {
      setLoading(true)
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
          toast.error('Could not load certifications')
          return
        }

        const loaded = Array.isArray(data?.certifications) ? data.certifications : []
        setCerts(loaded)
      } catch (err) {
        console.error(err)
        toast.error('Error loading data')
      } finally {
        setLoading(false)
      }
    }

    loadCerts()
  }, [])

  const resetForm = () => {
    setForm({ title: '', issuer: '', issueDate: '', expiryDate: '', certificateUrl: '' })
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
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  // ── Core: Save single certification to DB ───────────────────────
  const saveToDatabase = async (newList: Certification[]) => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({
          certifications: newList,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      return true
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to save')
      return false
    } finally {
      setSaving(false)
    }
  }

  // ── Add or update (persist immediately) ───────────────────────────
  const saveCert = async () => {
    if (!form.title.trim() || !form.issuer.trim() || !form.issueDate) {
      toast.error('Title, Issuer and Issue Date are required')
      return
    }

    let updated: Certification[]

    if (editingIndex !== null) {
      updated = certs.map((item, i) => (i === editingIndex ? { ...form } : item))
    } else {
      updated = [...certs, { ...form }]
    }

    const success = await saveToDatabase(updated)
    if (success) {
      setCerts(updated)
      resetForm()
      setEditMode(false)
      toast.success(editingIndex !== null ? 'Certification updated' : 'Certification added')
    }
    // else → toast already shown, list stays as-is
  }

  // ── Remove (persist immediately) ─────────────────────────────────
  const removeCert = async (index: number) => {
    if (!confirm('Remove this certification?')) return

    const updated = certs.filter((_, i) => i !== index)

    const success = await saveToDatabase(updated)
    if (success) {
      setCerts(updated)
      toast.success('Certification removed')
    }
  }

  const cancel = () => {
    resetForm()
    setEditMode(false)
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <FaSpinner className="animate-spin text-5xl text-[var(--orange)]" />
      </div>
    )
  }

  return (
    <div className="bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--blue)] mb-2 flex items-center justify-center gap-3">
            <FaCertificate className="text-[var(--orange)] text-xl md:text-2xl" />
            Certifications
          </h1>
          <p className="text-[var(--blue)] text-sm">List your professional certifications</p>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
          {/* Controls */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-sm md:text-xl font-bold text-[var(--blue)]">
                Your Certifications {certs.length > 0 && `(${certs.length})`}
              </h2>

              {!editMode ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={addNew}
                    className="px-6 py-2.5 text-sm md:text-base bg-[var(--orange)] text-white rounded-lg font-medium hover:bg-orange-600 transition flex items-center justify-center gap-2"
                  >
                    <FaPlus /> Add New
                  </button>
                  {certs.length > 0 && (
                    <button
                      onClick={() => setEditMode(true)}
                      className="px-6 py-2.5 bg-[var(--blue)] text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                    >
                      <FaEdit /> Edit Mode
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={cancel}
                    className="px-6 py-2.5 bg-gray-200 text-[var(--blue)] rounded-lg font-medium hover:bg-gray-300 transition flex items-center justify-center gap-2 flex-1"
                  >
                    <FaTimes /> Done
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
                <p className="text-sm md:text-xl font-medium text-[var(--blue)] mb-3">
                  No certifications added yet
                </p>
                <button
                  onClick={addNew}
                  className="px-6 py-3 bg-[var(--orange)] text-white rounded-lg font-medium hover:bg-orange-600 transition"
                >
                  Add Your First Certification
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
                        <h3 className="text-xl font-bold text-[var(--blue)]">{cert.title}</h3>
                        <p className="text-[var(--blue)] mt-1">{cert.issuer}</p>
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
                            View Certificate →
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
                            disabled={saving}
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
                      {/* same form fields as before */}
                      <div>
                        <label className="block text-sm font-medium text-[var(--blue)] mb-1.5">Title *</label>
                        <input name="title" value={form.title} onChange={handleChange} className="w-full px-4 py-2.5 border ..." required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--blue)] mb-1.5">Issuer *</label>
                        <input name="issuer" value={form.issuer} onChange={handleChange} className="w-full px-4 py-2.5 border ..." required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--blue)] mb-1.5">Issue Date *</label>
                        <input type="date" name="issueDate" value={form.issueDate} onChange={handleChange} className="w-full px-4 py-2.5 border ..." required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--blue)] mb-1.5">Expiry Date (optional)</label>
                        <input type="date" name="expiryDate" value={form.expiryDate || ''} onChange={handleChange} className="w-full px-4 py-2.5 border ..." />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-[var(--blue)] mb-1.5">Certificate URL (optional)</label>
                        <input name="certificateUrl" value={form.certificateUrl || ''} onChange={handleChange} placeholder="https://" className="w-full px-4 py-2.5 border ..." />
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={saveCert}
                        disabled={saving}
                        className="flex-1 px-6 py-3 bg-[var(--orange)] text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-60 transition flex items-center justify-center gap-2"
                      >
                        {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                        {editingIndex !== null ? 'Update' : 'Add & Save'}
                      </button>
                      <button
                        onClick={cancel}
                        className="flex-1 px-6 py-3 bg-gray-200 text-[var(--blue)] rounded-lg font-medium hover:bg-gray-300 transition flex items-center justify-center gap-2"
                      >
                        <FaTimes /> Cancel
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