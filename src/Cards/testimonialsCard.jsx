/* eslint-disable react/prop-types */


function TestimonialsCard(props) {
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden w-96 p-6 flex items-center space-x-4 transform transition duration-300 hover:-translate-y-2 hover:shadow-2xl">
    <img
      src={props.img}
      alt="Photo of Sarah L."
      className="w-20 h-20 rounded-full object-cover"
    />
    <div>
      <p className="text-gray-600 text-lg leading-relaxed">
        {props.msg}
      </p>
      <h4 className="text-gray-800 font-semibold mt-2">- {props.actor}</h4>
    </div>
  </div>
  )
}

export default TestimonialsCard