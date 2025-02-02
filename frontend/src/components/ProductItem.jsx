import React from "react";
import { Link } from "react-router-dom";

const ProductItem = ({ id, image, name }) => {
  return (
    <Link className="text-gray-700 cursor-pointer" to={`/collection/${id}`}>
      <div>
        <img
          className="object-cover object-center w-full h-60 max-w-full rounded-lg"
          src={image[0]}
          alt={name}
        />
        <p className="pt-3 pb-1 text-sm">{name}</p>
      </div>
    </Link>
  );
};

export default ProductItem;
