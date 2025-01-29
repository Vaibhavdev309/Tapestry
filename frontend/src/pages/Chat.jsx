import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import { IoChatbubbleEllipsesSharp, IoClose } from "react-icons/io5";

const UserChat = () => {
  const { backendUrl, token } = useContext(ShopContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatId, setChatId] = useState(null);
  const [isOpen, setIsOpen] = useState(false); // Controls chatbox visibility

  useEffect(() => {
    if (isOpen) fetchChat();
  }, [token, isOpen]);

  useEffect(() => {
    if (chatId) fetchMessages(chatId);
  }, [chatId]);

  const fetchChat = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/chat/accessChat`, {
        headers: { token },
      });

      if (response.data.success) {
        setChatId(response.data.chat._id);
      }
    } catch (error) {
      console.error("Error fetching chat:", error);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const response = await axios.get(`${backendUrl}/api/message/${chatId}`, {
        headers: { token },
      });

      if (response.data.success) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const response = await axios.post(
        `${backendUrl}/api/message/send`,
        { chatId, content: newMessage, isAdmin: false },
        { headers: { token } }
      );

      if (response.data.success) {
        setMessages((prev) => [...prev, response.data.message]);
        setNewMessage("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end">
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition duration-300"
      >
        <IoChatbubbleEllipsesSharp size={24} />
      </button>

      {/* Chatbox Popup */}
      {isOpen && (
        <div className="fixed bottom-16 right-6 w-80 bg-white shadow-xl border rounded-lg flex flex-col">
          {/* Header */}
          <div className="bg-blue-500 text-white p-3 flex justify-between items-center rounded-t-lg">
            <span>Chat with Admin</span>
            <button onClick={() => setIsOpen(false)}>
              <IoClose size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 h-64">
            {messages.length > 0 ? (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-2 my-2 rounded max-w-xs ${
                    msg.sender === "admin"
                      ? "bg-gray-200 self-start"
                      : "bg-blue-500 text-white self-end"
                  }`}
                >
                  {msg.content}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center">
                No messages yet.
              </p>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 flex border-t">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 p-2 border rounded-lg"
            />
            <button
              onClick={sendMessage}
              className="ml-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserChat;
