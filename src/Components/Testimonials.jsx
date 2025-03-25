import TestimonialsCard from "../Cards/testimonialsCard"

function Testimonials() {
  return (
    <section
      className="py-20 px-8 md:px-12 lg:px-24 text-center"
      id="testimonials"
    >
      <h2 className="text-3xl md:text-4xl font-playfair text-gray-800 mb-10">
        What Our Clients Say
      </h2>
      <div className="flex flex-wrap justify-center gap-8">
        <TestimonialsCard img="src\assets\woman 1.jpeg" msg="Harmony Interiors transformed our living space into a cozy haven.
        Outstanding design and attention to detail!" actor="Sarah L." />
        <TestimonialsCard img="src\assets\woman 2.jpeg" msg="Exceptional service and innovative design ideas. Our office space now feels modern and welcoming." actor="Michael B." />
        <TestimonialsCard img="src\assets\man.jpeg" msg="Their team understood our vision perfectly. The result exceeded our expectations!" actor="Emily R." />
      </div>
    </section>

  )
}

export default Testimonials