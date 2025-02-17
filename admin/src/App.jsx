import React, { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Add from "./pages/add";
import List from "./pages/list";
import Orders from "./pages/orders";
import Login from "./components/Login";
import { ToastContainer } from "react-toastify";
import Chat from "./pages/Chat";
import Request from "./pages/Request";

export const backendUrl = import.meta.env.VITE_BACKEND_URL;
export const currency = "$";

const App = () => {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    localStorage.setItem("token", token);
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [token]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <ToastContainer position="top-center" autoClose={3000} />

      {!token ? (
        <Login setToken={setToken} />
      ) : (
        <>
          <Navbar
            setToken={setToken}
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            isMobile={isMobile}
          />

          <div className="flex flex-1 overflow-hidden">
            {/* Responsive Sidebar */}
            <aside
              className={`transform top-0 left-0 w-64 bg-white fixed lg:relative h-full border-r-2 z-30 transition-all duration-300
              ${
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
              } lg:translate-x-0`}
            >
              <Sidebar
                isMobile={isMobile}
                closeSidebar={() => setIsSidebarOpen(false)}
              />
            </aside>

            {/* Main Content Area */}
            <main
              className={`flex-1 overflow-y-auto transition-margin duration-300
              ${isSidebarOpen ? "ml-0" : "ml-0"}`}
            >
              <div className="p-4 lg:p-6">
                <Routes>
                  <Route path="/add" element={<Add token={token} />} />
                  <Route path="/list" element={<List token={token} />} />
                  <Route path="/orders" element={<Orders token={token} />} />
                  <Route
                    path="/chats"
                    element={<Chat token={token} isAdmin={true} />}
                  />
                  <Route path="/request" element={<Request token={token} />} />
                </Routes>
              </div>
            </main>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
