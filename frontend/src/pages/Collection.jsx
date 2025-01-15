import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets.js";
import Title from "../components/Title";
import ProductItem from "../components/ProductItem.jsx";

const sizeOrder = ["1X1", "1X2", "1X3", "3X1", "2X1", "3X3", "6X6"];
const typeOrder = ["Buddha", "Ganesha", "Lakshmi", "Radha", "Radha Krishna", "Hunting", "Holi"];

const Collection = () => {
  const { products, search, showSearch } = useContext(ShopContext);
  const [showFilter, setShowFilter] = useState(false);
  const [filterProducts, setFilterProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [sortType, setSortType] = useState("Size");

  const toggleCategory = (e) => {
    if (category.includes(e.target.value)) {
      setCategory((prev) => prev.filter((item) => item !== e.target.value));
    } else {
      setCategory((prev) => [...prev, e.target.value]);
    }
  };

  const toggleSubCategory = (e) => {
    if (subCategory.includes(e.target.value)) {
      setSubCategory((prev) => prev.filter((item) => item !== e.target.value));
    } else {
      setSubCategory((prev) => [...prev, e.target.value]);
    }
  };

  const applyFilter = () => {
    let filteredProducts = products.slice();
    if(showSearch && search){
      filteredProducts = filteredProducts.filter(item => item.name. toLowerCase(). includes(search.toLowerCase()))
    }
    if (category.length > 0) {
      filteredProducts = filteredProducts.filter((item) =>
        category.includes(item.category)
      );
    }

    if (subCategory.length > 0) {
      filteredProducts = filteredProducts.filter((item) =>
        subCategory.includes(item.subCategory)
      );
    }
    setFilterProducts(filteredProducts);
  };

  useEffect(() => {
    applyFilter();
  }, [category, subCategory, search, showSearch]);

  const groupAndSortProducts = () => {
    let groupedProducts = {};

    if (sortType === "Size") {
      sizeOrder.forEach((size) => {
        groupedProducts[size] = filterProducts.filter((product) => product.subCategory === size);
      });
    } else if (sortType === "Type") {
      typeOrder.forEach((type) => {
        groupedProducts[type] = filterProducts.filter((product) => product.category === type);
      });
    }

    return groupedProducts;
  };

  useEffect(() => {
    setFilterProducts(products);
  }, [products]);

  const sortedProducts = groupAndSortProducts();

  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t">
      <div className="min-w-60">
        <p
          onClick={() => {
            setShowFilter(!showFilter);
          }}
          className="my-2 text-xl flex items-center cursor-pointer gap-2"
        >
          FILTERS
        </p>
        <img
          className={`h-3 sm:hidden ${showFilter ? "rotate-90" : ""}`}
          src={assets.dropdown_icon}
          alt=""
        />
        <div
          className={`border border-gray-300 pl-5 py-3 mt-6 ${
            showFilter ? "" : "hidden"
          } sm:block`}
        >
          <p className="mb-3 text-sm font-medium">CATEGORIES</p>
          <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
            {typeOrder.map((type) => (
              <p key={type} className="flex gap-2">
                <input
                  className="w-3"
                  type="checkbox"
                  value={type}
                  onChange={toggleCategory}
                />
                {type}
              </p>
            ))}
          </div>
        </div>
        <div
          className={`border border-gray-300 pl-5 py-3 mt-6 ${
            showFilter ? "" : "hidden"
          } sm:block`}
        >
          <p className="mb-3 text-sm font-medium">Size</p>
          <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
            {sizeOrder.map((size) => (
              <p key={size} className="flex gap-2">
                <input
                  className="w-3"
                  type="checkbox"
                  value={size}
                  onChange={toggleSubCategory}
                />
                {size}
              </p>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1">
        <div className="flex justify-between text-base sm:text-2xl mb-4">
          <Title text1={"All"} text2={"Collections"} />
          <select
            onChange={(e) => {
              setSortType(e.target.value);
            }}
            className="border-2 border-gray-300 text-sm px-2"
          >
            <option value="Size">Sort By: Size</option>
            <option value="Type">Sort By: Type</option>
          </select>
        </div>
        <div>
          {Object.keys(sortedProducts).map((key) => (
            <div key={key}>
              <h3 className="text-lg font-bold mb-2">{key}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedProducts[key].map((product) => (
                  <ProductItem
                    key={product._id}
                    name={product.name}
                    id={product._id}
                    image={product.image}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Collection;
