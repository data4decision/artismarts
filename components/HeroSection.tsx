'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const slides = [
  {
    bg: "/herobg1.png", // Replace with your actual images
    title: "Connect with Skilled Artisans",
    subtitle: "Quality Services, Trusted Professionals",
    description: "Find expert artisans near you for plumbing, tailoring, carpentry, electrical works, and more.",
    buttonText: "Find an Artisan",
    buttonLink: "/signup",
    secondaryText: "Become an Artisan",
    secondaryLink: "/signup"
  },
  {
    bg: "/herobg2.jpg",
    title: "Post a Job & Get Matched",
    subtitle: "From Idea to Completion",
    description: "Tell us what you need. Get quotes from verified local artisans and choose the best fit.",
    buttonText: "Post a Job",
    buttonLink: "/signup",
  },
  {
    bg: "/herobg3.png",
    title: "Build Your Craft Business",
    subtitle: "Grow with Artismart",
    description: "Join thousands of artisans growing their business with verified customers and secure payments.",
    buttonText: "Join as Artisan",
    buttonLink: "/signup",
  }
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Touch Swipe
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  // Auto Slide
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Touch Handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) nextSlide();
    if (distance < -minSwipeDistance) prevSlide();
  };

  const slide = slides[current];

  return (
    <div 
      className="relative w-full h-[300px] md:h-[500px] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Background Images */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <Image
            src={slide.bg}
            alt="Artismart Hero"
            fill
            className="object-cover object-top"
            priority
          />
        </motion.div>
      </AnimatePresence>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--blue)]/70 via-[var(--blue)]/40 to-transparent" />

      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-20 bg-[var(--orange)] hover:bg-[var(--orange)]/80 text-[var(--white)] p-3 rounded-full transition"
      >
        <FaChevronLeft size={24} />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-20 bg-[var(--orange)] hover:bg-[var(--orange)]/80 text-white p-3 rounded-full transition"
      >
        <FaChevronRight size={24} />
      </button>

      {/* Content */}
      <div className="absolute inset-0 flex items-center">
        <div className="max-w-4xl mx-auto px-6 text-white">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-[var(--white)] leading-tight mb-4">
                {slide.title}
              </h1>
              <p className="text-2xl md:text-3xl font-light mb-6 text-white/90">
                {slide.subtitle}
              </p>
              <p className="text-lg md:text-xl text-white/80 mb-8 max-w-lg">
                {slide.description}
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href={slide.buttonLink}
                  className="bg-[var(--orange)] hover:bg-orange-600 text-white px-8 py-4 rounded-full font-semibold text-lg transition"
                >
                  {slide.buttonText}
                </Link>

                {slide.secondaryLink && (
                  <Link
                    href={slide.secondaryLink}
                    className="border-2 border-white hover:bg-white hover:text-[var(--blue)] text-white px-8 py-4 rounded-full font-semibold text-lg transition"
                  >
                    {slide.secondaryText}
                  </Link>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              current === index ? 'bg-[var(--orange)] scale-125' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}