import React, { useContext, useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import ProductItem from "../components/ProductItem";

const CategoryProducts = () => {
  const { category, subCategory, productId } = useParams();
  const navigate = useNavigate();
  const { products, addToCart } = useContext(ShopContext);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [mainImage, setMainImage] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  // Magnifier states
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Filter products
  const filteredProducts = products.filter(
    (product) =>
      product.category === category && product.subCategory === subCategory
  );

  // Set selected product
  useEffect(() => {
    if (productId) {
      const product = filteredProducts.find((p) => p._id === productId);
      if (product) {
        setSelectedProduct(product);
        setMainImage(product.image[0]);
      } else {
        navigateToBase();
      }
    } else if (filteredProducts.length > 0) {
      navigate(
        `/collection/${category}/${subCategory}/${filteredProducts[0]._id}`
      );
    }
  }, [productId, filteredProducts, category, subCategory]);

  const navigateToBase = () => {
    navigate(`/collection/${category}/${subCategory}`);
  };

  const handleVariantSelect = (productId) => {
    navigate(`/collection/${category}/${subCategory}/${productId}`);
    setSelectedSize("");
  };

  // Mouse move handler with mobile check
  const handleMouseMove = (e) => {
    if (isMobile) return;
    const { top, left } = imageRef.current.getBoundingClientRect();
    const x = e.pageX - left - window.pageXOffset;
    const y = e.pageY - top - window.pageYOffset;
    setMagnifierPosition({ x, y });
  };

  if (!selectedProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-8 text-center md:text-left">
        {category}{" "}
        <span className="text-lg font-normal text-gray-600">
          ({subCategory})
        </span>
      </h1>

      {/* Mobile Variants */}
      <div className="block lg:hidden mb-6">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Variants</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              onClick={() => handleVariantSelect(product._id)}
              className={`cursor-pointer p-2 border rounded-lg transition-all hover:shadow-md flex-shrink-0 ${
                selectedProduct._id === product._id
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              style={{ width: "120px" }}
            >
              <ProductItem {...product} compact />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Desktop Variants */}
        <aside className="hidden lg:block md:w-1/4 flex-shrink-0">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Variants</h2>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                onClick={() => handleVariantSelect(product._id)}
                className={`cursor-pointer p-4 border rounded-lg transition-all hover:shadow-md ${
                  selectedProduct._id === product._id
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <ProductItem {...product} />
              </div>
            ))}
          </div>
        </aside>

        {/* Product Details */}
        <section className="flex-1">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Images Section */}
            <div className="md:w-1/2 flex-shrink-0">
              <div
                className="md:sticky md:top-4"
                style={{ width: "100%", height: isMobile ? "300px" : "500px" }}
              >
                <div
                  className="relative w-full h-full"
                  onMouseEnter={() => !isMobile && setShowMagnifier(true)}
                  onMouseLeave={() => !isMobile && setShowMagnifier(false)}
                  onMouseMove={handleMouseMove}
                  ref={imageRef}
                >
                  <img
                    src={mainImage}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover rounded-lg shadow-lg transition-all md:hover:scale-105"
                  />
                  {!isMobile && showMagnifier && imageRef.current && (
                    <div
                      className="absolute border border-gray-300 rounded-lg bg-white hidden md:block"
                      style={{
                        top: 0,
                        left: "105%",
                        width: "400px",
                        height: "500px",
                        backgroundImage: `url(${mainImage})`,
                        backgroundSize: `${
                          imageRef.current.offsetWidth * 2
                        }px ${imageRef.current.offsetHeight * 2}px`,
                        backgroundPositionX: `${
                          -magnifierPosition.x * 2 + 150
                        }px`,
                        backgroundPositionY: `${
                          -magnifierPosition.y * 2 + 150
                        }px`,
                      }}
                    />
                  )}
                </div>
                {/* Thumbnails */}
                <div className="flex gap-2 overflow-x-auto mt-4 pb-2">
                  {selectedProduct.image.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`${selectedProduct.name} ${index + 1}`}
                      className={`w-16 h-16 md:w-20 md:h-20 object-cover cursor-pointer border rounded-lg transition-all ${
                        mainImage === img
                          ? "border-orange-500 scale-105"
                          : "border-gray-300 hover:border-orange-400"
                      }`}
                      onClick={() => setMainImage(img)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="md:w-1/2 mt-14 md:mt-0 flex flex-col justify-between">
              <div className="h-full">
                <h2 className="text-2xl font-bold mb-4">
                  {selectedProduct.name}
                </h2>
                <p className="text-gray-600 mb-6">
                  {selectedProduct.description}
                </p>

                {/* Size Selection */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-4">Select Size</h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedProduct.sizes.map((size, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 md:px-5 md:py-2 border rounded-lg transition-colors ${
                          selectedSize === size
                            ? "border-orange-500 bg-orange-50"
                            : "border-gray-300 hover:border-orange-400"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="flex flex-col space-y-6">
                <button
                  onClick={() => {
                    if (selectedSize) {
                      addToCart(selectedProduct._id, selectedSize);
                    }
                  }}
                  className={`w-full py-3 rounded-lg transition-colors text-sm md:text-base ${
                    selectedSize
                      ? "bg-black text-white hover:bg-gray-800"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {selectedSize ? "ADD TO CART" : "SELECT A SIZE"}
                </button>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>• 100% Pure Silk Made Product</p>
                  <p>• Cash on Delivery Available</p>
                  <p>• Easy 7-Day Return Policy</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Back Button */}
      <div className="mt-10 text-center">
        <button
          onClick={() => navigate(-1)}
          className="inline-block text-orange-500 hover:text-orange-600 transition-colors text-sm md:text-base"
        >
          &larr; Back to {subCategory} Collection
        </button>
      </div>
    </div>
  );
};

export default CategoryProducts;
