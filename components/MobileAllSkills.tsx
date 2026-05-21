'use client';

import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import {
  FaTools, FaHammer, FaPaintRoller, FaWrench, FaBolt, FaSnowflake,
  FaCar, FaLaptop, FaPhone, FaShieldAlt, FaSolarPanel, FaCamera,
  FaUserTie, FaBroom, FaCut, FaCogs, FaIndustry, FaLightbulb,
  FaMicrochip, FaPlug, FaDoorOpen, FaTv
} from 'react-icons/fa';

const skills = [
  { name: "Plumber", icon: <FaWrench className="text-4xl" /> },
  { name: "Electrician", icon: <FaBolt className="text-4xl" /> },
  { name: "Carpenter", icon: <FaHammer className="text-4xl" /> },
  { name: "Painter / Decorator", icon: <FaPaintRoller className="text-4xl" /> },
  { name: "Tiler", icon: <FaTools className="text-4xl" /> },
  { name: "AC Technician", icon: <FaSnowflake className="text-4xl" /> },
  { name: "Refrigerator Technician", icon: <FaSnowflake className="text-4xl" /> },
  { name: "Generator Repair", icon: <FaCogs className="text-4xl" /> },
  { name: "Handyman", icon: <FaTools className="text-4xl" /> },
  { name: "Welder / Fabricator", icon: <FaIndustry className="text-4xl" /> },
  { name: "POP Ceiling Installer", icon: <FaLightbulb className="text-4xl" /> },
  { name: "Interior Decorator", icon: <FaPaintRoller className="text-4xl" /> },
  { name: "CCTV Installer", icon: <FaCamera className="text-4xl" /> },
  { name: "Solar Panel Installer", icon: <FaSolarPanel className="text-4xl" /> },
  { name: "Computer Repair", icon: <FaLaptop className="text-4xl" /> },
  { name: "Phone Repair Technician", icon: <FaPhone className="text-4xl" /> },
  { name: "Network Technician", icon: <FaMicrochip className="text-4xl" /> },
  { name: "Cleaner / Janitor", icon: <FaBroom className="text-4xl" /> },
  { name: "Barber / Hairdresser", icon: <FaCut className="text-4xl" /> },
  { name: "Auto Mechanic", icon: <FaCar className="text-4xl" /> },
  { name: "Auto Electrician", icon: <FaBolt className="text-4xl" /> },
  { name: "HVAC Engineer", icon: <FaSnowflake className="text-4xl" /> },
  { name: "Event Sound Technician", icon: <FaTv className="text-4xl" /> },
  { name: "Aluminum Fabricator", icon: <FaDoorOpen className="text-4xl" /> },
];

const CustomArrow = ({ direction, onClick }: { direction: 'prev' | 'next'; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className={`absolute top-1/2 -translate-y-1/2 z-20 bg-white shadow-lg border border-gray-200 
                hover:bg-gray-50 w-12 h-12 flex items-center justify-center rounded-full
                transition-all hover:scale-110 active:scale-95
                ${direction === 'prev' ? '-left-6' : '-right-6'}`}
  >
    {direction === 'prev' ? <ChevronLeft className="w-6 h-6 text-[var(--blue)]" /> : <ChevronRight className="w-6 h-6 text-gray-700" />}
  </button>
);

export default function SkillsSlider() {
  const settings = {
    dots: false,
    infinite: true,
    speed: 600,
    slidesToShow: 6,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    prevArrow: <CustomArrow direction="prev" />,
    nextArrow: <CustomArrow direction="next" />,
    responsive: [
      { breakpoint: 1280, settings: { slidesToShow: 2 } },
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 768, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 2, arrows: false } },
    ]
  };

  return (
    <div className="lg:hidden py-2 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-7">
          <p className="text-[var(--orange)] font-semibold tracking-widest text-sm mb-3">
            OUR EXPERTISE
          </p>
          <h2 className="text-xl md:text-2xl font-bold text-[var(--blue)]">
            Skilled Artisans in Every Trade
          </h2>
        </div>

        <div className="relative px-8">
          <Slider {...settings}>
            {skills.map((skill, index) => (
              <div key={index} className="px-3">
                <div className="group bg-white border border-gray-100 hover:border-[var(--orange)] 
                                rounded-3xl p-3 text-center transition-all duration-300 
                                hover:shadow-xl hover:-translate-y-1 flex flex-col items-center justify-center h-[150px]">
                  
                  <div className="text-[var(--blue)] group-hover:text-[var(--orange)] transition-colors mb-5">
                    {skill.icon}
                  </div>
                  
                  <h3 className="font-semibold text-sm text-[var(--blue)] group-hover:text-[var(--orange)] transition-colors">
                    {skill.name}
                  </h3>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </div>
  );
}