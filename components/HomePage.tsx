
import HeroSection from '@/components/HeroSection'
import HowItWork from './HowItWork'
// import FeaturesAndBenefit from './FeaturesAndBenefit'
import React from 'react'
import OurMission from './OurMission'
import Faq from './Faq'
import Navbar from './Navbar'





const HomePage = () => {
  return (
    <div>
        <Navbar/>
      <HeroSection/>
      <OurMission/>
      <HowItWork/>
      <Faq/>
  
      {/* <FeaturesAndBenefit/> */}
      
    </div>
  )
}

export default HomePage