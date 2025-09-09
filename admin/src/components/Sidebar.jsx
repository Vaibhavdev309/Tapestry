import React from "react";
import { NavLink } from "react-router-dom";
import { assets } from "../assets/assets.js";

const Sidebar = ({ closeSidebar, isMobile }) => {
  const activeStyle = "bg-blue-50 border-blue-300 font-semibold text-blue-700";
  const normalStyle = "hover:bg-gray-50 border-gray-200 text-gray-700";

  return (
    <div className="w-full h-full bg-white">
      <div className="flex flex-col gap-2 p-4">
        <NavLink
          to="/add"
          onClick={isMobile ? closeSidebar : null}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors border-l-4
            ${isActive ? activeStyle : normalStyle}`
          }
        >
          <img className="w-5 h-5" src={assets.add_icon} alt="Add Items" />
          <span className="text-sm lg:text-base">Add Items</span>
        </NavLink>

        <NavLink
          to="/list"
          onClick={isMobile ? closeSidebar : null}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors border-l-4
            ${isActive ? activeStyle : normalStyle}`
          }
        >
          <img className="w-5 h-5" src={assets.order_icon} alt="List Items" />
          <span className="text-sm lg:text-base">List Items</span>
        </NavLink>

        <NavLink
          to="/orders"
          onClick={isMobile ? closeSidebar : null}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors border-l-4
            ${isActive ? activeStyle : normalStyle}`
          }
        >
          <img className="w-5 h-5" src={assets.order_icon} alt="Orders" />
          <span className="text-sm lg:text-base">Orders</span>
        </NavLink>

        <NavLink
          to="/inventory"
          onClick={isMobile ? closeSidebar : null}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors border-l-4
            ${isActive ? activeStyle : normalStyle}`
          }
        >
          <img className="w-5 h-5" src={assets.order_icon} alt="Inventory" />
          <span className="text-sm lg:text-base">Inventory</span>
        </NavLink>

        <NavLink
          to="/chats"
          onClick={isMobile ? closeSidebar : null}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors border-l-4
            ${isActive ? activeStyle : normalStyle}`
          }
        >
          <img className="w-5 h-5" src={assets.order_icon} alt="Chats" />
          <span className="text-sm lg:text-base">Chats</span>
        </NavLink>
        <NavLink
          to="/request"
          onClick={isMobile ? closeSidebar : null}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors border-l-4
            ${isActive ? activeStyle : normalStyle}`
          }
        >
          <img className="w-5 h-5" src={assets.order_icon} alt="Chats" />
          <span className="text-sm lg:text-base">Request</span>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
