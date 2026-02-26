// app/components/HowItWork.tsx   ← recommended file name & extension

'use client'

import React from 'react'
import Slider from "react-slick"
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

export default function HowItWork() {
  const settings = {
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
    swipeToSlide: true,
    responsive: [
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 1,
          dots: false,
          arrows: true
        }
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          dots: false,
          arrows: true
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          dots: true,
          arrows: true
        }
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          dots: true,
          arrows: false
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          dots: true,
          arrows: false
        }
      }
    ]
  }

  const steps = [
    {
      name: "Choose a Service",
      description: "Simply search for the service you need — plumbing, electrical work, painting, and more.",
      icon: React.createElement(FaSearch)
    },
    {
      name: "Find a Verified Artisan",
      description: "Browse through our list of artisans by skill, location, rating, and availability.",
      icon: React.createElement(FaUserCheck)
    },
    {
      name: "Book Your Artisan",
      description: "Select your artisan and schedule a time that works best for you.",
      icon: React.createElement(FaCalendarCheck)
    },
    {
      name: "Secure Payment",
      description: "Make payment through the app — securely held until the job is completed.",
      icon: React.createElement(FaShieldAlt)
    },
    {
      name: "Job Completion & Rating",
      description: "Once the job is done, confirm completion, leave a review, and rate the artisan.",
      icon: React.createElement(FaCheckDouble)
    }
  ]

  const artisans = [
    {
      name: "Register & Get Verified",
      description: "Sign up with your details, upload documents, and get verified to gain trust.",
      icon: React.createElement(FaUserPlus)
    },
    {
      name: "Create Your Profile",
      description: "Set up your profile with your skills, experience, and service areas.",
      icon: React.createElement(FaBell)
    },
    {
      name: "Receive Job Requests",
      description: "Get notified of available jobs in your location. You can accept or decline them.",
      icon: React.createElement(FaEnvelope)
    },
    {
      name: "Complete the Job",
      description: "Deliver the job as agreed, ensuring quality and professionalism.",
      icon: React.createElement(FaCheckCircle)
    },
    {
      name: "Get Paid",
      description: "Receive payment for your work directly through the app — minus the platform’s commission.",
      icon: React.createElement(FaDollarSign)
    }
  ]

  const createCard = (item: { name: string; description: string; icon: React.ReactNode }, index: number) =>
    React.createElement('div', { key: index, className: "px-3 sm:px-4" },
      React.createElement('div', {
        className: "flex flex-col items-center text-center bg-white border border-[var(--blue)]/30 rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-xl hover:border-[var(--orange)] transition-all duration-300 min-h-[280px] sm:min-h-[320px]"
      },
        React.createElement('div', {
          className: "mb-5 sm:mb-6 text-5xl sm:text-6xl bg-[var(--blue)] text-white rounded-full p-5 sm:p-6 border-4 border-[var(--orange)] shadow-inner"
        }, item.icon),

        React.createElement('h3', {
          className: "text-lg sm:text-xl font-bold text-[var(--blue)] mb-3 sm:mb-4"
        }, item.name),

        React.createElement('p', {
          className: "text-sm sm:text-base text-gray-700 leading-relaxed"
        }, item.description)
      )
    )

  return React.createElement('div', { className: "py-12 sm:py-16 md:py-20 bg-[var(--orange)]/5 font-roboto" },

    // Customers Section
    React.createElement('div', { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" },
      React.createElement('div', { className: "text-center mb-10 sm:mb-14" },
        React.createElement('h2', {
          className: "text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--blue)] mb-3 sm:mb-4"
        }, "How it Works for Customers"),
        React.createElement('p', {
          className: "text-base sm:text-lg md:text-xl text-[var(--blue)]/90 max-w-3xl mx-auto"
        }, "Get quality service with ArtiSmart in just a few easy steps")
      ),

      React.createElement('div', { className: "slider-container pb-8 sm:pb-12" },
        React.createElement(Slider, settings,
          steps.map(createCard)
        )
      )
    ),

    // Artisans Section
    React.createElement('div', { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16 md:mt-20" },
      React.createElement('div', { className: "text-center mb-10 sm:mb-14" },
        React.createElement('h2', {
          className: "text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--blue)] mb-3 sm:mb-4"
        }, "How it Works for Artisans")
      ),

      React.createElement('div', { className: "slider-container pb-8 sm:pb-12" },
        React.createElement(Slider, settings,
          artisans.map(createCard)
        )
      ),

      React.createElement('div', { className: "flex justify-center mt-8 sm:mt-12" },
        React.createElement(Link, {
          href: "/signup",
          className: "inline-flex items-center px-8 sm:px-10 py-4 sm:py-5 bg-[var(--orange)] hover:bg-[var(--orange)]/90 text-white font-semibold text-base sm:text-lg rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
        },
          "Join as an Artisan →"
        )
      )
    )
  )
}