'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { FaArrowLeft, FaPlus, FaMinus } from 'react-icons/fa';

const faqs = [
  {
    question: "What is Artismart and who is it for?",
    answer:
      "Artismart is a platform that connects skilled artisans and craftsmen with customers who need quality services. Whether you're a tailor, plumber, carpenter, electrician, or any other skilled professional, or a customer looking for reliable local services — Artismart makes the process simple, transparent, and secure.",
  },
  {
    question: "How do I sign up as an artisan on Artismart?",
    answer:
      "Click 'Join as Artisan', fill in your details, upload photos of your previous work, and verify your identity. Once your profile is approved (usually within 24-48 hours), you can start receiving job requests from customers in your area.",
  },
  {
    question: "What fees does Artismart charge artisans?",
    answer:
      "We only charge a small service fee (10-15%) on successfully completed jobs. There are no monthly subscriptions, listing fees, or hidden charges. You keep the majority of your earnings.",
  },
  {
    question: "How can customers find and book artisans?",
    answer:
      "Customers can search by service type, location, ratings, and price range. They can view artisan profiles, portfolios, read reviews, and book instantly or request a quote.",
  },
  {
    question: "Is Artismart safe and secure?",
    answer:
      "Yes. All artisans are verified with ID. Payments are held securely until the job is completed. We have a dispute resolution system, ratings & reviews, and dedicated support to ensure trust and safety for everyone.",
  },
];

const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-roboto pb-12">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <Link 
            href="/dashboard/artisan/settings/help"
            className="text-[var(--blue)] hover:text-[var(--orange)] transition-colors"
          >
            <FaArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-[var(--blue)]">Frequently Asked Questions</h1>
            <p className="text-[var(--orange)] mt-1">Everything you need to know about Artismart</p>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-lg font-medium text-[var(--blue)] pr-4">
                  {faq.question}
                </h3>
                <div className={`text-[var(--orange)] transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}>
                  {openIndex === index ? <FaMinus size={20} /> : <FaPlus size={20} />}
                </div>
              </button>

              <div 
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Still have questions?{' '}
            <Link 
              href="/dashboard/customer/support" 
              className="text-[var(--blue)] font-medium hover:underline"
            >
              Contact Support →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;