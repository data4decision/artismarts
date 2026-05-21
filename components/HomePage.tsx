
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
import AllSkills from './AllSkills'
import MobileAllSkills from './MobileAllSkills'
import MobileHeroSection from './MobileHeroSection'






const HomePage = () => {
  return (
    <div>
        <Navbar/>
      <HeroSection/>
      <MobileHeroSection/>
      <AllSkills/>
      <MobileAllSkills/>
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