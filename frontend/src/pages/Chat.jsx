import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import { IoChatbubbleEllipsesSharp, IoClose } from "react-icons/io5";
import io from "socket.io-client";

const ENDPOINT = "http://localhost:4000";
const socket = io(ENDPOINT);

const UserChat = () => {
  const { backendUrl, token } = useContext(ShopContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatId, setChatId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.on("connect", () => console.log("User socket connected"));
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (userId) {
      socket.emit("setup", { _id: userId });
      console.log("Socket setup for user:", userId);
    }
  }, [userId]);

  useEffect(() => {
    socket.on("message received", (newMessage) => {
      if (chatId && newMessage.chatId === chatId) {
        setMessages((prev) => [...prev, newMessage]);
        if (!isOpen) {
          fetchUnreadCount();
        }
      }
    });
    return () => socket.off("message received");
  }, [chatId, isOpen]);

  useEffect(() => {
    socket.on("unread update", (data) => {
      if (data.chatId === chatId && !isOpen) {
        fetchUnreadCount();
      }
    });
    return () => socket.off("unread update");
  }, [chatId, isOpen]);

  useEffect(() => {
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
    return () => {
      socket.off("typing");
      socket.off("stop typing");
    };
  }, []);

  useEffect(() => {
    const fetchChat = async () => {
      if (!token) return;
      try {
        const response = await axios.post(
          `${backendUrl}/api/chat/accesschat`,
          {},
          { headers: { token } }
        );
        if (response.data.success) {
          const fetchedChatId = response.data.chat._id;
          const fetchedUserId = response.data.chat.userId._id;
          setChatId(fetchedChatId);
          setUserId(fetchedUserId);
          fetchMessages(fetchedChatId);
        }
      } catch (error) {
        console.error("Chat fetch error:", error.message);
      }
    };
    fetchChat();
  }, [backendUrl, token]);

  const fetchMessages = async (chatIdParam) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/message/${chatIdParam}`,
        { headers: { token } }
      );
      if (response.data.success) {
        setMessages(response.data.messages);
        socket.emit("join chat", chatIdParam);
        if (isOpen) {
          await axios.post(
            `${backendUrl}/api/message/mark-read`,
            { chatId: chatIdParam },
            { headers: { token } }
          );
          setUnreadCount(0); // Reset unread count when chat is open
        }
      }
    } catch (error) {
      console.error("Message fetch error:", error.message);
    }
  };

  const fetchUnreadCount = async (chatIdParam = chatId) => {
    if (!chatIdParam || isOpen) return; // Skip if chat is open
    try {
      const response = await axios.get(
        `${backendUrl}/api/message/unread/${chatIdParam}`,
        { headers: { token } }
      );
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error("Error fetching unread count:", error.message);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatId) return;
    try {
      const response = await axios.post(
        `${backendUrl}/api/message/send`,
        { chatId, content: newMessage, isAdmin: false },
        { headers: { token } }
      );
      if (response.data.success) {
        setMessages((prev) => [...prev, response.data.message]);
        setNewMessage("");
        socket.emit("new Message", response.data);
        socket.emit("stop typing", chatId);
      }
    } catch (error) {
      console.error("Message send error:", error.message);
    }
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);
    if (!socket || !chatId) return;

    if (!typingTimeout) {
      socket.emit("typing", chatId);
    }

    if (typingTimeout) clearTimeout(typingTimeout);

    setTypingTimeout(
      setTimeout(() => {
        socket.emit("stop typing", chatId);
        setTypingTimeout(null);
      }, 2000)
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end z-50">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && chatId) {
            fetchMessages(chatId); // Fetch messages and reset unread count when opening
          }
        }}
        className="bg-blue-600 text-white p-4 rounded-full shadow-xl hover:bg-blue-700 transition-all duration-300 hover:scale-110 hover:shadow-2xl relative"
      >
        <IoChatbubbleEllipsesSharp size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="fixed bottom-24 right-6 w-80 bg-white shadow-2xl border border-gray-200 rounded-xl flex flex-col"
          style={{
            maxHeight: "calc(100vh - 160px)",
            height: "70vh",
            bottom: "6rem",
            right: "1.5rem",
            maxWidth: "95vw",
          }}
        >
          <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center rounded-t-xl">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Support Chat</span>
              {isTyping && (
                <span className="text-xs opacity-75">Admin is typing...</span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-700 p-1 rounded-full transition-colors"
            >
              <IoClose size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            <div className="space-y-3">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.sender === "admin" ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl p-3 ${
                      msg.sender === "admin"
                        ? "bg-white text-gray-800 shadow-md"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    <p className="text-sm break-words">{msg.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="h-full flex items-center justify-center">
                  <p className="text-gray-500 text-sm text-center">
                    Start a conversation with our support team
                  </p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type your message..."
                value={newMessage}
                onChange={typingHandler}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserChat;
