import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const HeroSection = () => {
  return (
    <div className="lg:hidden font-roboto">
    <section
      className="relative min-h-[30vh] md:min-h-[35vh] w-full bg-cover bg-center h-[350px]"
      style={{ backgroundImage: "url('/herobg.jpg')" }}
    >
    
      {/* <div className="absolute inset-0 bg-black/50"></div> */}

      <div className="relative z-10 container mx-auto px-6 py-0 ">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 items-center">
          
          
          <div className="text-white md:mt-0 mt-5">
            <h1 className="text-xl lg:text-6xl lg:w-[80%] md:text-3xl font-bold leading-tight">
              Find Trusted Artisans Near You
            </h1>
            
            <p className="text-[12px] md:text-[15px] mb-4 opacity-90 lg:w-[80%] mt-4">
              Connecting you with verified professionals for every job - 
              quickly, easily, and securely.
            </p>

            <Link
              href="/signup"
              className="inline-block bg-[var(--orange)]/90 hover:bg-[var(--orange)] text-white font-medium px-3 py-2 rounded-lg text-sm transition"
            >
              Get Started 
            </Link>
          </div>

         
          <div className="flex justify-center md:justify-end">
            <div className="relative w-full max-w-[197px] lg:max-w-[680px] md:max-w-[580px] md-w-[700px]  aspect-square ">
              <Image
                src="/art.png"
                alt="Artisan working"
                fill
                className="object-contain lg:mt-8 md:mb-0 mb-10"
                priority
              />
            </div>
          </div>

        </div>
      </div>
    </section>
    </div>
  );
};

export default HeroSection;