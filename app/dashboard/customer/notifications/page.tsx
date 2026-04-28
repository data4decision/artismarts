'use client'
import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { FaCheck } from 'react-icons/fa'


interface NotificationItem {
  id: string
  title: string
  message: string
  read: boolean
  createdAt: string
  type: string
  jobRequestId?: string
}
const Page = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [filter, setFilter] = useState<'all'| 'unread' | 'read'>('all')

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true})))
    toast.success (
      <div className="bg-[var(--white)] text-[var(--blue)] border-[var(--orange)]">All notifications marked as read</div>
    ) 
  }

  // filter logic

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true
    if (filter === 'unread') return !notif.read
    if (filter === 'read') return notif.read
    return true
  })
  return (
    <div className='min-h-screen bg-[var(--blue)]/20 py-8 px-4'>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="">
            <h1 className='text-4xl font-bold text-[var(--blue)]'>Notifications</h1>
          <p className='text-[var(--blue)] mt-2'>All job activity and updates</p>
          </div>
          {notifications.length > 0 && (
            <button onClick={markAllAsRead}
            className='px-6 py-3 bg-[var(--orange)] text-[var(--white)] rounded-xl items-center gap-2 transition'>
              <FaCheck/> Mark all as read
            </button>
          )}
        </div>
        {/* Filters: All | Unread | Read */}
        <div className="flex gap-6 mb-8 border-b border-[var(--orange)]">
          <button onClick={() => setFilter('all')}
            className={`pb-4 text-lg font-medium border-b-2 transition ${
              filter === 'all'
              ? 'border-[var(--orange)] text-[var(--orange)]'
              : 'border-transparent text-[var(--blue)] hover:text-[var(--blue)]'
            }`}></button>
        </div>
      </div>
    </div>
  )
}

export default Page