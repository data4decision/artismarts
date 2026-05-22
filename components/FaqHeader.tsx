import { backgroundImage } from 'html2canvas/dist/types/css/property-descriptors/background-image'
import Image from 'next/image'
import React from 'react'

const AboutArtismart = () => {
  return (
    <div className="font-roboto">
        <div className="relative">
            <Image
            src="/aboutartismart.jpeg"
            alt="Artismart"
            width={1200}
            height={100}
            className="w-full h-100 object-cover object-top"
            priority
            />
        </div>
        <div className="absolute top-1/2 -translate-y-1/2  ">
            <h1 className='text-2xl text-[var(--blue)] font-bold bg-[var(--white)] w-[350px] sm:ml-20 ml-10  px-4 py-3 rounded-lg border-b-3 border-r-0 border-l-0 border-t-0 border-[var(--blue)]  '>
            Frequently Asked Questions
            </h1>
            <p className='bg-[var(--blue)] text-[var(--white)] sm:text-xl text-sm sm:ml-20  font-semibold mt-3 rounded-lg border-b-3 border-r-0 border-l-0 border-t-0 border-[var(--orange)] px-4 py-4'>Find answers to common questions about Artismart</p>
           
        </div>
    </div>
  )
}

export default AboutArtismart