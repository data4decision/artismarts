// components/CompactTrustBar.tsx
import type { FC } from 'react';
import Image from 'next/image'

const partnerLogos = [
  { name: "Paystack", className: "h-8 w-28" },
  { name: "Flutterwave", className: "h-8 w-28" },
  { name: "Google", className: "h-8 w-20" },
  { name: "Interswitch", className: "h-7 w-28" },
  { name: "Visa", className: "h-6 w-16" },
  { name: "Mastercard", className: "h-6 w-20" },
];

const CompactTrustBar: FC = () => {
  return (
    <div className="bg-white py-10 md:py-12 border-t border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-8 md:flex-row md:items-center md:gap-10 lg:gap-14">

          {/* Left side - Main stat + trust phrase */}
          <div className="text-center md:text-left">
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Trusted across Nigeria
            </p>
            <div className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl">
              98.7% <span className="text-indigo-600">Satisfaction</span>
            </div>
            <p className="mt-2 text-base text-gray-600">
              from thousands of completed jobs
            </p>
          </div>

          {/* Vertical divider (hidden on mobile) */}
          <div className="hidden h-12 w-px bg-gray-300 md:block" />

          {/* Right side - Partner logos */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 md:gap-10 lg:gap-12">
            {partnerLogos.map((logo) => (
              <div
                key={logo.name}
                className="flex items-center justify-center grayscale opacity-70 transition-all duration-300 hover:grayscale-0 hover:opacity-100 hover:scale-105"
              >
                
            
                  <Image
                    src={`/logos/${logo.name.toLowerCase()}.svg`}
                    alt={`${logo.name} logo`}
                    width={112}
                    height={32}
                    className="object-contain"
                  />
              
                <div
                  className={`
                    ${logo.className}
                    bg-gray-50 border border-gray-200 rounded-md
                    flex items-center justify-center
                    text-xs font-medium text-gray-600
                  `}
                >
                  {logo.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Optional small trust icons row - mobile friendly */}
        <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-gray-600 md:mt-8">
          <div className="flex items-center gap-1.5">
            <span className="text-green-500 text-lg">✓</span>
            Verified artisans
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-green-500 text-lg">✓</span>
            Secure payments
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-green-500 text-lg">✓</span>
            24/7 support
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompactTrustBar;