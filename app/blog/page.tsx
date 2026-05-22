'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaSearch, FaCalendarAlt, FaUser } from 'react-icons/fa';

const blogPosts = [
  {
    id: 1,
    title: "10 Essential Skills Every Artisan Should Master in 2026",
    excerpt: "Discover the most in-demand skills that can help you grow your business and earn more as an artisan.",
    image: "/blog/skills.jpg",
    category: "Tips for Artisans",
    date: "May 10, 2026",
    author: "Artismart Team",
    readTime: "8 min"
  },
  {
    id: 2,
    title: "How to Get Your First 10 Customers as a New Artisan",
    excerpt: "Practical strategies to attract your first customers and build a strong reputation on Artismart.",
    image: "/blog/customers.jpg",
    category: "Business Growth",
    date: "May 8, 2026",
    author: "Adekunle Johnson",
    readTime: "12 min"
  },
  {
    id: 3,
    title: "The Ultimate Guide to Home Maintenance in Nigeria",
    excerpt: "Learn how to maintain your home and know when to call a professional artisan.",
    image: "/blog/home-maintainance.jpg",
    category: "Customer Guide",
    date: "May 5, 2026",
    author: "Artismart Team",
    readTime: "10 min"
  },
];

const BlogPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Tips for Artisans', 'Business Growth', 'Customer Guide'];

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 font-roboto">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-[var(--blue)] mb-4">Artismart Blog</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Expert tips, stories, and insights for artisans and customers
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <FaSearch className="absolute left-4 top-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:border-[var(--blue)]"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-3 rounded-2xl whitespace-nowrap transition-all ${
                  selectedCategory === cat 
                    ? 'bg-[var(--blue)] text-white' 
                    : 'bg-white border border-gray-300 hover:border-[var(--blue)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <Link key={post.id} href={`/blog/${post.id}`} className="group">
              <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="relative h-56">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs text-[var(--orange)] mb-3">
                    <span>{post.category}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <FaCalendarAlt /> {post.date}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-[var(--blue)] mb-3 line-clamp-2 group-hover:text-[var(--orange)] transition-colors">
                    {post.title}
                  </h3>

                  <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <FaUser />
                      <span>{post.author}</span>
                    </div>
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-xl">No articles found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPage;