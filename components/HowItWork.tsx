'use client'
import React from 'react'
import Slider from "react-slick";
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import Link from 'next/link'
import { FaSearch, FaCalendarCheck, FaUserCheck, FaShieldAlt, FaCheckDouble, FaUserPlus, FaBell, FaEnvelope, FaCheckCircle, FaDollarSign } from 'react-icons/fa';

function HowItWork() {
  const settings = {
    dots: false,
    infinite: true,  
    speed: 500,
    autoplay: true,  
    autoplaySpeed: 3000,  
    slidesToShow: 4,
    slidesToScroll: 1,
    initialSlide: 0,
     swipeToSlide: true,
    responsive: [
      {
        breakpoint: 1280,     
        settings: {
          slidesToShow: 4,
          slidesToScroll: 1,
          infinite: true,
          dots: false
        }
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          infinite: true,
          dots: false
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          initialSlide: 0
        }
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1
        }
      },
       {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  };

  const steps = [
    {
      name: "Choose a Service", 
      description: "Simply search for the service you need plumbing, electrical work, painting, and more.", 
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
      description: "Make payment through the app, securely held until the job is completed.", 
      icon: <FaShieldAlt />
    },
    {
      name: "Job Completion & Rating", 
      description: "Once the job is done, confirm completion, leave a review, and rate the artisan.", 
      icon: <FaCheckDouble />
    }
  ];

  const artisans = [
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
      description: "Receive payment for your work directly through the app-minus the platform’s commission", 
      icon: <FaDollarSign />
    }
  ];

  return (
    <div className='py-15 font-roboto bg-[var(--orange)]/10'>
      <div className="py-10 ">
        <h1 className="text-xl lg:text-4xl md:text-3xl font-bold text-center text-[var(--blue)] mt-4">How it Works for Customers</h1>
        <p className='text-xl lg:text-2xl md:text-1xl font-bold text-center text-[var(--blue)] mt-2'>Get quality service with ArtiSmart in just a few easy steps</p>
      </div>
      <div className="slider-container ">
        <Slider {...settings}>
          {steps.map((step, index) => (
            <div key={index} className="">
              <div className="flex flex-col items-center text-center border-1 border-[var(--blue)] rounded-lg p-1 py-3 shadow-1xl hover:p-4 hover:bg-[var(--blue)]/20 ">
                <div className="mb-4 text-4xl bg-[var(--blue)] text-[var(--white)] rounded-full p-3 border-2 border-[var(--orange)]">{step.icon}</div>
                <h3 className="text-lg font-semibold text-[var(--blue)]">{step.name}</h3>
                <p className="text-sm text-[var(--blue)]">{step.description}</p>
              </div>
            </div>
          ))}
        </Slider>
      </div>

      <div className="py-10">
        <h1 className="text-xl lg:text-4xl md:text-3xl font-bold text-center text-[var(--blue)] mt-4">How it Works for Artisan</h1>
      </div>
      <div className="slider-container">
        <Slider {...settings}>
          {artisans.map((artisan, index) => (
            <div key={index} className="">
              <div className="flex flex-col items-center text-center border-1 border-[var(--blue)] rounded-lg p-1 py-3 shadow-1xl hover:p-4 hover:bg-[var(--blue)]/20 ">
                <div className="mb-4 text-4xl bg-[var(--blue)] text-[var(--white)] rounded-full p-3 border-2 border-[var(--orange)]">{artisan.icon}</div>
                <h3 className="text-lg font-semibold text-[var(--blue)]">{artisan.name}</h3>
                <p className="text-sm text-[var(--blue)]">{artisan.description}</p>
              </div>
            </div>
          ))}
        </Slider>
        <div className="flex justify-center">
            <Link href="/signup" className=" mt-6 bg-[var(--orange)]/90 hover:bg-[var(--orange)] text-white font-medium px-8 py-4 rounded-lg text-lg transition">Join as an Artisan</Link>
        </div>
      </div>
    </div>
  );
}

export default HowItWork;
