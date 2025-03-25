import { NavLink } from "react-router-dom";

function Footer() {
  return (
    <footer className="bg-[#2c2c2c] text-white py-[60px] px-[100px]">
      <div className="footer-container flex flex-wrap justify-between">
        {/* About Us Section */}
        <div className="footer-section about flex-1 m-[20px] min-w-[200px]">
          <h3 className="font-playfair mb-[20px] text-white">
            Harmony<span className="text-[#C19A6B]">Interiors</span>
          </h3>
          <p className="text-[16px] leading-[1.6] text-[#ccc]">
            At Harmony Interiors, we create personalized and elegant interior
            designs that transform your house into a home. Our passion is bringing
            your vision to life with our expertise.
          </p>
        </div>
        {/* Map Section */}
        <div className="footer-section map flex-1 m-[20px] min-w-[200px]">
          <h4 className="font-playfair mb-[20px] text-white">
            Our Location
          </h4>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18...(Your Google Maps Embed URL)"
            className="w-full h-[200px] border-none rounded-[5px]"
            allowFullScreen=""
            loading="lazy"
          ></iframe>
        </div>
        {/* Quick Links Section */}
        <div className="footer-section links flex-1 m-[20px] min-w-[200px]">
          <h4 className="font-playfair mb-[20px] text-white">
            Quick Links
          </h4>
          <ul className="list-none p-0">
            <li className="mb-[10px]">
              <NavLink to="/" className="text-[#ccc] no-underline hover:text-[#C19A6B] transition-colors duration-300">Home</NavLink>
            </li>
            <li className="mb-[10px]">
              <NavLink to="/about" className="text-[#ccc] no-underline hover:text-[#C19A6B] transition-colors duration-300">About</NavLink>
            </li>
            <li className="mb-[10px]">
            <NavLink to="/projects" className="text-[#ccc] no-underline hover:text-[#C19A6B] transition-colors duration-300">Projects</NavLink>
            </li>
            <li className="mb-[10px]">
              <NavLink to="/services" className="text-[#ccc] no-underline hover:text-[#C19A6B] transition-colors duration-300">Services</NavLink>
            </li>
            <li className="mb-[10px]">
              <NavLink to="/contact" className="text-[#ccc] no-underline hover:text-[#C19A6B] transition-colors duration-300">Contact</NavLink>
            </li>
          </ul>
        </div>
        {/* Social Media Section */}
        <div className="footer-section social flex-1 m-[20px] min-w-[200px]">
          <h4 className="font-playfair mb-[20px] text-white">
            Follow Us
          </h4>
          <div className="flex">
            <a
              href="https://facebook.com/yourpage"
              target="_blank"
              className="mr-[15px]"
            >
              <img
                src="src\assets\facebook.svg"
                alt="Facebook"
                className="w-[24px] h-[24px] hover:opacity-70"
              />
            </a>
            <a
              href="https://instagram.com/yourprofile"
              target="_blank"
              className="mr-[15px]"
            >
              <img
                src="src\assets\instagram.svg"
                alt="Instagram"
                className="w-[24px] h-[24px] hover:opacity-70"
              />
            </a>
            <a href="https://pinterest.com/yourprofile" target="_blank">
              <img
                src="src\assets\pinterest.svg"
                alt="Pinterest"
                className="w-[24px] h-[24px] hover:opacity-70"
              />
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bottom text-center mt-[40px] pt-[20px] border-t border-[#444]">
        <p className="text-[14px] text-[#ccc]">
          © 2023 Harmony Interiors. All rights reserved.
        </p>
      </div>
    </footer>



  );
}

export default Footer;
