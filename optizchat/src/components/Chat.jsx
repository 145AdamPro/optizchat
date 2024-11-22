import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { generateChatResponse } from "../lib/gemini";
import { motion } from "framer-motion";
import { ChatBubbleLeftIcon, PaperAirplaneIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

const Chat = () => {
  const { user, signOut } = useAuth();
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [model, setModel] = useState("Gemini-pro");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching chats:", error);
    else setChats(data);
  };

  const createNewChat = async () => {
    const { data, error } = await supabase
      .from("chats")
      .insert({ user_id: user.id, title: "New Chat" })
      .select();

    if (error) console.error("Error creating new chat:", error);
    else {
      setChats([data[0], ...chats]);
      setCurrentChat(data[0]);
      setMessages([]);
    }
  };

  const selectChat = async (chat) => {
    setCurrentChat(chat);
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chat.id)
      .order("created_at", { ascending: true });

    if (error) console.error("Error fetching messages:", error);
    else setMessages(data);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const { data: userMessage, error: userError } = await supabase
        .from("messages")
        .insert({ chat_id: currentChat.id, content: newMessage, role: "user" })
        .select();

      if (userError) throw userError;
      setMessages([...messages, userMessage[0]]);
      setNewMessage("");

      const aiResponse = await generateChatResponse(newMessage, model.toLowerCase());
      
      const { data: aiMessage, error: aiError } = await supabase
        .from("messages")
        .insert({ 
          chat_id: currentChat.id, 
          content: aiResponse, 
          role: "assistant" 
        })
        .select();

      if (aiError) throw aiError;
      setMessages(prev => [...prev, aiMessage[0]]);
    } catch (error) {
      console.error("Error in chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteChat = async (chatId) => {
    const { error } = await supabase
      .from("chats")
      .delete()
      .eq("id", chatId);

    if (error) console.error("Error deleting chat:", error);
    else {
      setChats(chats.filter(chat => chat.id !== chatId));
      if (currentChat && currentChat.id === chatId) {
        setCurrentChat(null);
        setMessages([]);
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <motion.div 
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={createNewChat}
          className="flex items-center justify-center space-x-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg mb-6"
        >
          <PlusIcon className="w-5 h-5" />
          <span>New Chat</span>
        </motion.button>

        <div className="flex-1 overflow-y-auto space-y-2">
          {chats.map(chat => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                currentChat && currentChat.id === chat.id
                  ? "bg-blue-50 dark:bg-gray-700"
                  : "hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
              onClick={() => selectChat(chat)}
            >
              <div className="flex items-center space-x-3">
                <ChatBubbleLeftIcon className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {chat.title}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
              >
                <TrashIcon className="w-4 h-4 text-gray-500 hover:text-red-500" />
              </button>
            </motion.div>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => signOut()}
          className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg"
        >
          Sign Out
        </motion.button>
      </motion.div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {currentChat ? currentChat.title : "Select a chat"}
          </h2>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
          >
            <option value="Gemini-pro">Gemini-pro</option>
            <option value="Gemini-1.5-pro">Gemini-1.5-pro</option>
            <option value="Gemini-1.5-flash">Gemini-1.5-flash</option>
          </select>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] p-4 rounded-lg ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                } shadow-md`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Message input */}
        <form onSubmit={sendMessage} className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex space-x-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
              disabled={isLoading}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;