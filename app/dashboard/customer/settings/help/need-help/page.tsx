// 'use client';

// import Link from 'next/link';
// import React from 'react';
// import { FaArrowLeft, FaInfoCircle, FaVideo, FaQuestionCircle, FaBook } from 'react-icons/fa';

// const HelpPage = () => {
//   return (
//     <div className="min-h-screen bg-gray-50 font-roboto mt-10">
//       <div className="max-w-5xl mx-auto px-4 py-8">
//         {/* Header */}
//         <div className="flex items-center gap-4 mb-8">
//           <Link 
//             href="/dashboard/customer/settings/help"
//             className="flex items-center gap-3 text-[var(--blue)] hover:text-[var(--orange)] transition-colors"
//           >
//             <FaArrowLeft size={22} />
//           </Link>
          
//           <div className="flex items-center gap-4">
//             <div className="bg-[var(--orange)]/10 p-3 rounded-2xl">
//               <FaInfoCircle size={42} className="text-[var(--blue)]" />
//             </div>
//             <div>
//               <h1 className="text-4xl font-bold text-[var(--blue)]">Need Help?</h1>
//               <p className="text-[var(--orange)] mt-1">We're here to guide you</p>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
//           {/* Video Section */}
          
// <div className="mt-8">
//   <div className="flex items-center gap-3 mb-4">
//     <FaVideo className="text-[var(--orange)]" size={26} />
//     <h2 className="text-2xl font-semibold text-[var(--blue)]">Quick Start Guide</h2>
//   </div>
  
//   <p className="text-[var(--blue)] mb-4">
//     Watch this short video to learn how to use Artismart
//   </p>

//   <div className="bg-[var(--blue)] rounded-2xl overflow-hidden shadow-lg">
//     {/* <video
//       src="/supports.mp4"
//       controls
//       playsInline
//       className="w-full h-auto rounded-2xl"
//       poster="/video-thumbnail.jpg"   // Optional: Add a nice thumbnail
//     >
//       Your browser does not support the video tag.
//     </video> */}

    
//   </div>

//   <p className="text-center text-xs text-gray-500 mt-3">
//     Tip: Make sure your internet is stable for smooth playback
//   </p>
// </div>
//           {/* Manual Guide */}
//           <div className="p-8">
//             <div className="flex items-center gap-3 mb-6">
//               <FaBook className="text-[var(--orange)]" size={24} />
//               <h2 className="text-2xl font-semibold text-[var(--blue)]">App Manual Guide</h2>
//             </div>

//             <div className="prose prose-blue max-w-none text-gray-700 space-y-8">
//               <div>
//                 <h3 className="text-xl font-semibold text-[var(--blue)] mb-3">1. Getting Started</h3>
//                 <ul className="list-disc pl-6 space-y-2">
                  // <li>Browse available artisans near you by category, first name and skills </li>
                  // <li>Post a job request with your requirements </li>
                  // <li>Review artisan profiles, ratings, and past work</li>
//                 </ul>
//               </div>

//               <div>
//                 <h3 className="text-xl font-semibold text-[var(--blue)] mb-3">2. How to Post a Job</h3>
//                 <ul className="list-disc pl-6 space-y-2">
                  // <li>Go to "Post a Job" from the dashboard</li>
                  // <li>Fill in job details and preferred date</li>
                  // <li>Upload reference images if needed</li>
                  // <li>Wait for artisan proposals</li>
//                 </ul>
//               </div>

//               <div>
//                 <h3 className="text-xl font-semibold text-[var(--blue)] mb-3">3. Managing Your Bookings</h3>
//                 <ul className="list-disc pl-6 space-y-2">
//                   <li>Track all your active and completed jobs in "Booking Request Page"</li>
//                   <li>Communicate directly with admin via the Messages section</li>
//                   <li>Make payments securely through the platform or transfer to the bank account</li>
//                   <li>Leave reviews after job completion</li>
//                 </ul>
//               </div>

//               <div>
//                 <h3 className="text-xl font-semibold text-[var(--blue)] mb-3">4. Payments &amp; Earnings</h3>
//                 <p className="text-[var(--blue)]">
//                   All payments are processed securely. You can track your transaction history 
//                   and download receipts from the Earnings section.
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Support Contact */}
//         <div className="mt-8 text-center">
//           <p className="text-[var(--blue)]">
//             Still need help?{' '}
//             <Link href="/dashboard/customer/support" className="text-[var(--blue)] font-medium hover:underline">
//               Contact Support →
//             </Link>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default HelpPage;

'use client';

import Link from 'next/link';
import React from 'react';
import { FaArrowLeft, FaVideo, FaBook } from 'react-icons/fa';

const HelpPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 font-roboto pb-12">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <Link 
            href="/dashboard/customer/settings/help"
            className="text-[var(--blue)] hover:text-[var(--orange)] transition-colors"
          >
            <FaArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-[var(--blue)]">Need Help?</h1>
            <p className="text-[var(--orange)] mt-1">Learn how to use Artismart</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Video Section */}
          <div className="p-8 border-b">
            <div className="flex items-center gap-3 mb-4">
              <FaVideo className="text-[var(--orange)]" size={26} />
              <h2 className="text-2xl font-semibold text-[var(--blue)]">Quick Start Video</h2>
            </div>
            
            <p className="text-[var(--blue)]/50 mb-6">
              Watch this short video to learn how to use Artismart effectively
            </p>

            <div className="aspect-video bg-[var(--blue)] rounded-2xl overflow-hidden shadow-md">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/fXO5VWmLfr0"
                title="Artismart Tutorial"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-2xl"
              ></iframe>
            </div>
          </div>

          {/* Manual Guide */}
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <FaBook className="text-[var(--orange)]" size={26} />
              <h2 className="text-2xl font-semibold text-[var(--blue)]">App Manual Guide</h2>
            </div>

            <div className="prose prose-blue max-w-none text-[var(--blue)]/50 space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-[var(--blue)] mb-3">1. Getting Started</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Browse available artisans near you by category, first name and skills </li>
                  <li>Post a job request with your requirements </li>
                  <li>Review artisan profiles, ratings, and past work</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[var(--blue)] mb-3">2. How to Post a Job</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Go to "Post a Job" from the dashboard</li>
                  <li>Fill in job details and preferred date</li>
                  <li>Upload reference images if needed</li>
                  <li>Wait for artisan proposals</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[var(--blue)] mb-3">3. Managing Bookings</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Track active and completed jobs</li>
                  <li>Communicate with admin via Messages</li>
                  <li>Make secure payments through the platform</li>
                  <li>Leave reviews after job completion</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Support */}
        <div className="mt-12 text-center">
          <p className="text-[var(--orange)]">
            Still need help?{' '}
            <Link href="/dashboard/customer/support" className="text-[var(--blue)] font-medium hover:underline">
              Contact Support →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;