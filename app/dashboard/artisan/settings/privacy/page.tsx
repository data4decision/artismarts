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
          <Link href="/dashboard/artisan/settings" className="text-[var(--blue)] hover:text-[var(--orange)] transition-colors">
            <FaArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-[var(--blue)]">Privacy &amp; Platform Policy</h1>
            <p className="text-gray-600 mt-1">Last Updated: May 2026</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm p-8 md:p-12 prose prose-blue max-w-none">
          <h2 className="text-2xl font-semibold text-[var(--blue)] mb-6">1. Introduction</h2>
          <p>
            At Artismart, we are committed to protecting your privacy while maintaining a safe and professional marketplace for artisans and customers.
          </p>

          <h2 className="text-2xl font-semibold text-[var(--blue)] mt-10 mb-6">2. Artisan Conduct Policy</h2>
          <p className="font-medium text-red-600 mb-4">Important Rules for All Artisans:</p>
          
          <ul className="list-disc pl-6 space-y-3 text-[var(--blue)]/90">
            <li><strong>Strictly Prohibited:</strong> Sharing personal contact details (phone number, WhatsApp, email, social media handles, etc.) with customers outside the Artismart platform.</li>
            <li>Any artisan caught sharing contact information will have their account <strong>permanently suspended</strong> and may face further consequences.</li>
            <li>Artisans may only discuss job-related matters through the official Artismart chat system.</li>
            <li>All communication with customers must go through Artismart Admin when necessary.</li>
            <li>Only <strong>verified artisans</strong> are allowed to offer services on the platform.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-[var(--blue)] mt-10 mb-6">3. Information We Collect</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Personal and business information provided during registration</li>
            <li>Skills, portfolio, work experience, and verification documents</li>
            <li>Job interactions, messages, and reviews</li>
            <li>Payment and transaction history</li>
          </ul>

          <h2 className="text-2xl font-semibold text-[var(--blue)] mt-10 mb-6">4. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To verify your identity as a professional artisan</li>
            <li>To connect you with potential customers</li>
            <li>To facilitate secure payments and transactions</li>
            <li>To maintain platform safety and enforce our policies</li>
          </ul>

          <h2 className="text-2xl font-semibold text-[var(--blue)] mt-10 mb-6">5. Data Sharing &amp; Protection</h2>
          <p>We do not sell your data. Information is only shared as necessary to complete jobs and ensure platform integrity.</p>

          <h2 className="text-2xl font-semibold text-[var(--blue)] mt-10 mb-6">6. Account Suspension &amp; Termination</h2>
          <p className="text-red-600 font-medium">Artismart reserves the right to suspend or permanently ban any artisan who:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Shares contact information outside the platform</li>
            <li>Attempts to bypass platform payments</li>
            <li>Engages in unprofessional or fraudulent behavior</li>
            <li>Violates any terms outlined in this policy</li>
          </ul>

          <div className="mt-12 pt-8 border-t text-center text-sm text-gray-500">
            By using Artismart as an artisan, you agree to this Privacy &amp; Platform Policy. 
            Violation of the contact sharing rule may result in immediate account suspension.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;