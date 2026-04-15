'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const DEFAULT_SOUND = '/sounds/notification.mp3'

export function useNotificationSound() {
  const [selectedSound, setSelectedSound] = useState(DEFAULT_SOUND)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    const savedSound = localStorage.getItem('notificationSound')
    const savedMute = localStorage.getItem('notificationMuted') === 'true'

    if (savedSound) setSelectedSound(savedSound)
    setIsMuted(savedMute)
  }, [])

  // Re-create audio when sound changes
  useEffect(() => {
    audioRef.current = new Audio(selectedSound)
    audioRef.current.volume = 0.65
  }, [selectedSound])

  // Listen for changes made in other tabs or in Settings page
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'notificationSound') {
        setSelectedSound(e.newValue || DEFAULT_SOUND)
      }
      if (e.key === 'notificationMuted') {
        setIsMuted(e.newValue === 'true')
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const playSound = useCallback(() => {
    if (isMuted || !audioRef.current) return
    audioRef.current.currentTime = 0
    audioRef.current.play().catch((err) => {
      console.warn('Notification sound playback failed:', err)
    })
  }, [isMuted])

  return {
    selectedSound,
    isMuted,
    playSound,
  }
}