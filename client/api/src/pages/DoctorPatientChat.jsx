import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { chatService } from "../services/chatService";
import { Send, MessageSquare } from "lucide-react";

const DoctorPatientChat = ({ recipientId, recipientName }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (user && recipientId) {
      // Load historical chat
      chatService.getHistory(recipientId).then((data) => {
        setMessages(data);
        scrollToBottom();
      });

      // Connect WebSocket session
      const token = localStorage.getItem("hb_access_token");
      socketRef.current = chatService.connectWebSocket(token, (event) => {
        if (event.type === "CHAT_MESSAGE") {
          const newMsg = event.data;
          if (
            (newMsg.sender_id === recipientId &&
              newMsg.recipient_id === user.id) ||
            (newMsg.sender_id === user.id &&
              newMsg.recipient_id === recipientId)
          ) {
            setMessages((prev) => [...prev, newMsg]);
            scrollToBottom();
          }
        }
      });

      return () => {
        if (socketRef.current) {
          socketRef.current.close();
        }
      };
    }
  }, [user, recipientId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socketRef.current) return;

    const payload = {
      recipient_id: recipientId,
      content: inputMessage,
    };

    socketRef.current.send(JSON.stringify(payload));
    setInputMessage("");
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3 bg-gray-50 rounded-t-xl">
        <MessageSquare className="h-5 w-5 text-indigo-600" />
        <h3 className="font-bold text-gray-900">
          Consultation Room with {recipientName}
        </h3>
      </div>

      {/* Message Feed */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((msg, index) => {
          const isMe = msg.sender_id === user.id;
          return (
            <div
              key={index}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl text-sm ${
                  isMe
                    ? "bg-indigo-600 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-900 rounded-bl-none"
                }`}
              >
                <p>{msg.content}</p>
                <span
                  className={`block text-[10px] mt-1 text-right ${isMe ? "text-indigo-200" : "text-gray-400"}`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-gray-200 flex gap-2"
      >
        <input
          type="text"
          placeholder="Type your message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white p-2.5 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};

export default DoctorPatientChat;
