import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { chatService } from "../services/chatService";
import { AlertCircle, MessageSquare, Send } from "lucide-react";

const DoctorPatientChat = ({
  recipientId,
  recipientName,
  appointmentId,
}) => {
  const { user } = useAuth();
  const peerId = Number(recipientId);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connection, setConnection] = useState("connecting");
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user || !peerId) return undefined;
    let active = true;
    setLoading(true);
    setError("");

    const token = localStorage.getItem("hb_access_token");
    if (token) {
      socketRef.current = chatService.connectWebSocket(
        token,
        (event) => {
          if (event.type === "ERROR") {
            setError(event.message || "Unable to send this message.");
            return;
          }
          if (event.type !== "CHAT_MESSAGE") return;
          const newMessage = event.data;
          if (
            (newMessage.sender_id === peerId &&
              newMessage.recipient_id === user.id) ||
            (newMessage.sender_id === user.id &&
              newMessage.recipient_id === peerId)
          ) {
            setMessages((current) =>
              current.some((message) => message.id === newMessage.id)
                ? current
                : [...current, newMessage],
            );
          }
        },
        (status) => {
          if (active) setConnection(status);
        },
      );
    } else {
      setConnection("disconnected");
    }

    chatService
      .getHistory(peerId)
      .then((history) => {
        if (!active) return;
        setMessages((current) => {
          const messagesById = new Map(
            [...history, ...current].map((message) => [message.id, message]),
          );
          return [...messagesById.values()].sort(
            (first, second) =>
              new Date(first.timestamp) - new Date(second.timestamp),
          );
        });
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.detail ||
              "Unable to load this conversation.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [user, peerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (event) => {
    event.preventDefault();
    const content = inputMessage.trim();
    if (!content || content.length > 4000 || sending) return;

    setSending(true);
    setError("");
    try {
      const sentMessage = await chatService.sendMessage({
        recipient_id: peerId,
        appointment_id: appointmentId,
        content,
      });
      setMessages((current) =>
        current.some((message) => message.id === sentMessage.id)
          ? current
          : [...current, sentMessage],
      );
      setInputMessage("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Unable to send your message. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3 bg-gray-50 rounded-t-xl">
        <MessageSquare className="h-5 w-5 text-indigo-600" />
        <h3 className="font-bold text-gray-900">
          Consultation Room with {recipientName}
        </h3>
        <span
          className={`ml-auto text-xs font-semibold ${
            connection === "connected" ? "text-emerald-700" : "text-amber-700"
          }`}
          role="status"
        >
          {connection === "connected"
            ? "Live"
            : connection === "connecting"
              ? "Connecting..."
              : "Offline"}
        </span>
      </div>

      {/* Message Feed */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-800"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {loading && (
          <p className="text-center text-sm text-gray-500">
            Loading conversation...
          </p>
        )}
        {!loading && messages.length === 0 && (
          <p className="text-center text-sm text-gray-500">
            No messages yet. Start the conversation.
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === user.id;
          return (
            <div
              key={msg.id}
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
          maxLength={4000}
          placeholder="Type your message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
          aria-label="Message"
        />
        <button
          type="submit"
          disabled={
            !inputMessage.trim() ||
            inputMessage.length > 4000 ||
            sending
          }
          aria-label="Send message"
          className="bg-indigo-600 text-white p-2.5 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};

export default DoctorPatientChat;
