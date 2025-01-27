import React, { useState } from "react";
import { backendUrl } from "../../../admin/src/App";
import axios from "axios";
import { useEffect } from "react";

const Chat = () => {
  const [chats, setChats] = useState([]);
  const fetchChats = async () => {
    const { data } = await axios.get(backendUrl + "/api/chat");
    setChats(data);
  };
  useEffect(() => {
    fetchChats();
  }, []);
  return <div>{chats.map()}</div>;
};

export default Chat;
