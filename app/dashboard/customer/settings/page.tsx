'use client'
import React, { useEffect, useState } from 'react'
import Link from 'next/link'

import { FaArrowLeft, FaPlay, FaSave, FaUndo, FaVolumeMute, FaVolumeUp } from 'react-icons/fa'
import toast from 'react-hot-toast'

const Page = () => {
  const [isMuted, setIsMuted] = React.useState(false)
  const [selectedSound, setSelectedSound] = React.useState('/sounds/dragon-festive-chime.mp3')
  const [savedSound, setSavedSound] = React.useState('/sounds/dragon-festive-chime.mp3')
  const [savedMute, setSavedMute] = React.useState(false)

  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  const NOTIFICATION_SOUNDS = [
  { name: 'Default Chime', value: '/sounds/notification.mp3' },
  { name: 'Soft Bell', value: '/sounds/soft-bell.mp3' },
  { name: 'Dragon Bell', value: '/sounds/dragon-bell.mp3' },
  { name: 'Dragon Festive Chime', value: '/sounds/dragon-festive-chime.mp3' },
  { name: 'Gigidela Romusic', value: '/sounds/gigidelaromusic.mp3' },
  { name: 'Celestial Chime', value: '/sounds/celestial-chime.mp3' },
  { name: 'Universal Field Chime', value: '/sounds/universfield-chime.mp3' },
]

useEffect(() => {
  const loadedSound = localStorage.getItem('notificationSound') || '/sounds/dragon-festive-chime.mp3'
  const loadedMute = localStorage.getItem('notificationMute') === 'true'

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

const playReview = (soundUrl: string) => {
  const preview = new Audio(soundUrl)
  preview.volume = 0.7
  preview.play().catch(() => alert('Could not play sound (autoPlay blocked?)'))
}

const selectSound = (soundUrl: string) => {
  setSelectedSound(soundUrl)
  playReview(soundUrl)
}

  const toggleMute = () => {
    setIsMuted(prev => !prev)
  }
const saveAllSettings = () => {
  localStorage.setItem('notificationSound', selectedSound)
  localStorage.setItem('notificationMute', isMuted.toString())

  setSavedSound(selectedSound)
  setSavedMute(isMuted)

  toast.success(
    <div className="border-[var(--orange)] border-2 p-4 rounded-xl">
      <p className="font-bold text-[var(--blue)]">Settings Saved</p>
      <p className="text-sm text-[var(--blue)]">Your notification preferences have been updated.</p>
    </div>
  )
} 

const discardChanges = () => {
  setSelectedSound(savedSound)
  setIsMuted(savedMute)
  toast('Changes discarded', { icon: '🗑️' })
}

const hasUnsavedChanges = selectedSound !== savedSound || isMuted !== savedMute



  return (
    <div className='max-w-2xl mx-auto p-6'>
      <div className="flex items-center gap-4">
        <Link href="/dashboard/customer"
        className='text-[var(--blue)] hover:text-[var(--orange)] flex items-center gap-2'>
          <FaArrowLeft/>
          Back to Customer
        </Link>
        <h1 className='text-3xl text-[var(--blue)] font-bold'>Settings</h1>
      </div>

      <div className="bg-[var(--white)] rounded-2xl p-8  space-y-10 shadow border border-[var(--orange)]">
         {/* Notification Preferences */}
         <h1 className='text-xl font-semibold mb-6 flex items-center gap-3 text-[var(--blue)]'>
          <FaVolumeUp className='text-[var(--orange)]' />
          Notification Preferences
         </h1>

         <div className="space-y-8">
           {/* Mute Toggle */}
           <div className="flex justify-between items-center p-5 rounded-xl bg-[var(--blue)]/10">
           <div className="">
            <p className='font-medium text-[var(--blue)]'>Enable Sounds</p>
            <p className='text-sm text-[var(--blue)]'>Play sound when new notifications arrive</p>
           </div>
           <button onClick={toggleMute}
           className={`text-sm flex items-center gap-3 px-6 py-3 rounded-2xl font-bold ${
            isMuted ? 'bg-[var(--orange)] text-[var(--white)]' : 'bg-[var(--blue)] text-[var(--white)]'
           }`}>
            {isMuted ? <FaVolumeMute size={20}/> : <FaVolumeUp size={20}/>}
            {isMuted ? 'Muted' : 'Enabled'}
           </button>
           </div>

           {/* Sound Selection  */}
           {isMuted &&  (
            <div className="">
              <p className='font-medium text-[var(--blue)] mb-4'>Choose your Notification Sound</p>
              <div className="grid grid-cols-1 gap-3">
                {NOTIFICATION_SOUNDS.map((sound) => (
                  <button
                  key={sound.value}
                  onClick={() => setSelectedSound(sound.value)}
                  className={`w-full text-left px-6 py-4 rounded-2xl flex items-center justify-between border transition-all
                    ${selectedSound === sound.value ? 
                      'bg-[var(--orange)] text-white border-[var(--blue)]'
                    :
                  'hover:bg-[var(--blue)] border-[var(--orange)]/50 text-[var(--white)]'}`}>
                    <span className='font-medium '>{sound.name}</span>
                    <span 
                    onClick={(e) => { e.stopPropagation(); playReview(sound.value) }}
                    className="text-xs px-3 py-1 flex items-center gap-2 bg-[var(--blue)] hover:bg-[var(--orange)]  border border-[var(--white)] rounded-full cursor-pointer"
                      >
                        <FaPlay size={12} className='text-[var(--white)]'/> Preview
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
        className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-medium transition-all
        ${hasUnsavedChanges ? 'bg-[var(--blue)] text-[var(--white)] hover:bg-[var(--orange)]' : 'bg-[var(--blue)]/50 text-[var(--white)]  cursor-not-allowed'}`}>
          <FaSave size={20} /> Save Changes
        </button>
        <button
          onClick={discardChanges}
          disabled={!hasUnsavedChanges}
          className={`flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-medium border transition-all ${
            hasUnsavedChanges 
              ? 'border-[var(--blue)] hover:bg-[var(--orange)] text-[var(--blue)]' 
              : 'border-[var(--blue)] text-[var(--blue)] cursor-not-allowed'
          }`}
        >
          <FaUndo /> Discard Changes
        </button>
       </div>
       <p className="text-center text-xs text-gray-400 mt-8">
        Changes are only saved when you click "Save Settings"
      </p>
    </div>
  )
}

export default Page