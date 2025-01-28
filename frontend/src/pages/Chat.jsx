import React, { useState } from "react";
import { backendUrl } from "../../../admin/src/App";
import axios from "axios";
import { useEffect } from "react";
import { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";

const Chat = () => {
  const { token } = useContext(ShopContext);
  const [chats, setChats] = useState([]);
  const fetchChats = async () => {
    const response = await axios.get(backendUrl + "/api/chat/user", {
      headers: { token },
    });
    if (response.data.success) {
      setChats(response.data.chats);
    }
  };
  useEffect(() => {
    fetchChats();
  }, [token]);
  return <div>Hello</div>;
};

export default Chat;
