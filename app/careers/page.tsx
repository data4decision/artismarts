'use client';

import React from 'react';
import Link from 'next/link';
import { FaUsers, FaHeart, FaLightbulb, FaArrowRight, FaEnvelope } from 'react-icons/fa';

export default function CareersPage() {
  return (
    <div className="font-roboto">
      {/* Hero Section */}
      <section className="relative bg-[var(--blue)] text-white py-24 md:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Build the Future of<br />Skilled Work with Us
          </h1>
          <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto">
            At ArtiSmart, we’re creating a world where skilled artisans thrive and customers 
            get reliable, high-quality service.
          </p>
        </div>
      </section>

      {/* Mission & Culture */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-[var(--orange)] font-semibold tracking-widest text-sm mb-4">
              OUR CULTURE
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-[var(--blue)] mb-8">
              Work With Purpose
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              We are a fast-growing platform passionate about empowering artisans and 
              transforming the service industry in Nigeria. Every role at ArtiSmart contributes 
              to creating better livelihoods and trust in local craftsmanship.
            </p>
          </div>
        </div>
      </section>

      {/* Why Join Us */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[var(--blue)]">Why Talented People Choose ArtiSmart</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              {
                icon: <FaLightbulb className="text-5xl text-[var(--orange)]" />,
                title: "Meaningful Impact",
                desc: "Your work directly helps thousands of artisans grow their businesses and provides reliable services to customers."
              },
              {
                icon: <FaUsers className="text-5xl text-[var(--orange)]" />,
                title: "Collaborative Culture",
                desc: "Work with a passionate, driven, and supportive team that values innovation, respect, and excellence."
              },
              {
                icon: <FaHeart className="text-5xl text-[var(--orange)]" />,
                title: "Growth & Learning",
                desc: "Continuous learning opportunities, mentorship, and the chance to grow with a fast-moving startup."
              }
            ].map((item, i) => (
              <div key={i} className="bg-white p-10 rounded-3xl shadow-sm hover:shadow-md transition-all">
                <div className="mb-6">{item.icon}</div>
                <h3 className="text-2xl font-bold text-[var(--blue)] mb-4">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[var(--blue)]">Our Core Values</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              "Trust & Integrity",
              "Customer Obsession",
              "Artisan Empowerment",
              "Innovation & Excellence",
              "Inclusivity",
              "Sustainability",
              "Speed & Agility",
              "Respect & Collaboration"
            ].map((value, i) => (
              <div key={i} className="bg-gray-50 border border-gray-100 p-8 rounded-3xl text-center hover:border-[var(--orange)] transition-colors">
                <p className="font-semibold text-xl text-gray-800">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join Talent Pool */}
      <section className="py-20 bg-[var(--blue)] text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Join Our Talent Pool
          </h2>
          <p className="text-xl text-white/80 mb-10">
            We’re not actively hiring right now, but we’re always excited to meet passionate 
            people who believe in our mission. Drop your CV and we’ll reach out when opportunities arise.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="mailto:careers@artismart.com"
              className="inline-flex items-center justify-center bg-[var(--orange)] hover:bg-orange-600 px-10 py-4 rounded-2xl font-semibold text-lg transition-all"
            >
              Send Us Your CV <FaEnvelope className="ml-3" />
            </Link>
            
            <Link
              href="/"
              className="inline-flex items-center justify-center border border-white/50 hover:border-white px-10 py-4 rounded-2xl font-semibold text-lg transition-all"
            >
              Learn More About Us
            </Link>
          </div>
        </div>
      </section>

      {/* Final Message */}
      <section className="py-16 bg-white text-center">
        <div className="max-w-2xl mx-auto px-6">
          <p className="text-gray-600 text-lg">
            Whether you’re a developer, designer, marketer, operations expert, or have a unique skill — 
            if you’re passionate about solving real problems in the service industry, we’d love to hear from you.
          </p>
        </div>
      </section>
    </div>
  );
}