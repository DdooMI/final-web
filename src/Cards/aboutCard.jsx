/* eslint-disable react/prop-types */


function AboutCard(props) {
  return (
    <div className="w-full sm:w-[45%] lg:w-[30%] text-center sm:text-left">
    <h2 className="text-2xl font-semibold">{props.title}</h2>
    <p className="leading-relaxed">
        {props.descr}
      
    </p>
  </div>
  )
}

export default AboutCard