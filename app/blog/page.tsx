'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaSearch } from 'react-icons/fa';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const blogPosts = [
  {
    id: 1,
    title: "10 Essential Skills Every Artisan Should Master in 2026",
    excerpt: "Discover the most in-demand skills that will help artisans grow their business.",
    image: "/blog/skills.jpg",
    link: "/blog/essential-skills-2026"
  },
  {
    id: 2,
    title: "How to Get Your First 10 Customers as a New Artisan",
    excerpt: "Practical strategies every new artisan should use to attract clients.",
    image: "/blog/customers.jpg",
    link: "/blog/get-first-customers"
  },
  {
    id: 3,
    title: "The Ultimate Guide to Home Maintenance in Nigeria",
    excerpt: "Learn how to maintain your home properly and when to call a professional.",
    image: "/blog/home-maintainance.jpg",
    link: "/blog/home-maintenance-guide"
  }
];

export default function BlogPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPosts = blogPosts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 font-roboto">
      <Navbar/>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-[var(--blue)] mb-4">Artismart Blog</h1>
          <p className="text-xl text-gray-600">Expert advice for artisans and smart customers</p>
        </div>

        <div className="relative max-w-xl mx-auto mb-10">
          <FaSearch className="absolute left-5 top-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-[var(--blue)]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <Link key={post.id} href={post.link} className="group">
              <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                <div className="relative h-56">
                  <Image 
                    src={post.image} 
                    alt={post.title} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform" 
                    priority
                  />
                </div>
                <div className="p-6 flex-1">
                  <h3 className="text-xl font-semibold text-[var(--blue)] mb-3 line-clamp-2 group-hover:text-[var(--orange)]">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer/>
    </div>
  );
}