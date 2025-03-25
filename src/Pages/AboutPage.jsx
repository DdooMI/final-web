import AboutContent from "../Components/AboutContent"
import Hero from "../Components/Hero"

function AboutPage() {
  return (
    <>
    <Hero img="home" title={<><span>We will create modern and</span><br /><span>first-class interior.</span></>} btn="contact us" />

    <AboutContent />
    </>
  )
}

export default AboutPage