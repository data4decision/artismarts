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

interface StepItem {
  name: string
  description: string
  icon: React.ReactNode
}

function MobileHowItWork() {
  const [sliderSettings, setSliderSettings] = useState({
    dots: true,
    infinite: true,
    speed: 600,
    autoplay: true,
    autoplaySpeed: 4000,
    pauseOnHover: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    swipeToSlide: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false,
        }
      }
    ]
  })

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

  const renderCard = (item: StepItem, index: number) => (
    <div className="lg:hidden">
        <div key={index} className="px-3">
      <div className="h-full bg-white border border-[var(--blue)]/30 hover:border-[var(--orange)] 
                      rounded-3xl p-8 shadow-md hover:shadow-xl transition-all duration-300 
                      flex flex-col items-center text-center min-h-[340px]">
        
        {/* Icon */}
        <div className="mb-6 text-5xl text-[var(--blue)] bg-[var(--blue)]/5 w-20 h-20 
                        flex items-center justify-center rounded-2xl border border-[var(--orange)]/20">
          {item.icon}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-[var(--blue)] mb-4 leading-tight">
          {item.name}
        </h3>

        {/* Description */}
        <p className="text-[var(--blue)]/80 text-[15px] leading-relaxed flex-1">
          {item.description}
        </p>
      </div>
    </div>
    </div>
  )

  return (
    <div className=" py-16 md:py-20 bg-[var(--orange)]/5">
      {/* Customers Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--blue)] mb-4">
            How it Works for Customers
          </h2>
          <p className="text-lg text-[var(--blue)]/80 max-w-2xl mx-auto">
            Get quality service with ArtiSmart in just a few easy steps
          </p>
        </div>

        <div className="slider-container">
          <Slider {...sliderSettings}>
            {steps.map(renderCard)}
          </Slider>
        </div>

        <div className="flex justify-center mt-12">
          <Link
            href="/signup"
            className="inline-flex items-center px-10 py-4 bg-[var(--blue)] hover:bg-[var(--blue)]/90 
                       text-white font-semibold text-lg rounded-2xl shadow-lg transition-all duration-300"
          >
            Join as a Customer →
          </Link>
        </div>
      </div>

      {/* Artisans Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-[var(--blue)] mb-4">
            How it Works for Artisans
          </h2>
        </div>

        <div className="slider-container">
          <Slider {...sliderSettings}>
            {artisans.map(renderCard)}
          </Slider>
        </div>

        <div className="flex justify-center mt-12">
          <Link
            href="/signup"
            className="inline-flex items-center px-10 py-4 bg-[var(--blue)] hover:bg-[var(--blue)]/90 
                       text-white font-semibold text-lg rounded-2xl shadow-lg transition-all duration-300"
          >
            Join as an Artisan →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default MobileHowItWork