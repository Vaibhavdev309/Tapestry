import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import io from "socket.io-client";

const ENDPOINT = "http://localhost:4000";
const socket = io(ENDPOINT);

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
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.emit("setup", { _id: "admin" });
    socket.on("connect", () => console.log("Admin socket connected"));
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    socket.on("message received", (newMessageReceived) => {
      if (selectedChat && selectedChat._id === newMessageReceived.chatId) {
        setMessages((prev) => [...prev, newMessageReceived]);
      } else {
        fetchUnreadCount(newMessageReceived.chatId);
      }
    });
    return () => socket.off("message received");
  }, [selectedChat]);

  useEffect(() => {
    socket.on("unread update", (data) => {
      if (!selectedChat || selectedChat._id !== data.chatId) {
        fetchUnreadCount(data.chatId);
      }
    });
    return () => socket.off("unread update");
  }, [selectedChat]);

  useEffect(() => {
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
    return () => {
      socket.off("typing");
      socket.off("stop typing");
    };
  }, []);

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
        headers: { token },
      });
      if (response.data.success) {
        setChats(response.data.chats);
        const counts = {};
        for (const chat of response.data.chats) {
          const unreadResponse = await axios.get(
            `${backendUrl}/api/message/unread/${chat._id}`,
            { headers: { token } }
          );
          counts[chat._id] = unreadResponse.data.count;
        }
        setUnreadCounts(counts);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const response = await axios.get(`${backendUrl}/api/message/${chatId}`, {
        headers: { token },
      });
      if (response.data.success) {
        setMessages(response.data.messages);
        socket.emit("join chat", chatId);
        await axios.post(
          `${backendUrl}/api/message/mark-read`,
          { chatId },
          { headers: { token } }
        );
        setUnreadCounts((prev) => ({ ...prev, [chatId]: 0 })); // Reset unread count for this chat
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const fetchUnreadCount = async (chatId) => {
    if (selectedChat && selectedChat._id === chatId) return; // Skip if chat is selected
    try {
      const response = await axios.get(
        `${backendUrl}/api/message/unread/${chatId}`,
        { headers: { token } }
      );
      setUnreadCounts((prev) => ({
        ...prev,
        [chatId]: response.data.count,
      }));
    } catch (error) {
      console.error("Error fetching unread count:", error);
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
        { headers: { token } }
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
        fetchChats();
      }
    } catch (error) {
      console.error("Error starting new chat:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const response = await axios.post(
        backendUrl + "/api/message/send",
        {
          chatId: selectedChat._id,
          content: newMessage,
          isAdmin: true,
        },
        { headers: { token } }
      );
      if (response.data.success) {
        setMessages((prev) => [...prev, response.data.message]);
        setNewMessage("");
        socket.emit("new Message", response.data);
        scrollToBottom();
      }
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
              {chat.userId?.name || "Unknown"} - {chat.userId?.email || ""}
              {unreadCounts[chat._id] > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {unreadCounts[chat._id]}
                </span>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500 mt-4">No chats available.</p>
        )}
      </div>

      <div className="flex-1 p-4 flex flex-col">
        {selectedChat ? (
          <div className="flex flex-col h-full">
            <h3 className="text-xl font-semibold mb-4">
              Chat with {selectedChat.userId?.name || "Unknown"}
            </h3>
            <div className="flex-1 overflow-y-auto p-4 bg-gray-100 rounded-lg">
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`flex ${
                      msg.sender === "admin" ? "justify-end" : "justify-start"
                    } mb-2`}
                  >
                    <span
                      className={`px-4 py-2 rounded-lg max-w-xs ${
                        msg.sender === "admin"
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
            {isTyping && (
              <span className="text-xs opacity-75">User is typing...</span>
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
