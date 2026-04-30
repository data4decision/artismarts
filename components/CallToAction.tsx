import Image from 'next/image';
import React from 'react';
import Link from 'next/link'

const CallToAction = () => {
  return (
    <div className="relative h-[400px] sm:h-[400px] overflow-hidden">
      {/* Background Image */}
      <Image
        src="/artisan.jpeg"
        alt="Artisan working on craft - Artismart"
        fill
        className="object-cover object-center object-top brightness-75"
        priority
      />

      

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Tagline */}
          <h2 className="text-white text-3xl sm:text-5xl lg:text-4xl font-bold leading-tight tracking-tight">
            Empowering Creativity <br />
            Through <span className="text-[var(--blue)]">Innovation</span> and Craft
          </h2>

          {/* Subtext */}
          <p className="text-white/90 text-lg sm:text-xl max-w-md mx-auto">
            Join a thriving community of artisans and discover unique handmade treasures
          </p>

          {/* Link */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link href="/signup " className="bg-[var(--blue)] hover:bg-blue-700 text-white font-semibold text-lg px-10 py-4 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg">
              Become a Customer
            </Link>

            <Link href="/signup" className="bg-white hover:bg-gray-100 text-gray-900 font-semibold text-lg px-10 py-4 rounded-2xl transition-all duration-300 hover:scale-105 border border-white/30">
              Become an Artisan
            </Link>
          </div>
        </div>
      </div>

      {/* Optional Bottom Accent */}
      {/* <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
        <div className="w-3 h-1 bg-[var(--blue)] rounded-full" />
        <div className="w-3 h-1 bg-white/50 rounded-full" />
      </div> */}
    </div>
  );
};

export default CallToAction;