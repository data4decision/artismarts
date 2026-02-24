'use client'
import React, {useState} from "react";
import Image from "next/image";
import Link from 'next/link';
import {FaBars, FaSearch, FaTimes} from 'react-icons/fa'


const Navbar = () => {

  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="font-roboto">
    <div className="hidden lg:flex items-center justify-between px-10 bg-[var(--white)] text-[var(--blue)] p-4 border-b border-[var(--orange)] shadow-lg font-roboto">
      <div className="flex items-center gap-2">
        <Image src="/log.png" 
        alt="Artismart-logo"
        width={100}
        height={100}
        className="w-10 h-10"/>
        <h1 className="text-[var(--blue)] font-semibold text-[17px] ">ArtisMart</h1>
      </div>
      <div className="">
        <ul className="flex items-center gap-4">
            <li><Link href="/" className="text-[var(--blue)] hover:text-[var(--orange)] transition-all duration-300 ease-in-out text-[17px]"> Home</Link></li>
            <li><Link href="/container/about" className="text-[var(--blue)] hover:text-[var(--orange)] transition-all duration-300 ease-in-out text-[17px]"> About</Link></li>
            <li><Link href="/container/faq" className="text-[var(--blue)] hover:text-[var(--orange)] transition-all duration-300 ease-in-out text-[17px]"> FAQ</Link></li>
            <li><Link href="/container/careers" className="text-[var(--blue)] hover:text-[var(--orange)] transition-all duration-300 ease-in-out text-[17px]"> Careers</Link></li>
            <li><Link href="/container/contact-us" className="text-[var(--blue)] hover:text-[var(--orange)] transition-all duration-300 ease-in-out text-[17px]"> Contact Us</Link></li>
            <li><Link href="/container/blog" className="text-[var(--blue)] hover:text-[var(--orange)] transition-all duration-300 ease-in-out text-[17px]"> Blog</Link></li>
        </ul>
      </div>
        <div className="relative w-full max-w-xs">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search for any services."
            className="w-full rounded-lg border border-[var(--orange)] bg-white px-4 py-2.5 pr-11 text-sm text-[var(--blue)] placeholder:text-[var(--blue)]/60 focus:border-[var(--blue)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)]/20 transition-all"
            aria-label="Search"
          />
          <FaSearch
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--blue)]/60 pointer-events-none"
            size={18}
            aria-hidden="true"
          />
        </div>
        <div className="">
          <ul className="flex items-center gap-3">
            <li><Link href="/signup" className="text-[var(--blue)] hover:text-[var(--white)] transition-all duration-300 ease-in-out text-[17px] bg-[var(--orange)] px-2 py-2 rounded-lg"> Sign Up</Link></li>
            <li><Link href="/login" className="text-[var(--blue)] hover:text-[var(--orange)] transition-all duration-300 ease-in-out text-[17px]"> Login</Link></li>
          </ul>
        </div>
    </div>
     {/* Mobile + Tablet version (everything below lg = 1024px) */}
    <div className=" lg:hidden flex items-center justify-between px-10 bg-[var(--white)] text-[var(--blue)] p-4 border-b border-[var(--orange)] shadow-lg font-roboto">
      <div className="flex items-center gap-2">
        <Image src="/log.png" 
        alt="Artismart-logo"
        width={100}
        height={100}
        className="w-10 h-10"/>
        <h1 className="hidden sm:block text-[var(--blue)] font-semibold text-[18px]">ArtisMart</h1> 
        </div>
        <div className="">
          <button onClick={()=>setIsOpen(!isOpen)}>
            {isOpen? <FaTimes size={25} className="text-[var(--blue)] hover:text-[var(--white)] hover:bg-[var(--blue)] p-1"/>
             : 
             <FaBars size={25} className="text-[var(--blue)] hover:text-[var(--white)] hover:bg-[var(--blue)] p-1" />}
          </button>
        </div>
    </div>

    {isOpen && (
      <div className="bg-[var(--blue)] py-2">
        <div className="">
        <ul className="flex flex-col items-center gap-2">
            <li className=""><Link href="/" className="text-[var(--white)]  hover:text-[var(--orange)] transition-all duration-300 ease-in-out text-[17px]"> Home</Link></li>
            <li><Link href="/container/about" className="text-[var(--white)] hover:text-[var(--orange)] transition-all duration-300 ease-in-out text-[17px]"> About</Link></li>
            <li><Link href="/container/faq" className="text-[var(--white)] hover:text-[var(--orange)] transition-all duration-300 ease-in-out text-[17px]"> FAQ</Link></li>
            <li><Link href="/container/careers" className="text-[var(--white)] hover:text-[var(--orange)] transition-all duration-300 ease-in-out text-[17px]"> Careers</Link></li>
            <li><Link href="/container/contact-us" className="text-[var(--white)] hover:text-[var(--orange)] transition-all duration-300 ease-in-out text-[17px]"> Contact Us</Link></li>
            <li><Link href="/container/blog" className="text-[var(--white)] hover:text-[var(--orange)] transition-all duration-300 ease-in-out text-[17px]"> Blog</Link></li>
        </ul>
      </div>
      <div className="">
          <ul className="flex flex-col items-center gap-2 mt-4">
            <li className="w-full bg-[var(--orange)] text-center"><Link href="/signup" className=" text-[var(--white)] hover:text-[var(--blue)] transition-all duration-300 ease-in-out text-[17px]  px-2 py-2 rounded-lg"> Sign Up</Link></li>
            <li><Link href="/login" className="text-[var(--white)] hover:text-[var(--orange)] transition-all duration-300 ease-in-out text-[17px]"> Login</Link></li>
          </ul>
        </div>
      </div>
    )}
    </div>
  );
};

export default Navbar;