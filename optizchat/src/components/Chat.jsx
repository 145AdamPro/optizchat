import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { generateChatResponse } from "../lib/gemini";


const Chat = () => {
  const { user, signOut } = useAuth()
  const [chats, setChats] = useState([])
  const [currentChat, setCurrentChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [model, setModel] = useState('Gemini-pro')

  useEffect(() => {
    fetchChats()
  }, [])

  const fetchChats = async () => {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) console.error('Error fetching chats:', error)
    else setChats(data)
  }

  const createNewChat = async () => {
    const { data, error } = await supabase
      .from('chats')
      .insert({ user_id: user.id, title: 'New Chat' })
      .select()

    if (error) console.error('Error creating new chat:', error)
    else {
      setChats([data[0], ...chats])
      setCurrentChat(data[0])
      setMessages([])
    }
  }

  const selectChat = async (chat) => {
    setCurrentChat(chat)
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chat.id)
      .order('created_at', { ascending: true })

    if (error) console.error('Error fetching messages:', error)
    else setMessages(data)
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      // Save user message
      const { data: userMessage, error: userError } = await supabase
        .from('messages')
        .insert({ chat_id: currentChat.id, content: newMessage, role: 'user' })
        .select()

      if (userError) throw userError
      setMessages([...messages, userMessage[0]])
      setNewMessage('')

      // Get AI response
      const aiResponse = await generateChatResponse(newMessage, model.toLowerCase())
      
      // Save AI response
      const { data: aiMessage, error: aiError } = await supabase
        .from('messages')
        .insert({ 
          chat_id: currentChat.id, 
          content: aiResponse, 
          role: 'assistant' 
        })
        .select()

      if (aiError) throw aiError
      setMessages(prev => [...prev, aiMessage[0]])
    } catch (error) {
      console.error('Error in chat:', error)
      // Add appropriate error handling here
    }
  }

  const deleteChat = async (chatId) => {
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId)

    if (error) console.error('Error deleting chat:', error)
    else {
      setChats(chats.filter(chat => chat.id !== chatId))
      if (currentChat && currentChat.id === chatId) {
        setCurrentChat(null)
        setMessages([])
      }
    }
  }

  const renameChat = async (chatId, newTitle) => {
    const { error } = await supabase
      .from('chats')
      .update({ title: newTitle })
      .eq('id', chatId)

    if (error) console.error('Error renaming chat:', error)
    else {
      setChats(chats.map(chat => chat.id === chatId ? { ...chat, title: newTitle } : chat))
      if (currentChat && currentChat.id === chatId) {
        setCurrentChat({ ...currentChat, title: newTitle })
      }
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white p-4">
        <button
          onClick={createNewChat}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-4"
        >
          New Chat
        </button>
        <div className="space-y-2">
          {chats.map(chat => (
            <div key={chat.id} className="flex items-center justify-between">
              <button
                onClick={() => selectChat(chat)}
                className={`text-left truncate w-40 ${currentChat && currentChat.id === chat.id ? 'font-bold' : ''}`}
              >
                {chat.title}
              </button>
              <button onClick={() => deleteChat(chat.id)} className="text-red-500 hover:text-red-600">
                Delete
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => signOut()}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded mt-4"
        >
          Sign Out
        </button>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="bg-white shadow p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">{currentChat ? currentChat.title : 'Select a chat'}</h2>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="border rounded p-2"
          >
            <option value="Gemini-pro">Gemini-pro</option>
            <option value="Gemini-1.5-pro">Gemini-1.5-pro</option>
            <option value="Gemini-1.5-flash">Gemini-1.5-flash</option>
          </select>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`${message.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-2 rounded-lg ${message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>
                {message.content}
              </div>
            </div>
          ))}
        </div>

        {/* Message input */}
        <form onSubmit={sendMessage} className="bg-white p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border rounded p-2"
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Chat