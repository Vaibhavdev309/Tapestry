import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import io from "socket.io-client";

const ENDPOINT = "http://localhost:4000";
var socket, selectedChatCompare;
const Chat = ({ token, isAdmin }) => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const messagesEndRef = useRef(null); // For auto-scrolling
  const [socketConnected, setSocketConnected] = useState(false);
  const selectedChatRef = useRef(null); // To store selectedChat persistently
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [notification, setNotification] = useState([]);

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", { _id: "admin" });
    socket.on("connection", () => {
      setSocketConnected(true);
    });
  }, []);
  useEffect(() => {
    fetchChats();
  }, []);
  useEffect(() => {
    socket.on("message received", (newMessageReceived) => {
      if (
        selectedChatRef.current &&
        selectedChatRef.current._id === newMessageReceived.chatId
      ) {
        setMessages((prev) => [...prev, newMessageReceived]);
      }
    });

    return () => socket.off("message received");
  }, [selectedChat]);

  useEffect(() => {
    console.log("Selected chat changed:", selectedChat);
    if (selectedChat) {
      fetchMessages(selectedChat._id);
      selectedChatRef.current = selectedChat; // Store the selected chat
    }
  }, [selectedChat]);
  useEffect(() => {
    socket.on("typing", () => {
      setIsTyping(true);
    });
    socket.on("stop typing", () => setIsTyping(false));

    return () => {
      socket.off("typing");
      socket.off("stop typing");
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch user chats
  const fetchChats = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/chat/fetchchats", {
        headers: { token },
      });
      if (response.data.success) {
        setChats(response.data.chats);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  // Fetch messages for a selected chat
  const fetchMessages = async (chatId) => {
    try {
      const response = await axios.get(`${backendUrl}/api/message/${chatId}`, {
        headers: { token },
      });
      if (response.data.success) {
        setMessages(response.data.messages);
      }
      socket.emit("join chat", chatId);
    } catch (error) {
      console.error("Error fetching messages:", error);
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
        { headers: { token } }
      );
      if (response.data.success) {
        setSelectedChat(response.data.chat);
        fetchChats(); // Refresh chat list
      }
    } catch (error) {
      console.error("Error starting new chat:", error);
    }
  };

  // Send message function
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await axios.post(
        backendUrl + "/api/message/send",
        {
          chatId: selectedChat._id,
          content: newMessage,
          isAdmin: true, // Pass isAdmin flag to backend
        },
        { headers: { token } }
      );

      if (response.data.success) {
        setMessages([...messages, response.data.message]); // Update UI with new message
        setNewMessage("");
        scrollToBottom();
      }
      console.log(response.data);
      socket.emit("new Message", response.data);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socket) return;

    if (!typingTimeout) {
      socket.emit("typing", selectedChat._id);
    }

    if (typingTimeout) clearTimeout(typingTimeout);

    setTypingTimeout(
      setTimeout(() => {
        socket.emit("stop typing", selectedChat._id);
        setTypingTimeout(null);
      }, 2000)
    );
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
      <div className="flex-1 p-4 flex flex-col">
        {selectedChat ? (
          <div className="flex flex-col h-full">
            <h3 className="text-xl font-semibold mb-4">
              Chat with {selectedChat.userId?.name || "Unknown"}
            </h3>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-100 rounded-lg">
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`flex ${
                      msg.sender === (isAdmin ? "admin" : "user")
                        ? "justify-end"
                        : "justify-start"
                    } mb-2`}
                  >
                    <span
                      className={`px-4 py-2 rounded-lg max-w-xs ${
                        msg.sender === (isAdmin ? "admin" : "user")
                          ? "bg-blue-500 text-white"
                          : "bg-gray-300 text-black"
                      }`}
                    >
                      {msg.content}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center">No messages yet.</p>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            {isTyping && (
              <span className="text-xs opacity-75">Admin is typing...</span>
            )}
            <div className="mt-4 flex">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={typingHandler}
                className="flex-1 p-2 border border-gray-300 rounded"
              />
              <button
                onClick={sendMessage}
                className="ml-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <h3 className="text-lg font-medium text-gray-500 text-center">
            Select a chat to start messaging
          </h3>
        )}
      </div>
    </div>
  );
};

export default Chat;
