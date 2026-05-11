'use client'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { FaArrowLeft, FaLightbulb } from 'react-icons/fa'

const Page = () => {
    const [text, setText] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (category: string) => {
  if (!text.trim()) return

  setLoading(true)

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) throw userError

    const { error } = await supabase
      .from('help_supports')
      .insert([
        {
          user_id: user?.id,
          category,
          message: text.trim(),
        },
      ])

    if (error) throw error

    toast.success('Your message has been sent')
    setText('')
  } catch (err) {
    console.error(err)
    toast.error('Unable to send your message')
  } finally {
    setLoading(false)
  }
}
  return (
    <div className='max-w-4xl mx-auto p-6'>
        <Link href="/dashboard/artisan/settings/help" className="flex items-center gap-3 mb-8">
        <FaArrowLeft size={28} className='text-[var(--orange)] '/>
            <FaLightbulb size={38} className='text-[var(--blue)] bg-[var(--orange)]/50 rounded-full p-2'/>
            <h1 className='text-3xl font-bold text-[var(--blue)]'>Suggest a Feature</h1>
        </Link>
        <h3 className='font-semibold md:text-2xl text-lg text-[var(--blue)] '>Share your ideas for features that would make Artismart even better</h3>
        <textarea name="text" 
        value={text}
        maxLength={1000} 
        onChange={(e) => setText(e.target.value)}
        placeholder='What feature would make Artismart more useful for you?'
        className='w-full h-80 border border-[var(--orange)] hover:border-[var(--blue)] text-[var(--blue)] mt-9 p-3 rounded-lg'
        /> 
        <p className='mt-2 text-sm text-right text-[var(--blue)]/70'>
          {text.length}/1000 characters
        </p>

        <button type='submit' 
        onClick={()=> handleSubmit('feature_request')}
        disabled={!text.trim() || loading}
        className='bg-[var(--orange)] hover:bg-[var(--blue)] rounded-lg py-4 w-full text-[var(--white)] font-bold md:text-2xl text-xl transition-all duration-200 ease-in-out mt-4 cursor-pointer'
        >
            {loading? 'Sending...' : 'Send'}
        </button>
    </div>
  )
}

export default Page