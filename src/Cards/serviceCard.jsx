const img1 = '/img1.jpg';
const img2 = '/img2.jpg';
const img3 = '/img3.jpg';

const services = [
  {
    id: 1,
    title: "Service 1",
    description:
      "We provide high-quality service to meet your needs. Our team is dedicated to delivering top-notch solutions with a focus on customer satisfaction.",
    img: img1,
  },
  {
    id: 2,
    title: "Service 2",
    description:
      "Our professional services ensure efficiency and reliability. With years of experience, we bring the best industry practices to every project.",
    img: img2,
  },
  {
    id: 3,
    title: "Service 3",
    description:
      "Experience excellence with our premium services. We prioritize innovation and quality, making sure you receive the best possible outcome.",
    img: img3,
  },
];

function ServiceCard() {
  return (
    <div className="container mx-auto px-[10%] py-20 space-y-12">
      {services.map((service, index) => (
        <div key={service.id}>
          <div
            className={`flex flex-col md:flex-row items-center gap-8 ${
              index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
            }`}
          >
            <div className="md:w-1/2">
              <h1 className="text-2xl font-bold text-gray-800">{service.title}</h1>
              <p className="text-gray-600 mt-4">{service.description}</p>
              <a
                href="#"
                className="mt-4 inline-block font-playfair bg-[#C19A6B] hover:bg-[#A67B5B] text-white text-lg px-6 py-2 rounded-full transition"
              >
                View Details
              </a>
            </div>
            <div className="md:w-1/2">
              <img src={service.img} alt={service.title} className="w-full max-h-[500px] object-cover rounded-lg shadow-md" />
            </div>
          </div>
          {index < services.length - 1 && <hr className="my-8 border-t border-gray-300" />}
        </div>
      ))}
    </div>
  );
}

export default ServiceCard;
