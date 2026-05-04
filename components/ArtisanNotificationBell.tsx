'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FaBell, FaCheck, FaCog, FaTimes, FaUser } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface NotificationItem {
  id: string;
  title?: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: string;
  jobId?: string;

  customerName?: string;
  customerImage?: string | null;
  adminName?: string;
  adminImage?: string | null;
}

const ArtisanNotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const channelRef = useRef<any>(null);

  // ================= FETCH NOTIFICATIONS + CUSTOMER PROFILE =================

const fetchNotifications = async () => {
  try {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;

    // Fetch notifications
    const { data: notifsData, error } = await supabase
      .from('artisan_notifications')
      .select(`
        id, 
        title, 
        message, 
        read, 
        created_at, 
        type, 
        job_id, 
        data
      `)
      .eq('artisan_id', userData.user.id)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    // Get unique customer IDs
    const customerIds = [...new Set(
      (notifsData || [])
        .map((n: any) => n.data?.customer_id)
        .filter(Boolean)
    )];

    let customerMap: Record<string, { name: string; image?: string }> = {};

    if (customerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, profile_image')
        .in('id', customerIds);

      customerMap = (profiles || []).reduce((acc: any, p: any) => {
        const fullName = [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Customer';
        acc[p.id] = { 
          name: fullName, 
          image: p.profile_image 
        };
        return acc;
      }, {});
    }

    // Format notifications with proper typing
    const formatted: NotificationItem[] = (notifsData || []).map((n: any) => {
      const dataField = n.data || {};
      const customerId = dataField.customer_id;
      const customer = customerMap[customerId] || { name: 'Customer', image: null };

      return {
        id: n.id,
        title: n.title || '',
        message: n.message,
        read: n.read,
        createdAt: n.created_at,
        type: n.type,
        jobId: n.job_id,
        customerName: customer.name,
        customerImage: customer.image || null,
        adminName: undefined,
        adminImage: undefined,
      } as NotificationItem;
    });

    setNotifications(formatted);
  } catch (err: any) {
    console.error('Failed to fetch notifications:', err);
    toast.error('Failed to load notifications');
  } finally {
    setLoading(false);
  }
};

  // ================= REALTIME =================
  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('artisan-notifications-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'artisan_notifications' },
        () => fetchNotifications()
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  // ================= HELPERS =================
  const getNotificationLabel = (type: string) => {
    switch (type) {
      case 'job_assigned': return '🧑‍🔧 New Job Assigned';
      // case 'in_progress': return '🔨 Job In Progress';
      case 'job_completed': return '🎉 Job Completed';
      case 'job_cancelled': return '❌ Job Cancelled';
      case 'admin_message': return '💬 New Message from Admin';   
      default: return '🔔 Notification';
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    try {
      await supabase.from('artisan_notifications').update({ read: true }).eq('id', notif.id);
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
      setIsOpen(false);

      if (['job_assigned', 'in_progress', 'job_completed', 'job_cancelled'].includes(notif.type)) {
        router.push('/dashboard/artisan/assigned-jobs');
      } else if (notif.type === 'admin_message' && notif.jobId) {
        router.push(`/dashboard/artisan/messages?job=${notif.jobId}`);
      } else {
        router.push('/dashboard/artisan/notifications');
      }
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong');
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      await supabase
        .from('artisan_notifications')
        .update({ read: true })
        .eq('artisan_id', userData.user.id)
        .eq('read', false);

      setNotifications([]);
      toast.success('All notifications marked as read');
      setIsOpen(false);
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const goToSettings = () => {
    setIsOpen(false);
    router.push('/dashboard/artisan/settings');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 text-[var(--white)] hover:bg-[var(--orange)]/5 rounded-full transition-all"
      >
        {notifications.length > 0 && (
          <span className="absolute -top-1 right-1 bg-[var(--orange)] text-[var(--white)] text-xs font-bold 
            min-w-[20px] h-5 flex items-center justify-center rounded-full animate-pulse">
            {notifications.length > 99 ? '99+' : notifications.length}
          </span>
        )}
        <FaBell size={20} />
      </button>

      {isOpen && (
        <div className="absolute -right-10 sm:right-0 mt-3 w-76 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">

          <div className="flex items-center justify-between px-6 py-4 border-b bg-[var(--blue)] text-white rounded-t-2xl">
            <h3 className="font-semibold text-lg">Notifications</h3>
            <div className="flex items-center gap-4">
              <button onClick={goToSettings}><FaCog size={18} /></button>
              <button onClick={markAllAsRead} className="text-sm flex items-center gap-1 hover:underline">
                <FaCheck size={16} /> Mark all
              </button>
              <button onClick={() => setIsOpen(false)}><FaTimes size={18} /></button>
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-4">
            {loading ? (
              <p className="text-center py-10">Loading...</p>
            ) : notifications.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <FaBell size={48} className="mx-auto mb-4 opacity-40" />
                <p>No new notifications</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`group px-6 py-5 border-b hover:bg-[var(--blue)]/5 cursor-pointer transition-all
                    ${!notif.read ? 'border-l-4 border-l-[var(--blue)]' : ''}`}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      {notif.customerImage ? (
                        <Image
                          src={notif.customerImage}
                          alt="customer"
                          width={48}
                          height={48}
                          className="rounded-full object-cover border border-[var(--orange)]"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-[var(--orange)]/10 rounded-full flex items-center justify-center">
                          <FaUser size={20} className="text-[var(--blue)]" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="text-xl text-[var(--blue)] font-medium">
                        {notif.customerName}
                      </p>
                      <p className="font-semibold text-sm text-[var(--blue)]">
                        {getNotificationLabel(notif.type)}
                      </p>
                      <p className="text-sm text-[var(--blue)] mt-1">{notif.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t text-center bg-[var(--blue)]">
            <Link
              href="/dashboard/artisan/notifications"
              onClick={() => setIsOpen(false)}
              className="text-white text-sm font-medium"
            >
              View all →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtisanNotificationBell;