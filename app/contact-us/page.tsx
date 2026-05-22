'use client';

import React, { useState } from 'react';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock, FaWhatsapp, FaArrowRight } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

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
      <section className="bg-[var(--blue)] text-white py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-bold mb-6"
          >
            Let’s Talk
          </motion.h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            We’re here to help you connect with the best artisans or answer any questions you have.
          </p>
        </div>
      </section>

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
                    <p className="font-semibold text-lg">Call Us</p>
                    <a href="tel:+2348012345678" className="text-gray-600 hover:text-[var(--orange)] text-lg">+234 801 234 5678</a>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="w-14 h-14 bg-[var(--orange)]/10 text-[var(--orange)] rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                    <FaWhatsapp />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">WhatsApp</p>
                    <a href="https://wa.me/2348012345678" target="_blank" className="text-gray-600 hover:text-[var(--orange)] text-lg">+234 801 234 5678</a>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="w-14 h-14 bg-[var(--orange)]/10 text-[var(--orange)] rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                    <FaEnvelope />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Email</p>
                    <a href="mailto:support@artismart.com" className="text-gray-600 hover:text-[var(--orange)]">support@artismart.com</a>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="w-14 h-14 bg-[var(--orange)]/10 text-[var(--orange)] rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                    <FaMapMarkerAlt />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Visit Us</p>
                    <p className="text-gray-600 leading-tight">
                      123 Adeola Odeku Street<br />
                      Victoria Island, Lagos
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Have More Questions? Section */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[var(--blue)] mb-6">
              Have More Questions?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12">
              Join thousands of satisfied customers and artisans who trust ArtiSmart every day.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <a
                href="https://wa.me/2348012345678"
                target="_blank"
                className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-semibold px-10 py-4 rounded-2xl text-lg transition-all duration-300 hover:scale-105"
              >
                💬 Chat With Us on WhatsApp
              </a>

              <a
                href="tel:+2348012345678"
                className="inline-flex items-center justify-center border-2 border-[var(--blue)] text-[var(--blue)] hover:bg-[var(--blue)] hover:text-white font-semibold px-10 py-4 rounded-2xl text-lg transition-all duration-300 hover:scale-105"
              >
                📅 Schedule a Call
              </a>
            </div>
          </motion.div>
        </div>
      </section>
      <Footer/>
    </div>
  );
}