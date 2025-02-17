import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import ProductItem from "../components/ProductItem";

const RelatedProduct = ({ category, subCategory }) => {
  const { products } = useContext(ShopContext);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    if (products.length > 0) {
      let pCopy = products.slice();
      pCopy = pCopy.filter((item) => category === item.category);
      pCopy = pCopy.filter((item) => subCategory === item.subCategory);
      setRelated(pCopy.slice(0, 5));
    }
  }, [products, category, subCategory]);

  return (
    <div className="bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center mb-12">
          <Title text1="RELATED" text2="PRODUCTS" />
          <p className="mt-2 text-lg text-gray-600">
            Explore other products in this category
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {related.map((item, index) => (
            <ProductItem
              key={index}
              id={item._id}
              name={item.name}
              image={item.image}
              className="transform transition-all hover:scale-105 hover:shadow-lg"
            />
          ))}
        </div>

        {/* Fallback if no related products */}
        {related.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p>No related products found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RelatedProduct;
