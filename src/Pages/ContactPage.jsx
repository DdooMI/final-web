import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Hero from "../Components/Hero";

const contactSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    subject: z.string().min(5, "Subject must be at least 5 characters"),
    message: z.string().min(10, "Message must be at least 10 characters"),
});

export default function ContactPage() {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(contactSchema),
    });

    const onSubmit = (data) => {
        console.log("Form submitted: ", data);
    };

    return (
        <>
            <Hero img="home" title={<><span>Designing Spaces You&apos;ll Love</span><br /><span className="text-2xl">Bringing harmony and elegance to your home interiors.

            </span></>} btn="Contact us" />
            <div className="max-w-5xl mx-auto p-8">
                <h2 className="text-2xl font-semibold text-center mb-6">Get in Touch</h2>

                <div className="grid md:grid-cols-2 gap-10">
                    {/* Contact Info */}
                    <div>
                        <div className="mb-6">
                            <h3 className="font-semibold">Numbers</h3>
                            <p>General Inquiries: (123) 456 7890</p>
                            <p>Accounts Inquiries: (987) 654 3210</p>
                        </div>
                        <div className="mb-6">
                            <h3 className="font-semibold">Email</h3>
                            <p>info@example.com</p>
                            <p>support@example.com</p>
                        </div>
                        <div className="mb-6">
                            <h3 className="font-semibold">Business Hours</h3>
                            <p>Sunday — Thursday: 9am - 5pm</p>
                            <p>Saturday: 10am - 3pm</p>
                            <p>Friday: Closed</p>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white p-6 shadow-md rounded-lg">
                        <h2 className="text-xl font-semibold mb-4">Send Us a Message</h2>
                        <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg mx-auto text-left">
                            <div className="mb-6">
                                <label className="block text-gray-800 text-lg mb-2">Your Name *</label>
                                <input
                                    type="text"
                                    {...register("name")}
                                    className="w-full p-4 text-lg border bg-white border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C19A6B]"
                                    placeholder="Enter your full name"
                                />
                                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-800 text-lg mb-2">Your Email *</label>
                                <input
                                    type="email"
                                    {...register("email")}
                                    className="w-full p-4 text-lg border bg-white border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C19A6B]"
                                    placeholder="Enter your email address"
                                />
                                {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-800 text-lg mb-2">Subject *</label>
                                <input
                                    type="text"
                                    {...register("subject")}
                                    className="w-full p-4 text-lg border bg-white border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C19A6B]"
                                    placeholder="Enter the message subject"
                                />
                                {errors.subject && <p className="text-red-500 text-sm">{errors.subject.message}</p>}
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-800 text-lg mb-2">Your Message *</label>
                                <textarea
                                    {...register("message")}
                                    rows="6"
                                    className="w-full p-4 text-lg border bg-white border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C19A6B]"
                                    placeholder="Write your message here"
                                ></textarea>
                                {errors.message && <p className="text-red-500 text-sm">{errors.message.message}</p>}
                            </div>
                            <button type="submit" className="bg-[#C19A6B] hover:bg-[#C19A6B] text-white text-lg font-medium py-4 px-8 rounded-full transition-all">
                                Send Message
                            </button>
                        </form>
                    </div>
                </div>


                {/* Address & Map */}
                <div className="mt-10 text-center">
                    <p>2880 Broadway, Aswan, AE 10025, EGP</p>
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1950.3697628094515!2d32.85532436426259!3d23.99811618391584!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1436893d605764c3%3A0xac9c8ab7cf39677a!2z2YXYudmH2K8g2KrZg9mG2YjZhNmI2KzZitinINin2YTZhdi52YTZiNmF2KfYqiAtINij2LPZiNin2YY!5e1!3m2!1sar!2seg!4v1738266448617!5m2!1sar!2seg"
                        width="100%"
                        height="400"
                        style={{ border: 0 }}
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                    ></iframe>
                    {/* Locations */}
                    <div className="mt-6 text-center">
                        <h3 className="text-lg font-semibold">Our Locations</h3>
                        <div className="grid grid-cols-3 gap-4 mt-2 text-gray-700 text-sm md:grid-cols-3 sm:grid-cols-1">
                            <p>Held</p>
                            <p>Nurley</p>
                            <p>Belleville</p>
                        </div>
                    </div>

                </div>
            </div>
        </>

    );
}
