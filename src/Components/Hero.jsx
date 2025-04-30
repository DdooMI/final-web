/* eslint-disable react/prop-types */
function Hero(props) {
  return (
    <section
      className="relative h-screen flex flex-col justify-center items-start px-8 md:px-12 lg:px-24 text-white bg-[url('/home.gif')] bg-center bg-cover bg-no-repeat"
    >
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative z-10">
        <h1 className="text-4xl font-bold font-playfair logo">
          {props.title}
        </h1>
        <p className="text-3xl font-bold font-playfair logo mt-4">
          {props.discr}
        </p>
        <a

          className="mt-6 inline-block bg-[#C19A6B] hover:bg-[#A67B5B] text-white text-lg px-8 py-3 rounded-full transition"
          onClick={props.onclick}
        >
          {props.btn}
        </a>
      </div>
    </section>
  );
}

export default Hero;
