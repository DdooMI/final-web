import About from "../Components/About"
import Contact from "../Components/Contact"
import Hero from "../Components/Hero"
import Product from "../Components/Product"
import Services from "../Components/Services"
import Testimonials from "../Components/Testimonials"

function IndexPage() {
    return (
        <>
            <Hero img="home" title="Designing Spaces You&apos;ll Love" discr="Bringing harmony and elegance to your home interiors." btn="Explore Our Work" />
            <About />
            <Product />
            <Services />
            <Testimonials />
            <Contact />
        </>
    )
}

export default IndexPage