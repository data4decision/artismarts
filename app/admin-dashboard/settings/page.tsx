'use client'

import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { FaVolumeUp, FaVolumeMute, FaSave, FaArrowLeft, FaUndo } from 'react-icons/fa'
import Link from 'next/link'

const NOTIFICATION_SOUNDS = [
  { name: 'Default Chime', value: '/sounds/notification.mp3' },
  { name: 'Soft Bell', value: '/sounds/soft-bell.mp3' },
  { name: 'Dragon Bell', value: '/sounds/dragon-bell.mp3' },
  { name: 'Dragon Festive Chime', value: '/sounds/dragon-festive-chime.mp3' },
  { name: 'Gigidela Romusic', value: '/sounds/gigidelaromusic.mp3' },
  { name: 'Celestial Chime', value: '/sounds/celestial-chime.mp3' },
  { name: 'Universal Field Chime', value: '/sounds/universfield-chime.mp3' },
]

export default function AdminSettings() {
  // Temporary values (what the user is currently editing)
  const [selectedSound, setSelectedSound] = useState('/sounds/notification.mp3')
  const [isMuted, setIsMuted] = useState(false)

  // Saved values (what is actually stored in localStorage)
  const [savedSound, setSavedSound] = useState('/sounds/notification.mp3')
  const [savedMute, setSavedMute] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Load saved preferences from localStorage on mount
  useEffect(() => {
    const loadedSound = localStorage.getItem('notificationSound') || '/sounds/notification.mp3'
    const loadedMute = localStorage.getItem('notificationMuted') === 'true'

    setSelectedSound(loadedSound)
    setIsMuted(loadedMute)
    setSavedSound(loadedSound)
    setSavedMute(loadedMute)
  }, [])

  // Initialize audio for preview
  useEffect(() => {
    audioRef.current = new Audio(selectedSound)
    audioRef.current.volume = 0.65
  }, [selectedSound])

  const playPreview = (soundUrl: string) => {
    const preview = new Audio(soundUrl)
    preview.volume = 0.7
    preview.play().catch(() => toast.error('Could not play sound (autoplay blocked?)'))
  }

  const selectSound = (soundUrl: string) => {
    setSelectedSound(soundUrl)
    playPreview(soundUrl)
  }

  const toggleMute = () => {
    setIsMuted(prev => !prev)
  }

  const saveAllSettings = () => {
    localStorage.setItem('notificationSound', selectedSound)
    localStorage.setItem('notificationMuted', isMuted.toString())

    setSavedSound(selectedSound)
    setSavedMute(isMuted)

    toast.success('Settings saved successfully!')
  }

  const discardChanges = () => {
    setSelectedSound(savedSound)
    setIsMuted(savedMute)
    toast.success('Changes discarded')
  }

  const hasUnsavedChanges = selectedSound !== savedSound || isMuted !== savedMute

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/admin-dashboard" 
          className="text-[var(--blue)] hover:text-[var(--orange)] flex items-center gap-2"
        >
          <FaArrowLeft /> Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-[var(--blue)]">Admin Settings</h1>
      </div>

      <div className="bg-white rounded-2xl shadow border p-8 space-y-10">
        {/* Notification Preferences */}
        <div>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-3 text-[var(--blue)]">
            <FaVolumeUp className="text-[var(--orange)]" />
            Notification Preferences
          </h2>

          <div className="space-y-8">
            {/* Mute Toggle */}
            <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl">
              <div>
                <p className="font-medium">Enable Sound</p>
                <p className="text-sm text-gray-500">Play sound when new notifications arrive</p>
              </div>
              <button
                onClick={toggleMute}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-sm font-medium transition-all ${
                  isMuted 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {isMuted ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
                {isMuted ? 'Muted' : 'Enabled'}
              </button>
            </div>

            {/* Sound Selector */}
            {!isMuted && (
              <div>
                <p className="font-medium mb-4">Choose Your Notification Sound</p>
                <div className="grid grid-cols-1 gap-3">
                  {NOTIFICATION_SOUNDS.map((sound) => (
                    <button
                      key={sound.value}
                      onClick={() => selectSound(sound.value)}
                      className={`w-full text-left px-6 py-4 rounded-2xl flex items-center justify-between border transition-all ${
                        selectedSound === sound.value 
                          ? 'bg-[var(--orange)] text-white border-[var(--orange)]' 
                          : 'hover:bg-gray-100 border-gray-200'
                      }`}
                    >
                      <span className="font-medium">{sound.name}</span>
                      <span 
                        onClick={(e) => { e.stopPropagation(); playPreview(sound.value); }}
                        className="text-xs px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-full cursor-pointer"
                      >
                        ▶ Preview
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - Save & Discard */}
        <div className="pt-6 border-t flex flex-col sm:flex-row gap-4">
          <button
            onClick={saveAllSettings}
            disabled={!hasUnsavedChanges}
            className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-medium transition-all ${
              hasUnsavedChanges 
                ? 'bg-[var(--blue)] text-white hover:bg-[var(--blue)]/90' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <FaSave /> Save Settings
          </button>

          <button
            onClick={discardChanges}
            disabled={!hasUnsavedChanges}
            className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-medium border transition-all ${
              hasUnsavedChanges 
                ? 'border-[var(--blue)] hover:bg-[var(--orange)] text-[var(--blue)]' 
                : 'border-[var(--orange)] text-gray-400 cursor-not-allowed'
            }`}
          >
            <FaUndo /> Discard Changes
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-[var(--blue)] mt-8">
        Changes are only saved when you click "Save Settings"
      </p>
    </div>
  )
}