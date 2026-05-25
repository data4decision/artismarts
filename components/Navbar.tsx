'use client';
import React, { useState } from "react";
import Image from "next/image";
import Link from 'next/link';
import { FaBars, FaSearch, FaTimes } from 'react-icons/fa';

const Navbar = () => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="font-roboto relative z-50">
      {/* Desktop Navbar */}
      <div className="hidden lg:flex items-center justify-between px-10 bg-[var(--white)] text-[var(--blue)] p-4 border-b border-[var(--orange)] shadow-lg">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image 
            src="/log.png" 
            alt="Artismart-logo"
            width={100}
            height={100}
            className="w-10 h-10"
          />
          <h1 className="text-[var(--blue)] font-semibold text-[17px]">ArtisMart</h1>
        </div>

        {/* Navigation Links */}
        <div>
          <ul className="flex items-center gap-6">
            <li><Link href="/" className="hover:text-[var(--orange)] transition-all duration-300 sm:text-[17px] text-[15px]">Home</Link></li>
            <li><Link href="/aboutUs" className="hover:text-[var(--orange)] transition-all duration-300 sm:text-[17px] text-[15px]">About</Link></li>
            <li><Link href="/faq" className="hover:text-[var(--orange)] transition-all duration-300 sm:text-[17px] text-[15px]">FAQ</Link></li>
            <li><Link href="/contact-us" className="hover:text-[var(--orange)] transition-all duration-300 sm:text-[17px] text-[15px]">Contact Us</Link></li>
            <li><Link href="/blog" className="hover:text-[var(--orange)] transition-all duration-300 sm:text-[17px] text-[15px]">Blog</Link></li>
          </ul>
        </div>

        {/* Search Bar */}
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
          />
        </div>

        {/* Auth Buttons */}
        <div>
          <ul className="flex items-center gap-3">
            <li>
              <Link 
                href="/signup" 
                className="bg-[var(--orange)] text-[var(--white)] hover:bg-[var(--orange)]/90 px-5 py-2 rounded-lg transition-all duration-300 text-[17px]"
              >
                Sign Up
              </Link>
            </li>
            <li>
              <Link 
                href="/login" 
                className="text-[var(--blue)] hover:text-[var(--orange)] transition-all duration-300 text-[17px]"
              >
                Login
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Mobile Navbar */}
      <div className="lg:hidden flex items-center justify-between px-6 py-4 bg-[var(--white)] text-[var(--blue)] border-b border-[var(--orange)] shadow-lg">
        <div className="flex items-center gap-2">
          <Image 
            src="/log.png" 
            alt="Artismart-logo"
            width={100}
            height={100}
            className="w-10 h-10"
          />
          <h1 className="font-semibold text-[18px]">ArtisMart</h1>
        </div>

        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2"
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <FaTimes size={28} className="text-[var(--blue)]" />
          ) : (
            <FaBars size={28} className="text-[var(--blue)]" />
          )}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="lg:hidden bg-[var(--blue)] py-6 shadow-2xl z-50 relative">
          <ul className="flex flex-col items-center gap-5 text-[17px]">
            <li><Link href="/" className="text-[var(--white)] hover:text-[var(--orange)] transition-all sm:text-[17px] text-[15px]" onClick={() => setIsOpen(false)}>Home</Link></li>
            <li><Link href="/aboutUs" className="text-[var(--white)] hover:text-[var(--orange)] transition-all sm:text-[17px] text-[15px]" onClick={() => setIsOpen(false)}>About</Link></li>
            <li><Link href="/faq" className="text-[var(--white)] hover:text-[var(--orange)] transition-all sm:text-[17px] text-[15px]" onClick={() => setIsOpen(false)}>FAQ</Link></li>
            <li><Link href="/contact-us" className="text-[var(--white)] hover:text-[var(--orange)] transition-all sm:text-[17px] text-[15px]" onClick={() => setIsOpen(false)}>Contact Us</Link></li>
            <li><Link href="/blog" className="text-[var(--white)] hover:text-[var(--orange)] transition-all sm:text-[17px] text-[15px]" onClick={() => setIsOpen(false)}>Blog</Link></li>
          </ul>

          <div className="mt-8 flex flex-col items-center gap-4">
            <Link 
              href="/signup" 
              className="w-11/12 text-center bg-[var(--orange)] text-white py-3 rounded-lg hover:bg-orange-600 transition-all"
              onClick={() => setIsOpen(false)}
            >
              Sign Up
            </Link>
            <Link 
              href="/login" 
              className="text-[var(--white)] hover:text-[var(--orange)] transition-all"
              onClick={() => setIsOpen(false)}
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;