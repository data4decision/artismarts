import Link from 'next/link';
import Image from 'next/image';
import { FaArrowLeft, FaCalendar, FaUser } from 'react-icons/fa';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

export default function HomeMaintenanceGuide() {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
        <Navbar/>
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <Link href="/blog" className="inline-flex items-center gap-2 text-[var(--blue)] mb-8 hover:underline">
          <FaArrowLeft /> Back to Blog
        </Link>

        <Image 
          src="/blog/home-maintainance.jpg" 
          alt="The Ultimate Guide to Home Maintenance in Nigeria" 
          width={1200} 
          height={600} 
          priority
          className="rounded-3xl mb-8 w-full object-cover" 
        />

        <h1 className="text-4xl md:text-5xl font-bold text-[var(--blue)] leading-tight mb-6">
          The Ultimate Guide to Home Maintenance in Nigeria
        </h1>

        <div className="flex items-center gap-6 text-sm text-gray-500 my-8">
          <div className="flex items-center gap-2">
            <FaUser /> Artismart Team
          </div>
          <div className="flex items-center gap-2">
            <FaCalendar /> May 5, 2026
          </div>
          <div>10 min read</div>
        </div>

        <article className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
          <h2>Keep Your Home in Top Condition</h2>
          <p>Regular maintenance saves you money and prevents major repairs. Here's what every homeowner in Nigeria should know:</p>

          <h3>Plumbing Maintenance</h3>
          <p>Check for leaks monthly. Fix dripping taps immediately to avoid water wastage and high bills.</p>

          <h3>Electrical Safety</h3>
          <p>Never overload sockets. Have your wiring checked by a certified electrician every 2-3 years.</p>

          <h3>When to Call a Professional</h3>
          <p>Some jobs are better left to verified artisans — especially electrical works, roofing, and structural repairs.</p>

          <p className="mt-10 font-semibold text-[var(--blue)]">
            Pro Tip: Create a monthly maintenance checklist to stay on top of small issues before they become expensive problems.
          </p>
        </article>
      </div>
      <Footer/>
    </div>
  );
}