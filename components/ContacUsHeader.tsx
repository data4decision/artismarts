import React from 'react'
import Image from 'next/image';

const ContactHeader = () => {
  return (
    <div className="">
        <div>
        <Image 
        src='/upload/xblog_03.jpg.pagespeed.ic.ZGQLz9XvWC.jpg' 
        alt='Contact'
        width={600}
        height={400}
        className='object-cover w-full lg:h-[300px] md:h-[300px] sm:h-[250px] h-[200px] relative' />
    </div>
    <span className="absolute  left-0 right-0 top-13  lg:h-[300px] md:h-[300px] sm:h-[250px] h-[200px]-opacity-50 text-[var(--blue)] p-2"></span>
    <h1 className='absolute top-[25%] sm:right-[40%] right-[20%] font-bold sm:text-6xl text-[var(--blue)] text-4xl text-center '>Contact Us</h1>
    </div>
  )
}

export default ContactHeader