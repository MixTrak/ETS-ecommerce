'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  stockQuantity: number;
  featured: boolean;
}

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your ETS E-Commerce assistant. I can help you with product information, pricing, and general inquiries. How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch products for chatbot context
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products?limit=50');
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error('Error fetching products for chatbot:', error);
      }
    };
    fetchProducts();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call the chat API with product context
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          context: 'ETS E-Commerce - specializing in Electronics',
          products: products, // Send all products for better context
          currentProducts: products.length,
          searchQuery: userMessage.content.toLowerCase() // Send the user's query for better product matching
        }),
      });

      const data = await response.json();
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || 'Sorry, I couldn\'t process your request. Please try again.',
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I\'m having trouble connecting right now. Please try again later or contact our support team.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Toggle Button - Fixed to bottom right */}
      <button
        className={`fixed bottom-6 right-6 z-50 btn btn-circle btn-blue-400 shadow-xl transition-all duration-300 hover:scale-110 ${
          isOpen ? 'rotate-180' : ''
        }`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle chatbot"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat Window - Fixed to bottom right */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-96 h-[500px] bg-base-100 rounded-2xl shadow-2xl border border-base-300 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-red-700 text-primary-content p-4 rounded-t-2xl flex items-center gap-3">
            <div className="avatar placeholder">
              <div className="bg-primary-content text-primary rounded-full w-10 h-10">
                <Bot className="w-5 h-5" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg">ETS Assistant</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-xs opacity-90">Online now</p>
              </div>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-base-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat ${message.sender === 'user' ? 'chat-end' : 'chat-start'}`}
              >
                {message.sender === 'bot' && (
                  <div className="chat-image">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-primary-content flex items-center justify-center">
                      <Bot className="w-5 h-5" />
                    </div>
                  </div>
                )}
                
                <div className={`chat-bubble ${
                  message.sender === 'user' 
                    ? 'chat-bubble-info' 
                    : 'chat-bubble-info'
                }`}>
                  {message.content}
                </div>
                
                {message.sender === 'user' && (
                  <div className='flex items-center justify-center'>
                    <div className="chat-image">
                    <div className="w-10 h-10 rounded-full bg-red-600 text-primary-content flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                  </div>
                  
                )}
              </div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
              <div className="chat chat-start">
                <div className="chat-image avatar">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                </div>
                <div className="">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-black rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Section */}
          <div className="p-4 border-t border-base-300 bg-base-100">
            <div className="join w-full">
              <input
                ref={inputRef}
                type="text"
                placeholder="Type your message..."
                className="input input-bordered join-item flex-1"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
              />
              <button
                className="btn btn-primary join-item"
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
