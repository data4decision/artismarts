import Image from 'next/image';
import React from 'react';
import { 
  Heart, 
  Users, 
  Lightbulb, 
  Target, 
  Eye, 
  Award 
} from 'lucide-react';

const OurVisionMission = () => {
  return (
    <div className="py-20 bg-[var(--orange)] ">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        
        {/* Mission & Vision Section */}
        <div className="grid md:grid-cols-2 gap-12 mb-20">
          
          {/* Our Mission */}
          <div className="bg-[var(--white)]  p-10 rounded-3xl border border-[var(--orange)] ">
            <div className="w-14 h-14 bg-[var(--orange)]  rounded-2xl flex items-center justify-center mb-6">
              <Target className="w-8 h-8 text-[var(--blue)]" />
            </div>
            <h3 className="text-3xl font-bold text-[var(--blue)] dark:text-white mb-4">
              Our Mission
            </h3>
            <p className="text-lg text-[var(--blue)]  leading-relaxed">
              To empower artisans by providing a vibrant digital platform that connects 
              their exceptional craftsmanship with a global audience, while fostering 
              creativity, sustainability, and fair economic opportunities.
            </p>
          </div>

          {/* Our Vision */}
          <div className="bg-[var(--white)]  p-10 rounded-3xl border border-[var(--blue] ">
            <div className="w-14 h-14 bg-[var(--orange)]  rounded-2xl flex items-center justify-center mb-6">
              <Eye className="w-8 h-8 text-[var(--white)] " />
            </div>
            <h3 className="text-3xl font-bold text-[var(--orange)] dark:text-white mb-4">
              Our Vision
            </h3>
            <p className="text-lg text-[var(--blue)] dark:text-gray-300 leading-relaxed">
              A world where every artisan is celebrated, their skills are valued, 
              and traditional craftsmanship thrives alongside modern innovation in 
              a sustainable and inclusive marketplace.
            </p>
          </div>
        </div>

        {/* Core Values Section */}
        <div>
          <div className="text-center mb-12">
            <span className="inline-block px-5 py-2 bg-[var(--blue)]  text-[var(--orange)] text-sm font-semibold rounded-full mb-3">
              CORE VALUES
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-[var(--white)] ">
              What We Stand For
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <div className="flex gap-5 group">
              <div className="w-12 h-12 flex-shrink-0 bg-[var(--white)]  rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Heart className="w-7 h-7 text-[var(--blue)]" />
              </div>
              <div>
                <h4 className="font-semibold text-xl mb-2 text-[var(--blue)] ">Authenticity</h4>
                <p className="text-[var(--white)] ">
                  We celebrate genuine handmade crafts and the unique stories behind every creation.
                </p>
              </div>
            </div>

            <div className="flex gap-5 group">
              <div className="w-12 h-12 flex-shrink-0 bg-purple-100  rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-purple-600 " />
              </div>
              <div>
                <h4 className="font-semibold text-xl mb-2 text-[var(--blue)] dark:text-white">Community</h4>
                <p className="text-[var(--white)]">
                  Building strong connections between artisans, customers, and culture.
                </p>
              </div>
            </div>

            <div className="flex gap-5 group">
              <div className="w-12 h-12 flex-shrink-0 bg-emerald-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Lightbulb className="w-7 h-7 text-emerald-600 " />
              </div>
              <div>
                <h4 className="font-semibold text-xl mb-2 text-[var(--blue)] dark:text-white">Innovation</h4>
                <p className="text-[var(--white)]">
                  Blending traditional craftsmanship with modern technology and creative solutions.
                </p>
              </div>
            </div>

            <div className="flex gap-5 group">
              <div className="w-12 h-12 flex-shrink-0 bg-rose-100 dark:bg-rose-900/50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Award className="w-7 h-7 text-rose-600 dark:text-rose-500" />
              </div>
              <div>
                <h4 className="font-semibold text-xl mb-2 text-[var(--blue)]">Excellence</h4>
                <p className="text-[var(--white)]">
                  Maintaining the highest standards in craftsmanship, service, and customer experience.
                </p>
              </div>
            </div>

            <div className="flex gap-5 group">
              <div className="w-12 h-12 flex-shrink-0 bg-orange-100 dark:bg-orange-900/50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-orange-600 dark:text-orange-500" />
              </div>
              <div>
                <h4 className="font-semibold text-xl mb-2 text-[var(--blue)] dark:text-white">Sustainability</h4>
                <p className="text-[var(--white)]">
                  Promoting ethical practices and environmentally conscious craftsmanship.
                </p>
              </div>
            </div>

            <div className="flex gap-5 group">
              <div className="w-12 h-12 flex-shrink-0 bg-cyan-100 dark:bg-cyan-900/50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Heart className="w-7 h-7 text-cyan-600 dark:text-cyan-500" />
              </div>
              <div>
                <h4 className="font-semibold text-xl mb-2 text-[var(--blue)] dark:text-white">Empowerment</h4>
                <p className="text-[var(--white)]">
                  Equipping artisans with tools, knowledge, and opportunities to grow and succeed.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default OurVisionMission;