
import HeroSection from '@/components/HeroSection'
import HowItWork from './HowItWork'
// import FeaturesAndBenefit from './FeaturesAndBenefit'
import React from 'react'
import OurMission from './OurMission'
import Faq from './Faq'
import Navbar from './Navbar'
import FeaturedAppRating from './FeaturedAppRating'
import Footer from './Footer'





const HomePage = () => {
  return (
    <div>
        <Navbar/>
      <HeroSection/>
      <OurMission/>
      <HowItWork/>
      <Faq/>
      <FeaturedAppRating/>
  
      {/* <FeaturesAndBenefit/> */}
      <Footer/>
    </div>
  )
}

export default HomePage