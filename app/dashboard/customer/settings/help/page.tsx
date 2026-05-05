import Link from 'next/link';
import React from 'react'
import { FaGlobe, FaInfoCircle, FaLightbulb, FaPhoneAlt, FaQuestionCircle, FaTools } from 'react-icons/fa'

const help = [
  {
    id: "product",
    title: "Suggest a Feature",
    description: "Share ideas for new features you'd love to see in Artismart",
    href: "/dashboard/customer/settings/help/product-feature",
    icon: FaLightbulb
  },
  {
    id: "technical",
    title: "Report a Technical Issue",
    description: "Having trouble with your account or app functionality? Let us know",
    href: "/dashboard/customer/settings/help/technical",
    icon: FaTools
  },
  {
    id: "help",
    title: "Get Support",
    description: "Ask a question or describe any issue you're experiencing",
    href: "/dashboard/customer/settings/help/need-help",
    icon: FaInfoCircle
  },
  {
    id: "faq",
    title: "Frequently Asked Questions",
    description: "Find quick answers to common questions about Artismart",
    href: "/dashboard/customer/settings/help/faq",
    icon: FaQuestionCircle
  }
];

const page = () => {
  return (
    <div className='max-w-4xl mx-auto p-6'>
        <div className="flex items-center gap-3 mb-8">
            <FaPhoneAlt size={38} className='text-[var(--blue)] bg-[var(--orange)]/50 rounded-full p-2'/>
            <h1 className='text-3xl font-bold text-[var(--blue)]'>Contact Us</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {help.map((item) => {
            const Icon = item.icon;
            return (
                <Link
                key={item.id}
                href={item.href}
                className='group bg-[var(--white)], border border-[var(--blue)] hover:border-[var(--orange)] p-6 rounded-2xl transition-all duration-200 hover:shadow-md flex gap-4 '>
                    <div className="w-12 h-12 rounded-xl bg-[var(--orange)]/10 flex items-center justify-center flex-shrink-0">
                    <Icon className='text-2xl text-[var(--orange)]'/>
                    </div>
                    <div>
                        <h3 className='font-semibold text-lg text-[var(--blue)] group-hover:text-[var(--orange)] transition-colors'>{item.title}</h3>
                        <p className="text-[var(--blue)] text-sm mt-1 leading-relaxed">
                            {item.description}
                        </p>
                    </div>
                </Link>
            )
           })}
        </div>
    </div>
  )
}

export default page