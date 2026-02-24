import React from 'react'
import Image from 'next/image'

const OurMission = () => {
  return (
    <div className='font-roboto py-20 mt-20'>
        <div className="grid grid-cols-1 md:grid-cols-2 w-[80%] m-auto bg-[var(--blue)]/30 rounded-lg">
            <div className="px-5 py-5 ">
                <p className="text-xl lg:text-4xl md:text-4xl font-bold text-[var(--orange)] mt-4 mb-4">About Us</p>
                <h1 className="text-2xl lg:text-3xl lg:w-[60%] md:text-3xl font-bold leading-tight text-[var(--blue)]">Reliability. Trust. Accessibility.</h1>
                <p className="text-[15px]  text-[var(--blue)]">ArtiSmart is a trusted digital platform that connects customers with skilled, verified artisans, making it easier than ever to access reliable services when and where you need them. We remove the uncertainty of finding dependable artisans while creating sustainable income opportunities for professionals across diverse trades.</p>
                <p className="text-xl lg:text-4xl md:text-3xl font-bold text-[var(--orange)] mb-2 mt-2">Our Mission</p>
                <p className="text-[15px]  text-[var(--blue)]">To deliver trusted artisan services anywhere, anytime.</p>
                <p className="text-xl lg:text-4xl md:text-3xl font-bold text-[var(--orange)] mb-2 mt-2">Our Vission</p>
                <p className="text-[15px]  text-[var(--blue)]">We envision a world where accessing quality artisan services is seamless and stress-free, and where artisans are empowered through visibility, trust, and technology to grow their businesses and improve their livelihoods.</p>
            </div>
            <div className="w-full ">
                <Image src="/missions.jpeg"
                alt="aboutUs image"
                width={1000}
                height={1000}
                className='object-contain py-10 px-6 rounded-lg'
                />
            </div>
        </div>
    </div>
  )
}

export default OurMission