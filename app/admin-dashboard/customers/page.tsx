'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Search, User, MapPin, Phone, Mail, Calendar } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

type Customer = {
  id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  email: string | null
  residential_address: string | null
  state: string | null
  lga: string | null
  created_at: string
  is_blocked: boolean
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          phone,
          email,
          residential_address,
          state,
          lga,
          created_at,
          is_blocked
        `)
        .eq('role', 'customer')
        .order('created_at', { ascending: false })

      if (error) throw error

      setCustomers(data || [])
      setFilteredCustomers(data || [])
    } catch (err: any) {
      console.error('Error fetching customers:', err)
      toast.error('Failed to load customers list')
    } finally {
      setLoading(false)
    }
  }

  // Real-time search/filter
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(customers)
      return
    }

    const term = searchTerm.toLowerCase().trim()
    const filtered = customers.filter(customer =>
      `${customer.first_name || ''} ${customer.last_name || ''}`.toLowerCase().includes(term) ||
      customer.phone?.includes(term) ||
      customer.email?.toLowerCase().includes(term) ||
      customer.state?.toLowerCase().includes(term) ||
      customer.lga?.toLowerCase().includes(term) ||
      customer.residential_address?.toLowerCase().includes(term)
    )

    setFilteredCustomers(filtered)
  }, [searchTerm, customers])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/70 flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-orange-500 border-opacity-70 shadow-lg"></div>
          <div className="absolute inset-0 flex items-center justify-center animate-pulse">
            <div className="bg-white rounded-full p-3 shadow-md">
              <Image
                src="/log.png"
                width={56}
                height={56}
                priority
                alt="Loading..."
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--blue)]">All Customers</h1>
            <p className="mt-2 text-[var(--blue)]">
              Registered customers on the platform ({filteredCustomers.length})
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-[var(--blue)]" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name, phone, email, state..."
              className="block w-full pl-10 pr-3 py-2 border border-[var(--orange)] rounded-lg focus:ring-[var(--blue)] focus:border-[var(--blue)]/50 text-sm"
            />
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-10 text-center">
            <User className="w-16 h-16 mx-auto text-[var(--orange)] mb-4" />
            <h2 className="text-2xl font-semibold text-[var(--blue)] mb-2">
              No customers found
            </h2>
            <p className="text-[var(--blue)]">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'No customers have registered yet'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCustomers.map(customer => (
              <div
                key={customer.id}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-8 h-8 text-[var(--blue)]" />
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-[var(--blue)]">
                        {customer.first_name} {customer.last_name}
                      </h3>
                      <p className="text-sm text-[var(--blue)] font-medium">
                        Customer
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm mb-5">
                    {customer.phone && (
                      <div className="flex items-center gap-2 text-[var(--blue)]">
                        <Phone className="w-4 h-4 text-[var(--blue)]" />
                        <span>{customer.phone}</span>
                      </div>
                    )}

                    {customer.email && (
                      <div className="flex items-center gap-2 text-[var(--blue)]">
                        <Mail className="w-4 h-4 text-[var(--blue)]" />
                        <span className="break-all">{customer.email}</span>
                      </div>
                    )}

                    {(customer.state || customer.lga || customer.residential_address) && (
                      <div className="flex items-center gap-2 text-[var(--blue)]">
                        <MapPin className="w-4 h-4 text-[var(--blue)]" />
                        <span>
                          {customer.state}
                          {customer.lga && `, ${customer.lga}`}
                          {customer.residential_address && ` • ${customer.residential_address}`}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-[var(--blue)] text-xs">
                      <Calendar className="w-4 h-4" />
                      <span>Joined: {formatDate(customer.created_at)}</span>
                    </div>

                    {customer.is_blocked && (
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Blocked
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Link
                      href={`/dashboard/admin/customers/${customer.id}`}
                      className="flex-1 text-center py-2 px-4 bg-[var(--blue)]/90 text-white rounded-lg hover:bg-[var(--blue)] transition text-sm font-medium"
                    >
                      View Profile
                    </Link>
                    <button
                      onClick={() => {
                        if (customer.phone) {
                          navigator.clipboard.writeText(customer.phone)
                          toast.success('Phone copied!')
                        }
                      }}
                      disabled={!customer.phone}
                      className="py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm disabled:opacity-50"
                    >
                      Copy Phone
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Refresh button */}
        <div className="mt-8 text-center">
          <button
            onClick={fetchCustomers}
            className="px-6 py-3 bg-[var(--blue)] text-white rounded-lg hover:bg-[var(--blue)]/90 transition"
          >
            Refresh List
          </button>
        </div>
      </div>
    </div>
  )
}