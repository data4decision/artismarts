'use client';

import React, { useState } from 'react';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock, FaWhatsapp, FaArrowRight } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import Link from 'next/link';

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: '', email: '', subject: '', message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 6000);
    }, 1800);
  };

  return (
    <div className="font-roboto">
      <Navbar/>
      {/* Hero */}
      <div className="">
       <div className="relative">
          <Image
            src="/aboutartismart.jpeg"
            alt="Artismart"
            width={1200}
            height={100}
            className="w-full h-100 object-cover object-top"
            priority
            />
          </div>
          <div className="absolute top-1/2 -translate-y-1/2  ">
            <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-7"
          >
        <h1 className='text-2xl text-[var(--blue)] font-bold bg-[var(--white)] w-[220px] sm:ml-20 ml-10  px-4 py-3 rounded-lg border-b-3 border-r-0 border-l-0 border-t-0 border-[var(--blue)]  '>
            Let’s Talk
        </h1>
        <p className='bg-[var(--blue)] text-[var(--white)] sm:text-xl text-sm sm:ml-20  font-semibold mt-3 rounded-lg border-b-3 border-r-0 border-l-0 border-t-0 border-[var(--orange)] px-4 py-4'>We’re here to help you connect with the best artisans or answer any questions you have.</p>
          </motion.div>     
          </div>
          </div>

      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-12 gap-16">
          
          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-7"
          >
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 md:p-16">
              <h2 className="text-3xl font-bold text-[var(--blue)] mb-10">Send Us a Message</h2>

              {submitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-50 border border-green-200 rounded-2xl p-12 text-center"
                >
                  <h3 className="text-3xl font-semibold text-green-800 mb-3">Message Received!</h3>
                  <p className="text-green-700">Thank you. Our team will respond within 24 hours.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:border-[var(--orange)] focus:ring-1 focus:ring-[var(--orange)] outline-none transition"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:border-[var(--orange)] focus:ring-1 focus:ring-[var(--orange)] outline-none transition"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Subject</label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:border-[var(--orange)] focus:ring-1 focus:ring-[var(--orange)] outline-none bg-white"
                    >
                      <option value="">Choose subject</option>
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Customer Support">Customer Support</option>
                      <option value="Artisan Partnership">Become an Artisan</option>
                      <option value="Business Partnership">Partnership / Collaboration</option>
                      <option value="Complaint">Feedback / Complaint</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">Your Message</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={7}
                      className="w-full px-6 py-4 border border-gray-200 rounded-3xl focus:border-[var(--orange)] focus:ring-1 focus:ring-[var(--orange)] outline-none resize-y min-h-[180px]"
                      placeholder="How can we assist you today?"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[var(--orange)] hover:bg-orange-600 text-white font-semibold py-5 rounded-2xl text-lg transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                    {!isSubmitting && <FaArrowRight />}
                  </button>
                </form>
              )}
            </div>
          </motion.div>

          {/* Contact Details */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-5 space-y-10"
          >
            <div>
              <h3 className="text-3xl font-bold text-[var(--blue)] mb-10">Get In Touch</h3>
              
              <div className="space-y-10">
                <div className="flex gap-6">
                  <div className="w-14 h-14 bg-[var(--orange)]/10 text-[var(--orange)] rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                    <FaPhone />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--blue)] text-lg">Call Us</p>
                    <a href="tel:+2349168974621" className="text-[var(--blue)] hover:text-[var(--orange)] text-lg">+2349168974621</a>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="w-14 h-14 bg-[var(--orange)]/10 text-[var(--orange)] rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                    <FaWhatsapp />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--blue)] text-lg">WhatsApp</p>
                    <a href="https://wa.me/+2349168974621" target="_blank" className="text-[var(--blue)] hover:text-[var(--orange)] text-lg">+2349168974621</a>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="w-14 h-14 bg-[var(--orange)]/10 text-[var(--orange)] rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                    <FaEnvelope />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--blue)] text-lg">Email</p>
                    <a href="mailto:info@data4decision.org" className="text-[var(--blue)] hover:text-[var(--orange)]">info@data4decision.org</a>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="w-14 h-14 bg-[var(--orange)]/10 text-[var(--orange)] rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                    <FaMapMarkerAlt />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--blue)] text-lg">Visit Us</p>
                    <p className="text-gray-600 leading-tight">
                      Nipco Filling Station Along Old Jebba Road Sango Area, <br />
                     Ilorin Kwara State.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Have More Questions? Section */}
      <section className="relative h-[400px] sm:h-[400px] overflow-hidden">
        <Image
                src="/artisan.jpeg"
                alt="Artisan working on craft - Artismart"
                fill
                className="object-cover object-center object-top brightness-75"
                priority
              />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[var(--white)] mb-6">
              Have More Questions?
            </h2>
            <p className="sm:text-lg text-md text-white max-w-2xl mx-auto mb-12">
              Join thousands of satisfied customers and artisans who trust ArtiSmart every day.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <Link
                href="https://wa.me/+2349168974621"
                target="_blank"
                className="inline-flex items-center text-sm sm:text-base justify-center bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-2 rounded-2xl text-md transition-all duration-300 hover:scale-105"
              >
                💬 Chat With Us on WhatsApp
              </Link>

              <Link
                href="tel:+2348069517707"
                className="inline-flex items-center text-sm sm:text-base justify-center border-2 border-[var(--blue)] bg-[var(--blue)]/80 text-[var(--white)] hover:bg-[var(--blue)] hover:text-white font-semibold px-10 py-4 rounded-2xl text-lg transition-all duration-300 hover:scale-105"
              >
                📅 Schedule a Call
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      <Footer/>
    </div>
  );
}