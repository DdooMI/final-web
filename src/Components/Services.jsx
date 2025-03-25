

function Services() {
    return (
        <section className="py-20 px-8 md:px-12 lg:px-24 text-center bg-[#dddddd] even:bg-gray-300" id="services">
            <h2 className="text-3xl md:text-4xl font-playfair text-gray-800 mb-10">
                Our Services
            </h2>
            <ul className="list-none max-w-xl mx-auto text-lg font-playfair text-gray-600">
                <li className="mb-4 flex items-center gap-3">
                    <span className="text-[#C19A6B] text-xl">✔</span> Interior Design
                    Consultation
                </li>
                <li className="mb-4 flex items-center gap-3">
                    <span className="text-[#C19A6B] text-xl">✔</span> Space Planning
                </li>
                <li className="mb-4 flex items-center gap-3">
                    <span className="text-[#C19A6B] text-xl">✔</span> Custom Furniture Design
                </li>
                <li className="mb-4 flex items-center gap-3">
                    <span className="text-[#C19A6B] text-xl">✔</span> Project Management
                </li>
            </ul>
        </section>

    )
}

export default Services