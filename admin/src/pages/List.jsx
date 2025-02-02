import React, { useEffect, useState } from "react";
import { backendUrl, currency } from "../App";
import axios from "axios";
import { toast } from "react-toastify";

const List = ({ token }) => {
  const [list, setList] = useState([]);

  const fetchList = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/product/list");
      response.data.success
        ? setList(response.data.message)
        : toast.error(response.data.message);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const removeProduct = async (id) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/product/remove",
        { id },
        { headers: { token } }
      );
      response.data.success
        ? (toast.success(response.data.message), await fetchList())
        : toast.error(response.data.message);
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <div className="p-4 lg:p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">All Products</h2>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-[100px_2fr_1fr_1fr_120px] items-center gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
          <span>Image</span>
          <span>Name</span>
          <span>Category</span>
          <span>Price</span>
          <span className="text-center">Actions</span>
        </div>

        {/* Product List */}
        <div className="divide-y divide-gray-200">
          {Array.isArray(list) &&
            list.map((item) => (
              <div
                key={item._id}
                className="grid grid-cols-1 md:grid-cols-[100px_2fr_1fr_1fr_120px] gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                {/* Image */}
                <div className="flex items-center">
                  <img
                    src={item.image[0]}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-md border border-gray-200"
                  />
                </div>

                {/* Product Details */}
                <div className="flex flex-col justify-center">
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="md:hidden text-sm text-gray-500 mt-1">
                    {item.category}
                  </p>
                </div>

                {/* Category (Desktop) */}
                <div className="hidden md:flex items-center">
                  <span className="text-sm text-gray-600">{item.category}</span>
                </div>

                {/* Price */}
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700">
                    {currency}
                    {item.price}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end md:justify-center gap-2">
                  <button className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                    Edit
                  </button>
                  <button
                    onClick={() => removeProduct(item._id)}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    Delete
                  </button>
                </div>

                {/* Mobile Category and Price */}
                <div className="md:hidden flex items-center justify-between border-t border-gray-200 pt-2 mt-2">
                  <span className="text-sm text-gray-600">{item.category}</span>
                  <span className="text-sm font-medium text-gray-700">
                    {currency}
                    {item.price}
                  </span>
                </div>
              </div>
            ))}
        </div>

        {/* Empty State */}
        {list.length === 0 && (
          <div className="p-6 text-center text-gray-500">No products found</div>
        )}
      </div>
    </div>
  );
};

export default List;
