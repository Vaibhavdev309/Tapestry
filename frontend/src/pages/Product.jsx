import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import RelatedProduct from "../components/RelatedProduct";
import ProductRating from "../components/ProductRating";
import ReviewDisplay from "../components/ReviewDisplay";
import ReviewForm from "../components/ReviewForm";

const Product = () => {
  const { productId } = useParams();
  const [productData, setProductData] = useState(false);
  const { products, addToCart } = useContext(ShopContext);
  const [image, setImage] = useState("");
  const [size, setSize] = useState("");
  const [activeTab, setActiveTab] = useState("description");
  const [reviewsRefreshed, setReviewsRefreshed] = useState(0);

  const fetchProductData = async () => {
    products.map((item) => {
      if (item._id === productId) {
        setProductData(item);
        setImage(item.image[0]);
        return null;
      }
    });
  };

  useEffect(() => {
    fetchProductData();
  }, [productId, products]);

  return productData ? (
    <div className="border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100">
      <div className="flex gap-2 sm:gap-12 flex-col sm:flex-row">
        <div className="flex-1 flex flex-col-reverse gap-3 sm:flex-row">
          <div className="flex flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full">
            {productData.image.map((item, index) => (
              <img
                onClick={() => setImage(item)}
                src={item}
                alt=""
                key={index}
                className="w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer"
              />
            ))}
          </div>
          <div className="w-full sm:w-[80%] ">
            <img className="w-full" src={image} alt="" />
          </div>
        </div>
        <div className="flex-1">
          <h1 className="font-medium text-2xl mt-2">{productData.name}</h1>
          <div className="mt-2">
            <ProductRating 
              rating={productData.reviews?.averageRating || 0} 
              reviewCount={productData.reviews?.totalReviews || 0}
              size="md"
            />
          </div>
          <p className="mt-5 text-3xl font-medium">{productData.description}</p>
          <div className="flex flex-col gap-4 my-8">
            <p>Select Size</p>
            <div className="flex gap-2">
              {productData.sizes.map((item, index) => (
                <button
                  onClick={() => setSize(item)}
                  className={`border py-2 px-4 bg-gray-100 ${
                    item === size ? "border-orange-500" : ""
                  }`}
                  key={index}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => addToCart(productData._id, size)}
            className="bg-black text-white px-8 py-3 active:bg-gray-700"
          >
            ADD TO CART
          </button>
          <hr className="mt-8 sm:w-4/5" />
          <div className="text-sm text-gray-500 mt-5 flex flex-col gap-1">
            <p>100% Pure Silk Made Product</p>
            <p>Cash on delivery is available on this product.</p>
            <p>Easy return and exchange policy withing 7 days.</p>
          </div>
        </div>
      </div>
      <div className="mt-20">
        <div className="flex">
          <button
            onClick={() => setActiveTab("description")}
            className={`border px-5 py-3 text-sm ${
              activeTab === "description" 
                ? "bg-gray-100 font-semibold" 
                : "hover:bg-gray-50"
            }`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`border px-5 py-3 text-sm ${
              activeTab === "reviews" 
                ? "bg-gray-100 font-semibold" 
                : "hover:bg-gray-50"
            }`}
          >
            Reviews ({productData.reviews?.totalReviews || 0})
          </button>
        </div>
        
        <div className="border px-6 py-5">
          {activeTab === "description" ? (
            <div className="flex flex-col gap-4 text-sm text-gray-500">
              <p>{productData.description}</p>
              <div className="mt-4">
                <h4 className="font-semibold text-gray-700 mb-2">Product Details:</h4>
                <ul className="space-y-1">
                  <li>• 100% Pure Silk Made Product</li>
                  <li>• Cash on delivery is available on this product</li>
                  <li>• Easy return and exchange policy within 7 days</li>
                  <li>• Premium quality materials</li>
                  <li>• Handcrafted with attention to detail</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <ReviewDisplay 
                productId={productId} 
                key={reviewsRefreshed}
              />
              <ReviewForm 
                productId={productId}
                productName={productData.name}
                onReviewSubmitted={() => setReviewsRefreshed(prev => prev + 1)}
              />
            </div>
          )}
        </div>
      </div>
      <RelatedProduct
        category={productData.category}
        subCategory={productData.subCategory}
      />
    </div>
  ) : (
    <div className="opacity-0"></div>
  );
};

export default Product;
