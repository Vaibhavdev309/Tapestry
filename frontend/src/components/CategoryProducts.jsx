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

  // States for magnifier effect
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);

  // Filter products based on category and subCategory.
  const filteredProducts = products.filter(
    (product) =>
      product.category === category && product.subCategory === subCategory
  );

  // Set the selected product based on the URL or default to the first product.
  useEffect(() => {
    if (productId) {
      const product = filteredProducts.find((p) => p._id === productId);
      if (product) {
        setSelectedProduct(product);
        setMainImage(product.image[0]); // Set default main image.
      } else {
        navigateToBase();
      }
    } else if (filteredProducts.length > 0) {
      navigate(
        `/collection/${category}/${subCategory}/${filteredProducts[0]._id}`
      );
    }
  }, [productId, filteredProducts, category, subCategory]);

  // If productId is invalid, navigate back to the base route.
  const navigateToBase = () => {
    navigate(`/collection/${category}/${subCategory}`);
  };

  // When switching variant, update URL and reset selected size.
  const handleVariantSelect = (productId) => {
    navigate(`/collection/${category}/${subCategory}/${productId}`);
    setSelectedSize("");
  };

  // Handler for mouse movement over the image container (for magnifier effect)
  const handleMouseMove = (e) => {
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
      {/* Page Title */}
      <h1 className="text-3xl font-bold mb-8 text-center md:text-left">
        {category}{" "}
        <span className="text-lg font-normal text-gray-600">
          ({subCategory})
        </span>
      </h1>

      {/* Mobile Variants (Horizontal Scroll) */}
      <div className="block md:hidden mb-6">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Variants</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              onClick={() => handleVariantSelect(product._id)}
              className={`cursor-pointer p-4 border rounded-lg transition-all hover:shadow-md flex-shrink-0 ${
                selectedProduct._id === product._id
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              style={{ width: "150px" }}
            >
              <ProductItem {...product} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Desktop Variants Sidebar */}
        <aside className="hidden md:block md:w-1/4 flex-shrink-0">
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

        {/* Selected Product Details */}
        <section className="flex-1">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Product Images */}
            <div className="md:w-1/2 flex-shrink-0">
              <div
                className="sticky top-4"
                style={{ width: "100%", maxWidth: "500px", height: "500px" }}
              >
                {/* Main Image Container with Magnifier */}
                <div
                  className="relative w-full h-full"
                  onMouseEnter={() => setShowMagnifier(true)}
                  onMouseLeave={() => setShowMagnifier(false)}
                  onMouseMove={handleMouseMove}
                  ref={imageRef}
                >
                  <img
                    src={mainImage}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover rounded-lg shadow-lg transition-all hover:scale-105"
                  />
                  {showMagnifier && imageRef.current && (
                    <div
                      className="absolute border border-gray-300 rounded-lg bg-white"
                      style={{
                        top: 0,
                        left: "105%",
                        width: "300px",
                        height: "300px",
                        backgroundImage: `url(${mainImage})`,
                        backgroundRepeat: "no-repeat",
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
                {/* Thumbnail Images */}
                <div className="flex gap-2 overflow-x-auto mt-4">
                  {selectedProduct.image.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`${selectedProduct.name} ${index + 1}`}
                      className={`w-20 h-20 object-cover cursor-pointer border rounded-lg transition-all ${
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

            {/* Product Details */}
            <div className="md:w-1/2 flex flex-col justify-between">
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
                        className={`px-5 py-2 border rounded-lg transition-colors ${
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

              {/* Add to Cart & Product Info */}
              <div className="flex flex-col space-y-6">
                <button
                  onClick={() => {
                    if (selectedSize) {
                      addToCart(selectedProduct._id, selectedSize);
                    }
                  }}
                  className={`w-full py-3 rounded-lg transition-colors ${
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

      {/* Back Link */}
      <div className="mt-10 text-center">
        <button
          onClick={() => navigate(-1)}
          className="inline-block text-orange-500 hover:text-orange-600 transition-colors"
        >
          &larr; Back to {subCategory} Collection
        </button>
      </div>
    </div>
  );
};

export default CategoryProducts;
