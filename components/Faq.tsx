'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { FaArrowDown, FaArrowRight, FaSearch } from 'react-icons/fa'

const Faq = () => {
  const [openItems, setOpenItems] = useState<Record<number, boolean>>({})
  const [search, setSearch] = useState('')

  const faqs = [
    {
      question: "What is Artismart and who is it for?",
      answer:
        "Artismart is a mobile/web platform designed specifically for artisans and skilled craftsmen. It connects local artisans (like tailors, carpenters, plumbers, electricians, shoemakers, hairdressers, and other service providers) with customers who need quality handmade or custom work. Whether you're an artisan looking for more clients or a customer seeking reliable local services, Artismart makes it easy to browse, book, and pay securely.",
    },
    {
      question: "How do I sign up as an artisan on Artismart?",
      answer:
        "Download the Artismart app or visit the website, select 'Join as Artisan', and create your profile. You'll need to provide your full name, phone number, location, services you offer (e.g., plumbing, tailoring, furniture making), photos of your previous work, and verify your identity. Once approved (usually within 24-48 hours), you can start accepting bookings and showcasing your skills to customers in your area.",
    },
    {
      question: "What fees does Artismart charge artisans?",
      answer:
        "Artismart charges a small service fee (typically 10-15%) only on completed and paid jobs — there are no monthly subscription fees or listing costs. This helps keep the platform free for artisans to join and build their profile. Customers pay directly through the app (via card, mobile money, or cash on delivery), and your earnings are transferred to your wallet or bank account quickly after job completion.",
    },
    {
      question: "How can customers find and book artisans on Artismart?",
      answer:
        "Customers can search by service type (e.g., 'fix leaking tap', 'custom wedding dress', 'furniture repair'), location, ratings, and price range. They can view artisan profiles, portfolios of past work, read reviews, and book instantly or request a quote. Artisans receive notifications and can accept/decline jobs, chat with customers, and update job status — making the whole process transparent and convenient.",
    },
    {
      question: "Is Artismart safe and secure for artisans and customers?",
      answer:
        "Yes — we prioritize safety. All artisans are verified with ID and work samples. Payments are held securely until the job is marked complete by the customer. We offer dispute resolution support, ratings/reviews for quality control, and secure chat within the app. Customers can report issues, and we have a dedicated support team to ensure fair experiences for everyone on the platform.",
    },
  ]

  // Filter FAQs based on search term (case-insensitive)
  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(search.toLowerCase()) ||
    faq.answer.toLowerCase().includes(search.toLowerCase())
  )

  const toggleItem = (index: number) => {
    setOpenItems(prev => ({ ...prev, [index]: !prev[index] }))
  }

  return (
    <div className="font-roboto">
      <div className="bg-[var(--blue)] py-12 md:py-16 lg:py-20">
        <h1 className="text-xl lg:text-4xl md:text-3xl font-bold text-center text-[var(--white)]">
          Question & Answers
        </h1>
        <p className="text-lg lg:text-[17px] md:text-[15px] text-center text-[var(--white)] mt-3">
          Find answers to all your queries about the Artismart artisan platform.
        </p>

        <div className="mt-10 md:mt-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-7xl mx-auto px-6">
            <div className="flex justify-center md:justify-start">
              <Image
                src="/faqs.png"
                alt="Artismart artisan illustration"
                width={500}
                height={500}
                className="object-contain max-w-full h-auto"
                priority
              />
            </div>

            <div>
              {/* Search input */}
              <div className="relative w-full max-w-md mx-auto md:mx-0">
                <input
                  type="text"
                  placeholder="Search FAQs (e.g. artisan signup, fees, booking...)"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    // Optional: close all open items when search changes
                    setOpenItems({})
                  }}
                  className="w-full bg-white py-3 px-4 pr-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--orange)] border border-gray-200"
                />
                <FaSearch
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--blue)] pointer-events-none"
                />
              </div>

              <div className="bg-white rounded-xl shadow-lg mt-8 p-6 md:p-8">
                <h2 className="text-xl lg:text-2xl font-bold text-center text-[var(--blue)] mb-6">
                  Help You to Find
                </h2>

                {filteredFaqs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No matching questions found. Try different keywords.
                  </div>
                ) : (
                  filteredFaqs.map((faq, index) => (
                    <div key={index} className="mb-4 last:mb-0">
                      <button
                        type="button"
                        onClick={() => toggleItem(index)}
                        aria-expanded={!!openItems[index]}
                        aria-controls={`faq-${index}`}
                        className="flex items-center justify-between w-full py-4 px-5 text-left border-b border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-[var(--blue)] font-medium text-base lg:text-lg">
                          {faq.question}
                        </span>
                        {openItems[index] ? (
                          <FaArrowDown
                            size={28}
                            className="bg-[var(--blue)] text-white p-1.5 rounded-full border-2 border-[var(--orange)] flex-shrink-0"
                          />
                        ) : (
                          <FaArrowRight
                            size={28}
                            className="bg-[var(--blue)] text-white p-1.5 rounded-full border-2 border-[var(--orange)] flex-shrink-0"
                          />
                        )}
                      </button>

                      {openItems[index] && (
                        <div id={`faq-${index}`} className="px-5 py-4 bg-gray-50">
                          <p className="text-[var(--blue)] text-sm lg:text-base leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Faq