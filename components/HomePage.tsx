
import HeroSection from '@/components/HeroSection'
import HowItWork from './HowItWork'
// import FeaturesAndBenefit from './FeaturesAndBenefit'
import React from 'react'
import OurMission from './OurMission'
import Faq from './Faq'
import Navbar from './Navbar'
import FeaturedAppRating from './FeaturedAppRating'
import Footer from './Footer'
import MobileHowItWork from './MobileHowItWork'





const HomePage = () => {
  return (
    <div>
        <Navbar/>
      <HeroSection/>
      <OurMission/>
      <HowItWork/>
      <MobileHowItWork/>
      <Faq/>
      <FeaturedAppRating/>
  
      {/* <FeaturesAndBenefit/> */}
      <Footer/>
    </div>
  )
}

export default HomePage