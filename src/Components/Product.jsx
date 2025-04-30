
import ProductCard from "../Cards/productCard"
function Product() {
    return (
        <>
            <section className="py-20 px-8 md:px-12 lg:px-24 text-center" id="projects">
                <h2 className="text-3xl md:text-4xl font-playfair text-gray-800 mb-10">
                    Our Projects
                </h2>
                <div className="flex flex-wrap justify-center gap-8">
                    <ProductCard img="/LR1.png"/>
                    <ProductCard img="/Bedroom.jpg"/>
                    <ProductCard img="/Kitchen.jpg"/>
                </div>
            </section>
        </>
    )
}

export default Product