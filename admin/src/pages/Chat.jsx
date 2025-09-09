import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import io from "socket.io-client";

const ENDPOINT = "http://localhost:4000";

const Chat = ({ token, isAdmin }) => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const messagesEndRef = useRef(null);

  // Initialize socket with authentication
  useEffect(() => {
    if (token) {
      const newSocket = io(ENDPOINT, {
        auth: {
          token: token
        }
      });

      newSocket.on("connect", () => {
        console.log("Admin socket connected");
        setConnectionStatus("connected");
      });

      newSocket.on("disconnect", () => {
        console.log("Admin socket disconnected");
        setConnectionStatus("disconnected");
      });

      newSocket.on("connect_error", (error) => {
        console.error("Socket connection error:", error.message);
        setConnectionStatus("error");
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [token]);

  useEffect(() => {
    if (socket) {
      socket.emit("setup", { _id: "admin" });
    }
  }, [socket]);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("message received", (newMessageReceived) => {
        if (selectedChat && selectedChat._id === newMessageReceived.chatId) {
          setMessages((prev) => [...prev, newMessageReceived]);
        } else {
          fetchUnreadCount(newMessageReceived.chatId);
        }
      });

      socket.on("unread update", (data) => {
        if (!selectedChat || selectedChat._id !== data.chatId) {
          fetchUnreadCount(data.chatId);
        }
      });

      socket.on("typing", (data) => {
        if (data.userId !== "admin") {
          setIsTyping(true);
        }
      });

      socket.on("stop typing", (data) => {
        if (data.userId !== "admin") {
          setIsTyping(false);
        }
      });

      socket.on("error", (error) => {
        console.error("Socket error:", error.message);
      });

      return () => {
        socket.off("message received");
        socket.off("unread update");
        socket.off("typing");
        socket.off("stop typing");
        socket.off("error");
      };
    }
  }, [socket, selectedChat]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat._id);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchChats = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/chat/fetchchats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setChats(response.data.chats);
        const counts = {};
        for (const chat of response.data.chats) {
          const unreadResponse = await axios.get(
            `${backendUrl}/api/message/unread/${chat._id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          counts[chat._id] = unreadResponse.data.count;
        }
        setUnreadCounts(counts);
      }
    } catch (error) {
      console.error("Error fetching chats:", error.response?.data?.message || error.message);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const response = await axios.get(`${backendUrl}/api/message/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setMessages(response.data.messages);
        if (socket) {
          socket.emit("join chat", chatId);
        }
        await axios.post(
          `${backendUrl}/api/message/mark-read`,
          { chatId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUnreadCounts((prev) => ({ ...prev, [chatId]: 0 }));
      }
    } catch (error) {
      console.error("Error fetching messages:", error.response?.data?.message || error.message);
    }
  };

  const fetchUnreadCount = async (chatId) => {
    if (selectedChat && selectedChat._id === chatId) return;
    try {
      const response = await axios.get(
        `${backendUrl}/api/message/unread/${chatId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUnreadCounts((prev) => ({
        ...prev,
        [chatId]: response.data.count,
      }));
    } catch (error) {
      console.error("Error fetching unread count:", error.response?.data?.message || error.message);
    }
  };

  const handleChatClick = (chat) => {
    setSelectedChat(chat);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await axios.get(
        backendUrl + `/api/chat/searchuser?search=${searchQuery}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setSearchResults(response.data.users);
      }
    } catch (error) {
      console.error("Error searching users:", error.response?.data?.message || error.message);
    }
  };

  const startNewChat = async (userId) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/chat/accesschat",
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setSelectedChat(response.data.chat);
        fetchChats();
        setSearchQuery("");
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error starting new chat:", error.response?.data?.message || error.message);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !socket) return;
    try {
      const response = await axios.post(
        backendUrl + "/api/message/send",
        {
          chatId: selectedChat._id,
          content: newMessage,
          isAdmin: true,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setMessages((prev) => [...prev, response.data.message]);
        setNewMessage("");
        socket.emit("new Message", response.data);
        scrollToBottom();
      }
    } catch (error) {
      console.error("Error sending message:", error.response?.data?.message || error.message);
    }
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);
    if (!socket || !selectedChat) return;

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
      <div className="w-1/3 border-r border-gray-300 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Chats</h3>
          <div className={`w-3 h-3 rounded-full ${
            connectionStatus === "connected" ? "bg-green-500" : 
            connectionStatus === "error" ? "bg-red-500" : "bg-gray-500"
          }`} title={`Connection: ${connectionStatus}`}></div>
        </div>
        
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
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={searchQuery.length < 2}
          >
            Search
          </button>
        </form>

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

        {chats.length > 0 ? (
          chats.map((chat) => (
            <div
              key={chat._id}
              onClick={() => handleChatClick(chat)}
              className={`p-2 border-b border-gray-200 cursor-pointer ${
                selectedChat?._id === chat._id ? "bg-gray-100" : ""
              } hover:bg-gray-50`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">
                    {chat.userId?.name || "Unknown"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {chat.userId?.email || ""}
                  </div>
                </div>
                {unreadCounts[chat._id] > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {unreadCounts[chat._id]}
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 mt-4">No chats available.</p>
        )}
      </div>

      <div className="flex-1 p-4 flex flex-col">
        {selectedChat ? (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">
                Chat with {selectedChat.userId?.name || "Unknown"}
              </h3>
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === "connected" ? "bg-green-500" : 
                connectionStatus === "error" ? "bg-red-500" : "bg-gray-500"
              }`} title={`Connection: ${connectionStatus}`}></div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 bg-gray-100 rounded-lg">
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`flex ${
                      msg.sender === "admin" ? "justify-end" : "justify-start"
                    } mb-2`}
                  >
                    <div
                      className={`px-4 py-2 rounded-lg max-w-xs ${
                        msg.sender === "admin"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-300 text-black"
                      }`}
                    >
                      <p className="break-words">{msg.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center">No messages yet.</p>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {isTyping && (
              <span className="text-xs opacity-75 mb-2">User is typing...</span>
            )}
            
            <div className="mt-4 flex">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={typingHandler}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 p-2 border border-gray-300 rounded"
                disabled={connectionStatus !== "connected"}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || connectionStatus !== "connected"}
                className="ml-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <h3 className="text-lg font-medium text-gray-500 text-center">
              Select a chat to start messaging
            </h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;