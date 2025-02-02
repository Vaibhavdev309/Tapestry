import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import { IoChatbubbleEllipsesSharp, IoClose } from "react-icons/io5";
import io from "socket.io-client";

const ENDPOINT = "http://localhost:4000";
let socket;

const UserChat = () => {
  const { backendUrl, token } = useContext(ShopContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatId, setChatId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const messagesEndRef = useRef(null);

  // Socket initialization
  useEffect(() => {
    socket = io(ENDPOINT);
    return () => {
      socket.disconnect();
    };
  }, []);

  // Socket setup when user is available
  useEffect(() => {
    if (userId) {
      socket.emit("setup", { _id: userId });
      socket.on("connected", () => console.log("Socket connected"));
    }
  }, [userId]);

  // Message reception handler
  useEffect(() => {
    socket.on("message received", (newMessage) => {
      if (!chatId || newMessage.chatId !== chatId) return;
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => socket.off("message received");
  }, [chatId]);

  // Typing indicators
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

  // Fetch initial chat data
  useEffect(() => {
    const fetchChat = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/chat/accessChat`, {
          headers: { token },
        });

        if (response.data.success) {
          setChatId(response.data.chat._id);
          setUserId(response.data.chat.userId._id);
        }
      } catch (error) {
        console.error("Chat fetch error:", error);
      }
    };

    if (isOpen) fetchChat();
  }, [isOpen, backendUrl, token]);

  // Fetch messages when chat is selected
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(
          `${backendUrl}/api/message/${chatId}`,
          { headers: { token } }
        );

        if (response.data.success) {
          setMessages(response.data.messages);
          socket.emit("join chat", chatId);
        }
      } catch (error) {
        console.error("Message fetch error:", error);
      }
    };

    if (chatId) fetchMessages();
  }, [chatId, backendUrl, token]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  // Message sending handler
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
        socket.emit("stop typing", chatId);
        socket.emit("new Message", response.data);
      }
    } catch (error) {
      console.error("Message send error:", error);
    }
  };

  // Typing detection handler
  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socket) return;

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

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end z-50">
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 text-white p-4 rounded-full shadow-xl hover:bg-blue-700 transition-all duration-300 hover:scale-110 hover:shadow-2xl relative"
      >
        <IoChatbubbleEllipsesSharp size={24} />
        {messages.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
            {messages.length}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 w-80 bg-white shadow-2xl border border-gray-200 rounded-xl flex flex-col"
          style={{
            maxHeight: "calc(100vh - 160px)",
            height: "70vh",
            bottom: "6rem",
            right: "1.5rem",
            maxWidth: "95vw",
            // Mobile styles
            "@media (max-width: 640px)": {
              width: "100vw",
              right: 0,
              bottom: 0,
              borderRadius: 0,
              maxHeight: "100vh",
              height: "calc(100vh - 80px)",
            },
          }}
        >
          {/* Header */}
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

          {/* Messages Container */}
          <div
            className="flex-1 overflow-y-auto p-4 bg-gray-50"
            style={{ minHeight: "200px" }}
          >
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

          {/* Input Area */}
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
