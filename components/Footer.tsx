import Image from 'next/image'
import Link from 'next/link';
import React from 'react'
import { FaEnvelope, FaFacebook } from 'react-icons/fa'
import { FaXTwitter } from "react-icons/fa6";
import { FaInstagram } from "react-icons/fa6";
import { FaWhatsapp } from "react-icons/fa6";

const Footer = () => {
  return (
    <div className="font-roboto">
    <div className='bg-[var(--blue)] grid grid-cols-1 sm:grid-cols-4 px-10 py-8 sm:py-12 gap-5 border-t-[5px] border-t-[var(--orange)] border-radius-tl-[20px] border-radius-tr-[20px] rounded-tl-[20px] rounded-tr-[20px]'>
        <div className="">
            <h1 className='text-[var(--white)] font-bold text-xl sm:text-2xl'>Artismart</h1>
            <p className='text-[var(--white)]  text-sm sm:text-sm mt-4 pr-4'>ArtiSmart connects you with trusted, verified artisans for reliable, on-demand services while supporting their sustainable income.</p>
            <div className="flex flex-col space-y-1 mt-4 ">
                <Link href="https://facebook.com/SegunMandate" className="text-[var(--white)] hover:text-[var(--orange)] flex gap-2 items-center"><FaFacebook/>Facebook</Link>
                <Link
                  href="https://twitter.com/Data4_Decision"
                  className="group text-[var(--white)] hover:text-[var(--orange)] flex gap-2 items-center"
                >
                  <FaXTwitter size={20} className="bg-[var(--white)] text-black p-1 rounded-lg group-hover:bg-[var(--orange)]"/>
                  Twitter
                  </Link>
                <Link href="https://instagram.com/data4decision_intl" className="text-[var(--white)] hover:text-[var(--orange)] flex gap-2 items-center">
                  <FaInstagram /> Instagram
                </Link>
                <Link href="https://wa.me/+2349168974621" className="text-[var(--white)] hover:text-[var(--orange)] flex gap-2 items-center">
                  <FaWhatsapp /> Whatsapp
                </Link>
                <p className="text-[var(--white)] hover:text-[var(--orange)] flex gap-2 items-center">
                  <FaEnvelope /> info@data4decision.org
                </p>
            </div>
        </div>
        <div>
          <h1 className='text-[var(--white)] font-bold text-xl sm:text-2xl'>Categories</h1>
          <ul className='text-[var(--white)]  text-sm sm:text-sm mt-4 space-y-2'>
            <li><Link href="#" className="hover:text-[var(--orange)]">Home & Building Services</Link></li>
            <li><Link href="#" className="hover:text-[var(--orange)]">Mechanical & Technical Services</Link></li>
            <li><Link href="#" className="hover:text-[var(--orange)]">General Maintenance</Link></li>
            <li><Link href="#" className="hover:text-[var(--orange)]">Interior & Finishing Services</Link></li>
            <li><Link href="#" className="hover:text-[var(--orange)]">Security & Installations</Link></li>
            <li><Link href="#" className="hover:text-[var(--orange)]">ICT & Digital Technicians</Link></li>
            <li><Link href="#" className="hover:text-[var(--orange)]">Automotive Artisans</Link></li>
            <li><Link href="#" className="hover:text-[var(--orange)]">Specialised & Industrial Artisans (Later Phase)</Link></li>
          </ul>
        </div>
        <div className="text-[var(--white)]  text-xl sm:text-2xl">
          <h1 className='text-[var(--white)] font-bold text-xl sm:text-2xl'>For Customer</h1>
          <ul className='text-[var(--white)]  text-sm sm:text-sm mt-4 space-y-2'>
            <li><Link href="#" className="hover:text-[var(--orange)]">How It Works</Link></li>
            <li><Link href="#" className="hover:text-[var(--orange)]">Browse Artisans</Link></li>
            <li><Link href="#" className="hover:text-[var(--orange)]">Book a Service</Link></li>
            <li><Link href="#" className="hover:text-[var(--orange)]">Customer Support</Link></li>
          </ul>
        </div>
        <div className="text-[var(--white)]  text-xl sm:text-2xl">
          <h1 className='text-[var(--white)] font-bold text-xl sm:text-2xl'>For Artisan</h1>
          <ul className='text-[var(--white)] text-sm sm:text-sm mt-4 space-y-2'>
            <li><Link href="#" className="hover:text-[var(--orange)]">How It Works</Link></li>
            <li><Link href="#" className="hover:text-[var(--orange)]">Browse Opportunities</Link></li>
            <li><Link href="#" className="hover:text-[var(--orange)]">Join as an Artisan</Link></li>
            <li><Link href="#" className="hover:text-[var(--orange)]">Artisan Support</Link></li>
          </ul>
        </div>
    </div>
     
    <div className="border-t-4 border-l-0 border-r-0 border-b-0 border-[var(--orange)] flex items-center justify-around gap-4 ">
        <p className="text-center text-[var(--blue)] font-semibold text-sm sm:text-sm py-4">© 2026 ArtiSmart. All rights reserved.</p>
        <div className="flex gap-4 items-center">
          <Link href='#' className="text-center text-[var(--blue)] font-semibold text-sm sm:text-sm py-4">Privacy Policy </Link>
        <Link href='#' className="text-center text-[var(--blue)] font-semibold text-sm sm:text-sm py-4">Terms of Service</Link>
        </div>
        </div>
        </div>
  )
}

export default Footer