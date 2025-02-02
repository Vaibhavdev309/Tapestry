import React, { useState } from "react";
import { assets } from "../assets/assets";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";

const Add = ({ token }) => {
  const [image1, setImage1] = useState(false);
  const [image2, setImage2] = useState(false);
  const [image3, setImage3] = useState(false);
  const [image4, setImage4] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Ganesha");
  const [subCategory, setSubCategory] = useState("1X1");
  const [price, setPrice] = useState("");
  const [bestSeller, setBestSeller] = useState(false);
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(false);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      image1 && formData.append("image1", image1);
      image2 && formData.append("image2", image2);
      image3 && formData.append("image3", image3);
      image4 && formData.append("image4", image4);
      formData.append("name", name);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("subCategory", subCategory);
      formData.append("price", price);
      formData.append("bestSeller", bestSeller);
      formData.append("sizes", JSON.stringify(sizes));
      const response = await axios.post(
        backendUrl + "/api/product/add",
        formData,
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success("Product Added Successfully");
      } else {
        toast.error("Something went wrong");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="p-4 lg:p-6">
      <form onSubmit={onSubmitHandler} className="max-w-4xl mx-auto space-y-6">
        {/* Image Upload Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Product Images</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((num) => (
              <label
                key={num}
                htmlFor={`image${num}`}
                className="group relative aspect-square cursor-pointer border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
              >
                <img
                  className="w-full h-full object-cover rounded-lg"
                  src={
                    eval(`image${num}`)
                      ? URL.createObjectURL(eval(`image${num}`))
                      : assets.upload_area
                  }
                  alt={`Preview ${num}`}
                />
                <input
                  onChange={(e) => eval(`setImage${num}(e.target.files[0])`)}
                  type="file"
                  id={`image${num}`}
                  className="hidden"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg" />
              </label>
            ))}
          </div>
        </div>

        {/* Product Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Product Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter product name"
          />
        </div>

        {/* Product Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Product description..."
          />
        </div>

        {/* Category Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Ganesha">Ganesha</option>
              <option value="Buddha">Buddha</option>
              <option value="Holi">Holi</option>
              <option value="Radha">Radha</option>
              <option value="Radha Krishna">Radha Krishna</option>
              <option value="Hunting">Hunting</option>
              <option value="Lakshmi">Lakshmi</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Sub Category
            </label>
            <select
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1X1">1X1</option>
              <option value="1X2">1X2</option>
              <option value="1X3">1X3</option>
              <option value="2X1">2X1</option>
              <option value="3X1">3X1</option>
              <option value="3X3">3X3</option>
              <option value="6X6">6X6</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                $
              </span>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                type="number"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Sizes Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Available Sizes
          </label>
          <div className="flex flex-wrap gap-2">
            {["S", "M", "L", "XL", "XXL"].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() =>
                  setSizes((prev) =>
                    prev.includes(size)
                      ? prev.filter((s) => s !== size)
                      : [...prev, size]
                  )
                }
                className={`px-4 py-2 rounded-md transition-colors ${
                  sizes.includes(size)
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Best Seller */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="bestseller"
            checked={bestSeller}
            onChange={() => setBestSeller(!bestSeller)}
            className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500 border-gray-300"
          />
          <label htmlFor="bestseller" className="text-sm text-gray-700">
            Mark as Best Seller
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Adding...</span>
            </div>
          ) : (
            "Add Product"
          )}
        </button>
      </form>
    </div>
  );
};

export default Add;
