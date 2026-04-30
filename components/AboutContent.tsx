import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

const AboutContent = () => {
  return (
    <div className="py-20 bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Image Section */}
          <div className="relative">
            <div className="overflow-hidden rounded-3xl shadow-2xl">
              <Image
                src="/Aboutmarket.png"
                alt="Artismart marketplace showcasing artisans and crafts"
                width={600}
                height={600}
                priority
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
            
            {/* Decorative Accent */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[var(--blue)]/10 rounded-2xl -z-10 hidden lg:block" />
          </div>

          {/* Content Section */}
          <div className="space-y-8">
            <div>
              <span className="inline-block px-4 py-1.5  bg-[var(--orange)] text-[var(--blue)] text-xs font-medium tracking-widest rounded-full mb-4">
                OUR STORY
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold text-[var(--blue)] dark:text-white leading-tight">
                Connecting <span className="text-[var(--orange)]">Artisans</span> with the World
              </h2>
            </div>

            <div className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed space-y-6">
              <p>
                Artismart is a creative platform dedicated to connecting skilled 
                artisans with a wider audience through innovation and technology.
              </p>
              
              <p>
                We bring together talented creators to showcase, promote, 
                and sell their unique crafts while providing a seamless and 
                engaging experience for customers.
              </p>

              <p>
                In addition, Artismart fosters collaboration, creativity, 
                and growth by empowering artisans with the tools and opportunities 
                needed to thrive in a modern digital marketplace.
              </p>
            </div>

            {/* Optional CTA */}
            <div className="pt-4">
              <Link href="/signup" className="group inline-flex items-center gap-3 bg-[var(--blue)] hover:bg-[var(--orange)] text-white px-8 py-4 rounded-2xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30">
                Discover Our Artisans
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutContent;