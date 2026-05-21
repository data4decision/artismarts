import React from 'react';
import Image from 'next/image';
import { Target, Eye, Users, Shield, Award } from 'lucide-react';

const OurMission = () => {
  return (
    <div className="py-24 bg-white relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#f3f4f6_1px,transparent_1px)] [background-size:40px_40px] opacity-40" />

      <div className="max-w-7xl mx-auto px-6 relative">
        
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16">
          <p className="text-[var(--orange)] font-semibold tracking-[3px] text-sm mb-4">
            OUR PURPOSE
          </p>
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
            Building Trust Between<br />
            <span className="text-[var(--blue)]">Customers & Artisans</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Content - Mission & Vision */}
          <div className="lg:col-span-7 space-y-10">
            
            <div className="space-y-8">
              {/* Mission Card */}
              <div className="group bg-white border border-gray-100 rounded-3xl p-10 hover:border-[var(--orange)]/30 transition-all duration-500 hover:shadow-2xl">
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-orange-100 flex-shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Target className="w-8 h-8 text-[var(--orange)]" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h3>
                    <p className="text-gray-600 leading-relaxed text-lg">
                      To empower skilled artisans by connecting them with customers who value quality workmanship, 
                      while creating transparency, fair opportunities, and sustainable livelihoods.
                    </p>
                  </div>
                </div>
              </div>

              {/* Vision Card */}
              <div className="group bg-white border border-gray-100 rounded-3xl p-10 hover:border-[var(--blue)]/30 transition-all duration-500 hover:shadow-2xl">
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 flex-shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Eye className="w-8 h-8 text-[var(--blue)]" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">Our Vision</h3>
                    <p className="text-gray-600 leading-relaxed text-lg">
                      A world where finding reliable, high-quality artisan services is effortless, 
                      and every skilled professional has the opportunity to thrive in a trusted digital economy.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Core Values */}
            <div>
              <h4 className="text-xl font-semibold text-gray-500 mb-6">Our Core Values</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { icon: Shield, label: "Trust & Safety" },
                  { icon: Users, label: "Community" },
                  { icon: Award, label: "Excellence" },
                  { icon: Target, label: "Transparency" },
                ].map((value, i) => (
                  <div key={i} className="bg-gray-50 hover:bg-white p-6 rounded-2xl border border-transparent hover:border-gray-200 transition-all text-center">
                    <value.icon className="w-9 h-9 mx-auto text-[var(--orange)] mb-4" />
                    <p className="font-medium text-gray-800">{value.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side - Visual */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-[2.75rem] overflow-hidden shadow-2xl aspect-[4/3.1] lg:aspect-auto lg:h-[620px]">
              <Image 
                src="/missions.jpeg" 
                alt="ArtiSmart Mission & Artisans" 
                fill 
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </div>

            {/* Floating Stats */}
            <div className="absolute -bottom-8 -left-6 bg-white rounded-3xl shadow-xl p-7 w-72 hidden xl:block">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-5xl font-bold text-[var(--orange)]">15,000+</p>
                  <p className="text-gray-600 mt-1">Jobs Completed</p>
                </div>
                <div className="text-right">
                  <div className="flex text-2xl">★★★★★</div>
                  <p className="text-sm text-gray-500">4.98 Rating</p>
                </div>
              </div>
            </div>

            {/* Small badge */}
            <div className="absolute -top-6 -right-6 bg-white rounded-2xl px-6 py-4 shadow-lg flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <p className="font-medium text-gray-800">Verified Artisans Only</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OurMission;