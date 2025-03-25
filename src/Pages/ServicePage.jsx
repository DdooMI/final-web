import { useState } from "react";
import ServiceCard from "../Cards/serviceCard";
import Hero from "../Components/Hero";

function ServicePage() {
    const [activeIndex, setActiveIndex] = useState(null);

    const toggleFAQ = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    const faqs = [
        {
            question: "How do I reset my password?",
            answer: "You can reset your password by going to the login page and clicking on 'Forgot Password'. Follow the instructions sent to your email."
        },
        {
            question: "Do you offer international shipping?",
            answer: "Yes, we offer international shipping to most countries. Shipping costs and delivery times vary based on location."
        },
        {
            question: "Can I cancel my order after placing it?",
            answer: "Orders can be canceled within 24 hours of placing them. After this period, we begin processing the order, and cancellation may not be possible."
        },
        {
            question: "What payment methods do you accept?",
            answer: "We accept major credit cards, PayPal, Apple Pay, and Google Pay. More payment options may be available depending on your region."
        },
        {
            question: "How can I contact customer support?",
            answer: "You can reach our support team via email at support@example.com or through the live chat feature on our website."
        }
    ];
    return (

        <>
            <Hero img="home" title={<><span>Designing Spaces You&apos;ll Love</span><br /><span className="text-2xl">Bringing harmony and elegance to your home interiors.

            </span></>} btn="Explore Our Work" />
            <ServiceCard />
            <section className="py-12 bg-gray-100">
                <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-xl p-6">
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-800">F.A.Q.</h1>
                        <p className="text-gray-600">Find answers to common questions below.</p>
                    </div>
                    {faqs.map((faq, index) => (
                        <div key={index} className="border-b border-gray-200 last:border-none">
                        <div
                            className="flex justify-between items-center cursor-pointer py-4 px-2 text-lg font-semibold text-gray-800 transition-all hover:bg-[#A67B5B] hover:text-white"
                            onClick={() => toggleFAQ(index)}
                        >
                            {faq.question}
                            <i className={`fas fa-chevron-${activeIndex === index ? "up" : "down"} text-gray-500 transition-transform`}></i>
                        </div>
                        {activeIndex === index && (
                            <div className="px-2 pb-4 text-gray-600">{faq.answer}</div>
                        )}
                    </div>
                    ))}
                </div>
            </section>
        </>
    )
}

export default ServicePage