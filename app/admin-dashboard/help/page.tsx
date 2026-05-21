'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  FaLightbulb,
  FaTools,
  FaInfoCircle,
  FaSearch,
} from 'react-icons/fa'

interface SupportItem {
  id: string
  user_id: string
  category: string
  message: string
  created_at: string
}

const categoryStyles: Record<
  string,
  {
    label: string
    icon: React.ReactNode
    bg: string
    text: string
  }
> = {
  feature_request: {
    label: 'Feature Request',
    icon: <FaLightbulb />,
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
  },

  technical_issue: {
    label: 'Technical Issue',
    icon: <FaTools />,
    bg: 'bg-purple-100',
    text: 'text-red-700',
  },

  general_help: {
    label: 'General Help',
    icon: <FaInfoCircle />,
    bg: 'bg-blue-100',
    text: 'text-blue-700',
  },
}

const Page = () => {
  const [supportData, setSupportData] = useState<SupportItem[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchSupportMessages()
  }, [])

  const fetchSupportMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('help_supports')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setSupportData(data || [])
    } catch (error) {
      console.error('Failed to fetch support messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredData = useMemo(() => {
    return supportData.filter((item) => {
      const matchesFilter =
        filter === 'all'
          ? true
          : item.category === filter

      const matchesSearch =
        item.message
          .toLowerCase()
          .includes(search.toLowerCase())

      return matchesFilter && matchesSearch
    })
  }, [supportData, search, filter])

  const totalMessages = supportData.length

  const featureRequests = supportData.filter(
    (item) => item.category === 'feature_request'
  ).length

  const technicalIssues = supportData.filter(
    (item) => item.category === 'technical_request'
  ).length

  const generalHelp = supportData.filter(
    (item) => item.category === 'general_help'
  ).length

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold text-[var(--blue)]'>
          Help & Support Dashboard
        </h1>

        <p className='text-[var(--blue)]/70 mt-2'>
          Manage feature requests, technical issues, and support messages from Artismart users.
        </p>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <div className='bg-white rounded-2xl border shadow-sm p-5'>
          <p className='text-sm text-[var(--blue)]/70'>
            Total Messages
          </p>

          <h2 className='text-3xl font-bold text-[var(--blue)] mt-2'>
            {totalMessages}
          </h2>
        </div>

        <div className='bg-white rounded-2xl border shadow-sm p-5'>
          <p className='text-sm text-[var(--blue)]/70'>
            Feature Requests
          </p>

          <h2 className='text-3xl font-bold text-yellow-600 mt-2'>
            {featureRequests}
          </h2>
        </div>

        <div className='bg-white rounded-2xl border shadow-sm p-5'>
          <p className='text-sm text-[var(--blue)]/70'>
            Technical Issues
          </p>

          <h2 className='text-3xl font-bold text-red-600 mt-2'>
            {technicalIssues}
          </h2>
        </div>

        <div className='bg-white rounded-2xl border shadow-sm p-5'>
          <p className='text-sm text-[var(--blue)]/70'>
            General Help
          </p>

          <h2 className='text-3xl font-bold text-blue-600 mt-2'>
            {generalHelp}
          </h2>
        </div>
      </div>

      {/* Search and Filter */}
      <div className='bg-white rounded-2xl border shadow-sm p-4 flex flex-col md:flex-row gap-4 md:items-center md:justify-between'>
        <div className='relative w-full md:max-w-md'>
          <FaSearch className='absolute top-1/2 -translate-y-1/2 left-4 text-[var(--blue)]/50' />

          <input
            type='text'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search support messages...'
            className='w-full border rounded-xl pl-11 pr-4 py-3 outline-none focus:border-[var(--orange)]'
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className='border rounded-xl px-4 py-3 outline-none focus:border-[var(--orange)] text-[var(--blue)]'
        >
          <option value='all'>All Categories</option>

          <option value='feature_request'>
            Feature Requests
          </option>

          <option value='technical_request'>
            Technical Issues
          </option>

          <option value='general_help'>
            General Help
          </option>
        </select>
      </div>

      {/* Table */}
      <div className='bg-white rounded-2xl border shadow-sm overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-[var(--blue)] text-white'>
              <tr>
                <th className='text-left px-6 py-4 font-semibold'>
                  Category
                </th>

                <th className='text-left px-6 py-4 font-semibold'>
                  Message
                </th>

                <th className='text-left px-6 py-4 font-semibold'>
                  User ID
                </th>

                <th className='text-left px-6 py-4 font-semibold'>
                  Date
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className='text-center py-10 text-[var(--blue)]/70'
                  >
                    Loading support messages...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className='text-center py-10 text-[var(--blue)]/70'
                  >
                    No support messages found.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => {
                  const style = categoryStyles[item.category]

                  return (
                    <tr
                      key={item.id}
                      className='border-b hover:bg-gray-50 transition-all duration-200'
                    >
                      {/* Category */}
                      <td className='px-6 py-5'>
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${style?.bg} ${style?.text}`}
                        >
                          {style?.icon}
                          {style?.label}
                        </div>
                      </td>

                      {/* Message */}
                      <td className='px-6 py-5 text-[var(--blue)] max-w-lg'>
                        <p className='line-clamp-3'>
                          {item.message}
                        </p>
                      </td>

                      {/* User */}
                      <td className='px-6 py-5 text-sm text-[var(--blue)]/70'>
                        {item.user_id.slice(0, 12)}...
                      </td>

                      {/* Date */}
                      <td className='px-6 py-5 text-sm text-[var(--blue)]/70'>
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Page