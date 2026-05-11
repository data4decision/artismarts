'use client';

import Link from 'next/link';
import React from 'react';
import { FaArrowLeft } from 'react-icons/fa';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50 font-roboto">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <Link href="/dashboard/customer/settings" className="text-[var(--blue)] hover:text-[var(--orange)] transition-colors">
            <FaArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-[var(--blue)]">Privacy Policy</h1>
            <p className="text-[var(--blue)] mt-1">Last Updated: May 2026</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-8 md:p-12 prose prose-blue max-w-none">
          <h2 className="text-2xl font-semibold text-[var(--blue)] mb-6">1. Introduction</h2>
          <p className='text-[var(--blue)]/90'>
            At Artismart, we value your privacy and are committed to protecting your personal data. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
            when you use our platform.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--blue)] mt-10 mb-6 text-[var(--blue)]">2. Information We Collect</h2>
          <h3 className="text-xl font-medium text-[var(--blue)]">Personal Information</h3>
          <ul className="list-disc pl-6 space-y-2 text-[var(--blue)]/90">
            <li>Name, email address, phone number, and residential address</li>
            <li>Profile information (for artisans: skills, experience, portfolio)</li>
            <li>Payment information (processed securely by third-party providers)</li>
            <li>Identification documents (for artisan verification)</li>
          </ul>

          <h3 className="text-xl font-medium mt-6 text-[var(--blue)]">Usage Data</h3>
          <ul className="list-disc pl-6 space-y-2 text-[var(--blue)]/90">
            <li>Job requests, messages, and interactions on the platform</li>
            <li>Device information and IP address</li>
            <li>Usage patterns and preferences</li>
          </ul>

          <h2 className="text-2xl font-semibold text-[var(--blue)] mt-10 mb-6 text-[var(--blue)]">3. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-2 text-[var(--blue)]/90">
            <li>To provide and improve our services</li>
            <li>To connect customers with artisans</li>
            <li>To process payments and transactions</li>
            <li>To send important updates and notifications</li>
            <li>To verify artisan identities and maintain platform safety</li>
            <li>To respond to your inquiries and provide customer support</li>
          </ul>

          <h2 className="text-2xl font-semibold text-[var(--blue)] mt-10 mb-6 text-[var(--blue)]">4. Sharing of Information</h2>
          <p className='text-[var(--blue)]/90'>We do not sell your personal data. We may share information only in the following cases:</p>
          <ul className="list-disc pl-6 space-y-2 text-[var(--blue)]/90">
            <li>With artisans/customers as necessary to fulfill a job request</li>
            <li>With payment processors and service providers</li>
            <li>When required by law or to protect our rights</li>
          </ul>

          <h2 className="text-2xl font-semibold text-[var(--blue)] mt-10 mb-6 text-[var(--blue)]">5. Data Security</h2>
          <p className='text-[var(--blue)]/90'>
            We implement appropriate technical and organizational measures to protect your personal data 
            against unauthorized access, alteration, disclosure, or destruction.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--blue)] mt-10 mb-6">6. Your Rights</h2>
          <p className='text-[var(--orange)]'>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2 text-[var(--blue)]/90">
            <li>Access, correct, or delete your personal data</li>
            <li>Object to or restrict processing of your data</li>
            <li>Request data portability</li>
          </ul>

          <h2 className="text-2xl font-semibold text-[var(--blue)] mt-10 mb-6">7. Contact Us</h2>
          <p className='text-[var(--blue)]/90'>
            If you have any questions about this Privacy Policy, please contact us at:<br />
            <strong>Email:</strong> info@data4decision.org
          </p>

          <div className="mt-12 pt-8 border-t text-center text-sm text-gray-500">
            By using Artismart, you agree to this Privacy Policy.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;