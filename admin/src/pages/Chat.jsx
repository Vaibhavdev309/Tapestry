import React, { useState, useEffect } from "react";
import axios from "axios";
import { backendUrl } from "../App";

const Chat = ({ token }) => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/chat/fetchchats", {
        headers: { token },
      });
      console.log(response.data);
      if (response.data.success) {
        setChats(response.data.chats);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  const handleChatClick = (chat) => {
    setSelectedChat(chat);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(
        backendUrl + `/api/chat/searchuser?search=${searchQuery}`,
        {
          headers: { token },
        }
      );
      console.log(response.data);
      if (response.data.success) {
        setSearchResults(response.data.users);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    }
  };

  const startNewChat = async (userId) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/chat/accesschat",
        { userId },
        {
          headers: { token },
        }
      );
      if (response.data.success) {
        setSelectedChat(response.data.chat);
        fetchChats(); // Refresh the chat list
      }
    } catch (error) {
      console.error("Error starting new chat:", error);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left Sidebar */}
      <div className="w-1/3 border-r border-gray-300 p-4">
        <h3 className="text-lg font-semibold mb-4">Chats</h3>
        <form onSubmit={handleSearch} className="mb-4">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mb-2"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Search
          </button>
        </form>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-600 mb-2">Search Results:</h4>
            {searchResults.map((user) => (
              <div
                key={user._id}
                onClick={() => startNewChat(user._id)}
                className="p-2 border-b border-gray-200 cursor-pointer hover:bg-gray-100"
              >
                {user.name} - {user.email}
              </div>
            ))}
          </div>
        )}

        {/* Chats List */}
        {chats.length > 0 ? (
          chats.map((chat) => (
            <div
              key={chat._id}
              onClick={() => handleChatClick(chat)}
              className={`p-2 border-b border-gray-200 cursor-pointer ${
                selectedChat?._id === chat._id ? "bg-gray-100" : ""
              } hover:bg-gray-50`}
            >
              {chat.userId?.name || "Unknown"} - {chat.userId?.email || ""}
            </div>
          ))
        ) : (
          <p className="text-gray-500 mt-4">No chats available.</p>
        )}
      </div>

      {/* Right Chat Section */}
      <div className="flex-1 p-4">
        {selectedChat ? (
          <div>
            <h3 className="text-xl font-semibold mb-4">
              Chat with {selectedChat.userId?.name || "Unknown"}
            </h3>
            <div className="border border-gray-300 p-4 h-[70vh] overflow-y-auto rounded">
              {/* Render chat messages here */}
              <p>Chat messages will be displayed here.</p>
            </div>
            <input
              type="text"
              placeholder="Type a message..."
              className="w-full p-2 border border-gray-300 rounded mt-4"
            />
          </div>
        ) : (
          <h3 className="text-lg font-medium text-gray-500">
            Select a chat to start messaging
          </h3>
        )}
      </div>
    </div>
  );
};

export default Chat;
