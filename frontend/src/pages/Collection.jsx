import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets.js";
import Title from "../components/Title";

const sizeOrder = ["1X1", "1X2", "1X3", "3X1", "2X1", "3X3", "6X6"];
const typeOrder = [
  "Buddha",
  "Ganesha",
  "Lakshmi",
  "Radha",
  "Radha Krishna",
  "Hunting",
  "Holi",
];

const Collection = () => {
  const { products, search, showSearch } = useContext(ShopContext);
  const [showFilter, setShowFilter] = useState(false);
  const [filterProducts, setFilterProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [sortType, setSortType] = useState("Type");

  const toggleCategory = (e) => {
    const value = e.target.value;
    setCategory((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const toggleSubCategory = (e) => {
    const value = e.target.value;
    setSubCategory((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const applyFilter = () => {
    let filtered = products;

    if (showSearch && search) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (category.length > 0) {
      filtered = filtered.filter((item) => category.includes(item.category));
    }

    if (subCategory.length > 0) {
      filtered = filtered.filter((item) =>
        subCategory.includes(item.subCategory)
      );
    }

    setFilterProducts(filtered);
  };

  useEffect(() => {
    applyFilter();
  }, [products, search, showSearch, category, subCategory]);

  const getGroupedData = () => {
    const rows =
      sortType === "Type"
        ? typeOrder.filter(
            (type) =>
              filterProducts.some((p) => p.category === type) &&
              (category.length === 0 || category.includes(type))
          )
        : sizeOrder.filter(
            (size) =>
              filterProducts.some((p) => p.subCategory === size) &&
              (subCategory.length === 0 || subCategory.includes(size))
          );

    const columns = sortType === "Type" ? sizeOrder : typeOrder;

    return { rows, columns };
  };

  const { rows, columns } = getGroupedData();

  return (
    <div className="flex flex-col lg:flex-row gap-4 pt-10 px-4 sm:px-6">
      {/* Filters Sidebar */}
      <div className={`lg:w-64 ${showFilter ? "block" : "hidden"} lg:block`}>
        <div className="lg:sticky lg:top-20 space-y-6">
          {/* Mobile Filter Header */}
          <div className="flex items-center justify-between lg:hidden">
            <h2 className="text-xl font-semibold">Filters</h2>
            <button
              onClick={() => setShowFilter(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              ✕
            </button>
          </div>

          {/* Category Filter */}
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-sm font-medium mb-3">Categories</h3>
            <div className="space-y-2">
              {typeOrder.map((type) => (
                <label
                  key={type}
                  className="flex items-center space-x-2 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    value={type}
                    checked={category.includes(type)}
                    onChange={toggleCategory}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Size Filter */}
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-sm font-medium mb-3">Sizes</h3>
            <div className="space-y-2">
              {sizeOrder.map((size) => (
                <label
                  key={size}
                  className="flex items-center space-x-2 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    value={size}
                    checked={subCategory.includes(size)}
                    onChange={toggleSubCategory}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{size}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <Title text1="All" text2="Collections" />
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button
              onClick={() => setShowFilter(true)}
              className="lg:hidden px-4 py-2 border rounded-lg bg-white shadow-sm flex items-center gap-2"
            >
              <img src={assets.filter_icon} className="w-4 h-4" alt="filter" />
              Filters
            </button>
            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white shadow-sm w-full sm:w-48"
            >
              <option value="Type">Sort by Type</option>
              <option value="Size">Sort by Size</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="space-y-8">
          {getGroupedData().rows.map((row) => (
            <div key={row} className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">{row}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {getGroupedData()
                  .columns.filter((col) =>
                    filterProducts.some((p) =>
                      sortType === "Type"
                        ? p.category === row && p.subCategory === col
                        : p.subCategory === row && p.category === col
                    )
                  )
                  .map((col) => {
                    const productsInCell = filterProducts.filter((p) =>
                      sortType === "Type"
                        ? p.category === row && p.subCategory === col
                        : p.subCategory === row && p.category === col
                    );
                    const firstProduct = productsInCell[0];

                    return (
                      <Link
                        key={`${row}-${col}`}
                        to={`/collection/${sortType === "Type" ? row : col}/${
                          sortType === "Type" ? col : row
                        }`}
                        className="group block overflow-hidden rounded-lg transition-transform hover:scale-[1.02]"
                      >
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          {firstProduct && (
                            <img
                              src={firstProduct.image[0]}
                              alt={firstProduct.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-sm font-medium truncate">
                            {firstProduct?.name || "Product Name"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {productsInCell.length} variants
                          </p>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Collection;
