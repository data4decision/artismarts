'use client'

import React, { useState, useEffect } from 'react'
import Slider from 'react-slick'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'
import Link from 'next/link'
import {
  FaSearch,
  FaCalendarCheck,
  FaUserCheck,
  FaShieldAlt,
  FaCheckDouble,
  FaUserPlus,
  FaBell,
  FaEnvelope,
  FaCheckCircle,
  FaDollarSign
} from 'react-icons/fa'

// Shared type for cards
interface StepItem {
  name: string
  description: string
  icon: React.ReactNode
}

function HowItWork() {
  // Single shared slider settings state
  const [sliderSettings, setSliderSettings] = useState({
    dots: true,
    infinite: true,
    speed: 600,
    autoplay: true,
    autoplaySpeed: 4000,
    pauseOnHover: true,
    pauseOnFocus: true,
    pauseOnDotsHover: true,
    slidesToShow: 4,
    slidesToScroll: 1,
    initialSlide: 0,
    arrows: true,
    swipeToSlide: true
  })

  // Dynamic responsive adjustment (runs on mount + resize)
  useEffect(() => {
    const adjustSlider = () => {
      const width = window.innerWidth

      if (width <= 768) {
        // Mobile / tablet portrait → 1 slide
        setSliderSettings({
          ...sliderSettings,
          slidesToShow: 1,
          slidesToScroll: 1,
          dots: true,
          arrows: false
        })
      } else if (width <= 1024) {
        // Tablet / small laptop → 2 slides
        setSliderSettings({
          ...sliderSettings,
          slidesToShow: 2,
          slidesToScroll: 1,
          dots: true,
          arrows: true
        })
      } else {
        // Desktop → 4 slides
        setSliderSettings({
          ...sliderSettings,
          slidesToShow: 4,
          slidesToScroll: 1,
          dots: false,
          arrows: true
        })
      }
    }

    // Run immediately on mount
    adjustSlider()

    // Listen for window resize
    window.addEventListener('resize', adjustSlider)

    // Cleanup
    return () => window.removeEventListener('resize', adjustSlider)
  }, []) // empty deps → only run once + cleanup

  const steps: StepItem[] = [
    {
      name: "Choose a Service",
      description: "Simply search for the service you need - plumbing, electrical work, painting, and more.",
      icon: <FaSearch />
    },
    {
      name: "Find a Verified Artisan",
      description: "Browse through our list of artisans by skill, location, rating, and availability.",
      icon: <FaUserCheck />
    },
    {
      name: "Book Your Artisan",
      description: "Select your artisan and schedule a time that works best for you.",
      icon: <FaCalendarCheck />
    },
    {
      name: "Secure Payment",
      description: "Make payment through the app - securely held until the job is completed.",
      icon: <FaShieldAlt />
    },
    {
      name: "Job Completion & Rating",
      description: "Once the job is done, confirm completion, leave a review, and rate the artisan.",
      icon: <FaCheckDouble />
    }
  ]

  const artisans: StepItem[] = [
    {
      name: "Register & Get Verified",
      description: "Sign up with your details, upload documents, and get verified to gain trust.",
      icon: <FaUserPlus />
    },
    {
      name: "Create Your Profile",
      description: "Set up your profile with your skills, experience, and service areas.",
      icon: <FaBell />
    },
    {
      name: "Receive Job Requests",
      description: "Get notified of available jobs in your location. You can accept or decline them.",
      icon: <FaEnvelope />
    },
    {
      name: "Complete the Job",
      description: "Deliver the job as agreed, ensuring quality and professionalism.",
      icon: <FaCheckCircle />
    },
    {
      name: "Get Paid",
      description: "Receive payment for your work directly through the app — minus the platform’s commission.",
      icon: <FaDollarSign />
    }
  ]

  // Reusable typed card renderer
  const renderCard = (item: StepItem, index: number) => (
    <div key={index} className="px-3 sm:px-4">
      <div className="flex flex-col items-center text-center bg-white border border-[var(--blue)]/30 rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-xl hover:border-[var(--orange)] transition-all duration-300 min-h-[280px] sm:min-h-[320px]">
        <div className="mb-5 sm:mb-6 text-5xl sm:text-6xl bg-[var(--blue)] text-white rounded-full p-5 sm:p-6 border-4 border-[var(--orange)] shadow-inner">
          {item.icon}
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-[var(--blue)] mb-3 sm:mb-4">
          {item.name}
        </h3>
        <p className="text-sm sm:text-base text-[var(--blue)] leading-relaxed">
          {item.description}
        </p>
      </div>
    </div>
  )

  return (
    <div className="py-12 sm:py-16 md:py-20 bg-[var(--orange)]/5 font-roboto">
      {/* Customers Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--blue)] mb-3 sm:mb-4">
            How it Works for Customers
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-[var(--blue)]/90 max-w-3xl mx-auto">
            Get quality service with ArtiSmart in just a few easy steps
          </p>
        </div>

        <div className="slider-container pb-8 sm:pb-12">
          <Slider {...sliderSettings}>
            {steps.map(renderCard)}
          </Slider>
        </div>
      </div>

      {/* Artisans Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16 md:mt-20">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--blue)] mb-3 sm:mb-4">
            How it Works for Artisans
          </h2>
        </div>

        <div className="slider-container pb-8 sm:pb-12">
          <Slider {...sliderSettings}>
            {artisans.map(renderCard)}
          </Slider>
        </div>

        <div className="flex justify-center mt-8 sm:mt-12">
          <Link
            href="/signup"
            className="inline-flex items-center px-8 sm:px-10 py-4 sm:py-5 bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white font-semibold text-base sm:text-lg rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            Join as an Artisan →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default HowItWork