/* eslint-disable react/prop-types */


function ProductCard(props) {
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden w-80 transform transition duration-300 hover:-translate-y-2 hover:shadow-2xl">
  <a
    href={props.img}
    data-lightbox="projects"
    data-title="Contemporary Living Room"
  >
    <img
      src={props.img}
      alt="Elegant Living Room"
      className="w-full h-64 object-cover"
    />
  </a>
  <div className="p-6">
    <h3 className="text-xl font-playfair text-gray-800 mb-3">
      Contemporary Living Room
    </h3>
    <p className="text-gray-600 font-playfair">
      A modern take on classic comfort, combining sleek lines with cozy
      elements.
    </p>
    <a
      href="#"
      className="mt-4 inline-block font-playfair bg-[#C19A6B] hover:bg-[#A67B5B] text-white text-lg px-6 py-2 rounded-full transition"
    >
      View Details
    </a>
  </div>
</div>

  )
}

export default ProductCard