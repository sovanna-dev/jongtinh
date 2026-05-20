import React, { useState, useEffect, useRef } from "react";
import { Button, Card, Input, Avatar, Badge, Space, Typography, Tooltip, Tag } from "antd";
import { MessageOutlined, CloseOutlined, SendOutlined, CustomerServiceOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";

const { Text, Title } = Typography;

interface Message {
    id: string;
    text: string;
    sender: "user" | "agent";
    timestamp: Date;
    isTyping?: boolean;
}

interface LiveChatProps {
    isDark?: boolean;
}

const QUICK_REPLIES = [
    "📦 Track my order",
    "💳 Payment issue",
    "🚚 Delivery time",
    "↩️ Return policy",
    "❓ General question",
];

export const LiveChat: React.FC<LiveChatProps> = ({ isDark }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            text: "Hello! 👋 Welcome to JongTinh Support.\n\nHow can I help you today?",
            sender: "agent",
            timestamp: new Date(),
        },
        {
            id: "2",
            text: "You can ask me about:\n📦 • Order tracking\n💳 • Payment methods\n🚚 • Delivery information\n↩️ • Returns & refunds\n🛍️ • Product questions",
            sender: "agent",
            timestamp: new Date(),
        },
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const generateSmartResponse = (userMessage: string): string => {
        const message = userMessage.toLowerCase().trim();

        if (message.includes("track") || message.includes("order") || message.includes("📦")) {
            return "I can help you track your order! 📦\n\nTo check your order status:\n1. Go to **Profile → My Orders**\n2. Tap on any order to see tracking details\n3. You'll see the current status (Pending → Processing → Shipping → Delivered)\n\nDo you have a specific order number?";
        }
        if (message.includes("payment") || message.includes("pay") || message.includes("💳")) {
            return "We support multiple payment methods:\n\n🏦 **ABA Pay**\n🏦 **ACLEDA**\n🏦 **Wing**\n💵 **Cash on Delivery**\n\nWhat payment issue are you experiencing?";
        }
        if (message.includes("delivery") || message.includes("shipping") || message.includes("🚚")) {
            return "📦 **Standard Delivery:** 2-3 business days\n🚀 **Express:** 1-2 business days\n📍 **Coverage:** All major cities in Cambodia\n💰 **Shipping:** FREE for all orders!\n\nWould you like to track a specific order?";
        }
        if (message.includes("return") || message.includes("refund") || message.includes("↩️")) {
            return "Our return policy:\n✅ **30 days** from delivery\n✅ Item must be unused\n✅ Refund via original payment\n✅ Processing: 5-7 business days\n\nWant to create a return request?";
        }
        if (message.includes("product") || message.includes("item") || message.includes("🛍️")) {
            return "🔍 Search products by name\n📂 Browse by category\n⭐ Check ratings and reviews\n❤️ Save to favorites\n\nWhat product are you looking for?";
        }
        if (message.includes("hello") || message.includes("hi") || message.includes("help")) {
            return "Hello! 😊 I'm here to help.\n\nAsk me about:\n📦 Orders\n💳 Payments\n🚚 Delivery\n↩️ Returns\n🛍️ Products\n\nWhat can I assist you with?";
        }
        if (message.includes("thank") || message.includes("bye")) {
            return "You're welcome! 😊\n\n📞 Call: +855 12 345 678\n📧 Email: support@jongtinh.com\n🎫 Create a support ticket\n\nHave a great day! 🛍️";
        }
        return "Thank you for your message! 🙏\n\nFor faster help, you can:\n📞 Call: +855 12 345 678\n📧 Email: support@jongtinh.com\n🎫 Create a support ticket";
    };

    const handleSend = (text?: string) => {
        const msgText = text || message;
        if (!msgText.trim()) return;

        const newUserMsg: Message = {
            id: Date.now().toString(),
            text: msgText,
            sender: "user",
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, newUserMsg]);
        setMessage("");
        setIsTyping(true);

        setTimeout(() => {
            setIsTyping(false);
            const agentMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: generateSmartResponse(msgText),
                sender: "agent",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, agentMsg]);
        }, 1500);
    };

    return (
        <div style={{ position: "fixed", bottom: 30, right: 30, zIndex: 1000 }}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        style={{ marginBottom: 20 }}
                    >
                        <Card
                            styles={{ body: { padding: 0 } }}
                            style={{
                                width: 370,
                                height: 520,
                                borderRadius: 20,
                                overflow: "hidden",
                                boxShadow: isDark ? "0 12px 40px rgba(0,0,0,0.6)" : "0 12px 40px rgba(0,0,0,0.15)",
                                border: isDark ? "1px solid #333" : "1px solid #f0f0f0",
                                background: isDark ? "#1f1f1f" : "#fff",
                            }}
                        >
                            {/* Header */}
                            <div style={{
                                padding: "18px 20px",
                                background: "linear-gradient(135deg, #FF006E 0%, #8338EC 100%)",
                                color: "white",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}>
                                <Space>
                                    <Badge dot color="#52c41a" offset={[-2, 32]}>
                                        <Avatar size="large" icon={<CustomerServiceOutlined />} style={{ backgroundColor: "rgba(255,255,255,0.2)" }} />
                                    </Badge>
                                    <div>
                                        <Title level={5} style={{ color: "white", margin: 0, fontSize: 16 }}>JongTinh Support</Title>
                                        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>We typically reply in a few minutes</Text>
                                    </div>
                                </Space>
                                <Button type="text" icon={<CloseOutlined style={{ color: "white" }} />} onClick={() => setIsOpen(false)} />
                            </div>

                            {/* Messages */}
                            <div ref={scrollRef} style={{
                                height: 310,
                                overflowY: "auto",
                                padding: "16px",
                                background: isDark ? "#141414" : "#f9f9f9",
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                            }}>
                                {messages.map((msg) => (
                                    <div key={msg.id} style={{ alignSelf: msg.sender === "user" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                                        <div style={{
                                            padding: "10px 14px",
                                            borderRadius: msg.sender === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                                            background: msg.sender === "user" ? "#FF006E" : (isDark ? "#262626" : "#fff"),
                                            color: msg.sender === "user" ? "white" : (isDark ? "#e8e8e8" : "#333"),
                                            boxShadow: msg.sender === "user" ? "none" : "0 2px 8px rgba(0,0,0,0.05)",
                                            fontSize: 13,
                                            whiteSpace: "pre-line",
                                            lineHeight: 1.6,
                                        }}>
                                            {msg.text}
                                        </div>
                                        <div style={{
                                            fontSize: 10, marginTop: 4,
                                            textAlign: msg.sender === "user" ? "right" : "left",
                                            color: "#8c8c8c",
                                        }}>
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div style={{ alignSelf: "flex-start", maxWidth: "85%" }}>
                                        <div style={{
                                            padding: "10px 14px",
                                            borderRadius: "18px 18px 18px 4px",
                                            background: isDark ? "#262626" : "#fff",
                                            display: "flex", gap: 4,
                                        }}>
                                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ccc", animation: "bounce 1.4s infinite" }} />
                                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ccc", animation: "bounce 1.4s infinite 0.2s" }} />
                                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ccc", animation: "bounce 1.4s infinite 0.4s" }} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Quick Replies */}
                            <div style={{
                                padding: "8px 16px",
                                borderTop: isDark ? "1px solid #333" : "1px solid #f0f0f0",
                                display: "flex",
                                gap: 6,
                                flexWrap: "wrap",
                                overflowX: "auto",
                            }}>
                                {QUICK_REPLIES.map((reply) => (
                                    <Tag
                                        key={reply}
                                        style={{
                                            cursor: "pointer",
                                            borderRadius: 20,
                                            padding: "4px 12px",
                                            fontSize: 12,
                                            borderColor: "#FF006E",
                                            color: "#FF006E",
                                            background: isDark ? "rgba(255,0,110,0.1)" : "#fff0f6",
                                            marginInline: 0,
                                        }}
                                        onClick={() => handleSend(reply)}
                                    >
                                        {reply}
                                    </Tag>
                                ))}
                            </div>

                            {/* Input */}
                            <div style={{ padding: "12px 16px", borderTop: isDark ? "1px solid #333" : "1px solid #f0f0f0" }}>
                                <Input
                                    placeholder="Type your message..."
                                    suffix={
                                        <Button
                                            type="primary"
                                            shape="circle"
                                            size="small"
                                            icon={<SendOutlined />}
                                            onClick={() => handleSend()}
                                            disabled={!message.trim()}
                                            style={{ background: "#FF006E", border: "none" }}
                                        />
                                    }
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onPressEnter={() => handleSend()}
                                    style={{ borderRadius: 25, height: 42 }}
                                />
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FAB Button with Lottie-style pulse */}
            <Tooltip title="Chat with support" placement="left">
                <div style={{ position: "relative" }}>
                    <div style={{
                        position: "absolute",
                        top: -8, left: -8, right: -8, bottom: -8,
                        borderRadius: "50%",
                        background: "rgba(255,0,110,0.15)",
                        animation: "pulse 2s infinite",
                    }} />
                    <Button
                        type="primary"
                        shape="circle"
                        size="large"
                        icon={isOpen ? <CloseOutlined /> : <MessageOutlined />}
                        onClick={() => setIsOpen(!isOpen)}
                        style={{
                            width: 60, height: 60,
                            background: "linear-gradient(135deg, #FF006E, #8338EC)",
                            border: "none",
                            boxShadow: "0 8px 24px rgba(255, 0, 110, 0.4)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 24,
                        }}
                    />
                </div>
            </Tooltip>

            {/* CSS for animations */}
            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(1); opacity: 0.5; }
                }
                @keyframes bounce {
                    0%, 60%, 100% { transform: translateY(0); }
                    30% { transform: translateY(-3px); }
                }
            `}</style>
        </div>
    );
};