import { createContext } from "react";
import { useContext } from "react";

const ChatContext = createContext();

const ChatProvider = ({ children }) => {
  return (
    <ChatContext.Provider value={children}>{children}</ChatContext.Provider>
  );
};
export const ChatState = () => {
  useContext(ChatContext);
};

export default ChatProvider;
