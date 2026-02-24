import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const HeroSection = () => {
  return (
    <div className="font-roboto">
    <section
      className="relative min-h-[50vh] md:min-h-screen w-full bg-cover bg-center"
      style={{ backgroundImage: "url('/herobg.jpg')" }}
    >
    
      {/* <div className="absolute inset-0 bg-black/50"></div> */}

      <div className="relative z-10 container mx-auto px-6 py-0 ">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 items-center">
          
          
          <div className="text-white md:mt-20 mt-5">
            <h1 className="text-4xl lg:text-6xl lg:w-[80%] md:text-5xl font-bold leading-tight">
              Find Trusted Artisans Near You
            </h1>
            
            <p className="text-lg md:text-xl mb-8 opacity-90 lg:w-[80%]">
              Connecting you with verified professionals for every job - 
              quickly, easily, and securely.
            </p>

            <Link
              href="/signup"
              className="inline-block bg-[var(--orange)]/90 hover:bg-[var(--orange)] text-white font-medium px-8 py-4 rounded-lg text-lg transition"
            >
              Get Started or Find an Artisan
            </Link>
          </div>

         
          <div className="flex justify-center md:justify-end">
            <div className="relative w-full max-w-[380px] lg:max-w-[680px] md:max-w-[780px] md-w-[700px]  aspect-square ">
              <Image
                src="/art.png"
                alt="Artisan working"
                fill
                className="object-contain lg:mt-5 md:mt-30 "
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