

function Contact() {
    return (
        <section id="contact" className="py-20 px-10 md:px-24 bg-[#dddddd] text-center">
            <h2 className="text-3xl md:text-4xl font-playfair text-gray-800 mb-6">
                Get in Touch
            </h2>
            <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
                Ready to transform your space? Send us a message, and we&apos;ll get back to you
                shortly.
            </p>
            <form
                action="contact.php"
                method="post"
                id="contactForm"
                className="max-w-lg mx-auto text-left"
            >
                <div className="mb-6">
                    <label htmlFor="name" className="block text-gray-800 text-lg mb-2">
                        Your Name *
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        required=""
                        placeholder="Enter your full name"
                        className="w-full p-4 text-lg border bg-white border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C19A6B]"
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="email" className="block text-gray-800 text-lg mb-2">
                        Your Email *
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        required=""
                        placeholder="Enter your email address"
                        className="w-full p-4 text-lg border bg-white border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C19A6B]"
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="subject" className="block text-gray-800 text-lg mb-2">
                        Subject *
                    </label>
                    <input
                        type="text"
                        id="subject"
                        name="subject"
                        required=""
                        placeholder="Enter the message subject"
                        className="w-full p-4 text-lg border bg-white border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C19A6B]"
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="message" className="block text-gray-800 text-lg mb-2">
                        Your Message *
                    </label>
                    <textarea
                        id="message"
                        name="message"
                        rows={6}
                        required=""
                        placeholder="Write your message here"
                        className="w-full p-4 text-lg border bg-white border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C19A6B]"
                        defaultValue={""}
                    />
                </div>
                <button
                    type="submit"
                    className="bg-[#C19A6B] hover:bg-[#C19A6B] text-white text-lg font-medium py-4 px-8 rounded-full transition-all"
                >
                    Send Message
                </button>
            </form>
            <div id="form-messages" className="mt-6">
                <p className="text-green-600 font-bold hidden" id="success-message">
                    Message sent successfully!
                </p>
                <p className="text-red-600 font-bold hidden" id="error-message">
                    An error occurred. Please try again.
                </p>
            </div>
        </section>

    )
}

export default Contact