import AboutArtismart from '@/components/AboutArtismart'
import AboutContent from '@/components/AboutContent'
import CallToAction from '@/components/CallToAction'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import OurVisionMission from '@/components/OurVisionMission'
import React from 'react'

const page = () => {
  return (
    <div>
        <Navbar/>
        <div className="">
            <AboutArtismart/>
            <AboutContent/>
            <OurVisionMission/>
            <CallToAction/>
        </div>
        <Footer/>
    </div>
  )
}

export default page