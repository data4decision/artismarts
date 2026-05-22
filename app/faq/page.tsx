'use client';

import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import FaqHeader from '@/components/FaqHeader';
import Link from 'next/link';
import React, { useState } from 'react';
import { FaArrowLeft, FaPlus, FaMinus } from 'react-icons/fa';

const faqs = [
  // ==================== GENERAL ====================
  {
    category: "General",
    question: "What is Artismart?",
    answer: "Artismart is a platform that connects customers with skilled and verified local artisans such as plumbers, tailors, carpenters, electricians, painters, and many more."
  },
  {
    category: "General",
    question: "Who can use Artismart?",
    answer: "Both customers looking for quality services and skilled artisans looking for more work opportunities can use Artismart."
  },

  // ==================== CUSTOMERS ====================
  {
    category: "For Customers",
    question: "How do I post a job?",
    answer: "Login to your dashboard, go to the side menu, and select 'Book request'. Describe what you need, add your location, propose time and day, preferred artisans, then submit. You will get notifications once your request is received, assigned to your preferred suitable artisan."
  },
  {
    category: "For Customers",
    question: "How do I choose the right artisan?",
    answer: "You can view their profile, ratings, reviews, portfolio, years of experience, and compare multiple quotes before making a decision."
  },

  // ==================== ARTISANS ====================
  {
    category: "For Artisans",
    question: "How do I become a verified artisan?",
    answer: "Sign up as an Artisan, complete your profile, upload verification documents (ID, work samples, certifications, reference letters or recommendation letter from your Association etc.), and wait for approval (usually within 24-48 hours)."
  },
  {
    category: "For Artisans",
    question: "Can I set my own prices?",
    answer: "Yes, you are free to set your rates. Customers can negotiate or accept your quote."
  },
  {
    category: "For Artisans",
    question: "Is it free to join Artismart?",
    answer: "Yes, joining is completely free. We only charge a small service fee (10-15%) on successfully completed jobs."
  },

  // ==================== PAYMENTS ====================
  {
    category: "Payments & Earnings",
    question: "When do I get paid as an artisan?",
    answer: "Payment is released to your wallet or bank account within 24-48 hours after the customer confirms job completion."
  },
  {
    category: "Payments & Earnings",
    question: "What payment methods are available?",
    answer: "We support bank transfer, mobile money, and card payments."
  },

  // ==================== SAFETY ====================
  {
    category: "Safety & Verification",
    question: "Is Artismart safe?",
    answer: "Yes. All artisans are verified with ID. Payments are held securely until the job is completed. We also have a dispute resolution system."
  },
  {
    category: "Safety & Verification",
    question: "What happens if an artisan shares personal contact?",
    answer: "Sharing personal contact details outside the platform is strictly prohibited. The artisan's account will be suspended immediately and he will be banned from the platform and pay penalties."
  }
];

const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="">
      <Navbar/>
      <FaqHeader/>
      <div className="min-h-screen bg-gray-50 pb-12 font-roboto">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-4 mb-10">
          <Link href="/dashboard/artisan/settings" className="text-[var(--blue)] hover:text-[var(--orange)]">
            <FaArrowLeft size={24} />
          </Link>
          <h1 className="text-4xl font-bold text-[var(--blue)]">Frequently Asked Questions</h1>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition"
              >
                <span className="font-medium text-[var(--orange)] pr-6">{faq.question}</span>
                <span className="text-[var(--orange)]">
                  {openIndex === index ? <FaMinus /> : <FaPlus />}
                </span>
              </button>

              <div className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-96' : 'max-h-0'}`}>
                <div className="px-6 pb-6 text-[var(--blue)] leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-[var(--orange)] font-medium">
            Still have questions?{' '}
            <Link href="tel:+2348069517707" className="text-[var(--blue)] font-medium hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
    <Footer/>
    </div>
  );
};

export default FAQPage;