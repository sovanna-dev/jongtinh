import React, { useState, useEffect, useRef } from "react";
import { Button, Card, Input, Avatar, Badge, Space, Typography, Tooltip, Tag } from "antd";
import { MessageOutlined, CloseOutlined, SendOutlined, CustomerServiceOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../contexts/LanguageContext";

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

export const LiveChat: React.FC<LiveChatProps> = ({ isDark }) => {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            text: t.chat.agentWelcome,
            sender: "agent",
            timestamp: new Date(),
        },
        {
            id: "2",
            text: t.chat.agentHelpList,
            sender: "agent",
            timestamp: new Date(),
        },
    ]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Sync initial messages when language changes
    useEffect(() => {
        setMessages([
            {
                id: "1",
                text: t.chat.agentWelcome,
                sender: "agent",
                timestamp: new Date(),
            },
            {
                id: "2",
                text: t.chat.agentHelpList,
                sender: "agent",
                timestamp: new Date(),
            },
        ]);
    }, [t.chat.agentWelcome, t.chat.agentHelpList]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const generateSmartResponse = (userMessage: string): string => {
        const message = userMessage.toLowerCase().trim();

        if (message.includes("track") || message.includes("order") || message.includes("📦") || message.includes("តាមដាន")) {
            return t.chat.responses.track;
        }
        if (message.includes("payment") || message.includes("pay") || message.includes("💳") || message.includes("ការទូទាត់")) {
            return t.chat.responses.payment;
        }
        if (message.includes("delivery") || message.includes("shipping") || message.includes("🚚") || message.includes("ដឹកជញ្ជូន")) {
            return t.chat.responses.delivery;
        }
        if (message.includes("return") || message.includes("refund") || message.includes("↩️") || message.includes("ប្តូរ")) {
            return t.chat.responses.return;
        }
        if (message.includes("product") || message.includes("item") || message.includes("🛍️") || message.includes("ផលិតផល")) {
            return t.chat.responses.product;
        }
        if (message.includes("hello") || message.includes("hi") || message.includes("help") || message.includes("សួស្តី")) {
            return t.chat.responses.hello;
        }
        if (message.includes("thank") || message.includes("bye") || message.includes("អរគុណ")) {
            return t.chat.responses.thanks;
        }
        return t.chat.responses.default;
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

    const QUICK_REPLIES = [
        { key: "track", text: t.chat.quickReplies.track },
        { key: "payment", text: t.chat.quickReplies.payment },
        { key: "delivery", text: t.chat.quickReplies.delivery },
        { key: "return", text: t.chat.quickReplies.return },
        { key: "general", text: t.chat.quickReplies.general },
    ];

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
                                        <Title level={5} style={{ color: "white", margin: 0, fontSize: 16 }}>{t.chat.title}</Title>
                                        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>{t.chat.subtitle}</Text>
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
                                        key={reply.key}
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
                                        onClick={() => handleSend(reply.text)}
                                    >
                                        {reply.text}
                                    </Tag>
                                ))}
                            </div>

                            {/* Input */}
                            <div style={{ padding: "12px 16px", borderTop: isDark ? "1px solid #333" : "1px solid #f0f0f0" }}>
                                <Input
                                    placeholder={t.chat.placeholder}
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
            <Tooltip title={t.chat.tooltip} placement="left">
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
