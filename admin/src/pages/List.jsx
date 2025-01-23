import React, { useEffect, useState } from "react";
import { backendUrl, currency } from "../App";
import axios from "axios";
import { toast } from "react-toastify";

const List = ({ token }) => {
  const [list, setList] = useState([]);
  const fetchList = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/product/list");
      console.log(response.data);
      if (response.data.success) {
        setList(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error.message);
      toast.error(error.message);
    }
  };
  const removeProduct = async (id) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/product/remove",
        {
          id,
        },
        { headers: { token } }
      );
      console.log(response.data);
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchList();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error.message);
      toast.error(error.message);
    }
  };
  useEffect(() => {
    fetchList();
  }, []);
  return (
    <>
      <p className="mb-2">All Prdduct List</p>
      <div className="flex flex-col gap-2">
        <div className="hidden md:grid grid-cols-[1fr,3fr,1fr,2fr,1fr] items-center py-1 px-2 border bg-gray-200 p-2 text-sm rounded-md">
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b className="text-center">Action</b>
        </div>
        {Array.isArray(list) &&
          list.map((item, index) => (
            <div
              key={index}
              className="flex flex-col md:grid grid-cols-[1fr,3fr,1fr,2fr,1fr] items-center py-1 px-2 border bg-white p-2 text-sm rounded-md"
            >
              <img
                src={item.image[0]}
                alt="product"
                className="w-12 h-12 object-cover rounded-md"
              />
              <p>{item.name}</p>
              <p>{item.category}</p>
              <p>
                {currency} {item.price}
              </p>
              <div className="flex gap-2">
                <button className="bg-blue-500 text-white px-2 py-1 rounded-md">
                  Edit
                </button>
                <button
                  onClick={() => removeProduct(item._id)}
                  className="bg-red-500 text-white px-2 py-1 rounded-md"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
      </div>
    </>
  );
};

export default List;
