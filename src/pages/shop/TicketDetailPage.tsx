import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Typography, Card, Divider, List, Avatar, Form, Input, Button, message, Space, Tag, Spin } from "antd";
import { UserOutlined, MessageOutlined, ArrowLeftOutlined, SendOutlined } from "@ant-design/icons";
import { ShopLayout } from "./ShopLayout";
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { ISupportTicket, ITicketReply } from "../../interfaces";
import { useLanguage } from "../../contexts/LanguageContext";

const { Title, Text, Paragraph } = Typography;

export const TicketDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const [ticket, setTicket] = useState<ISupportTicket | null>(null);
    const [replies, setReplies] = useState<ITicketReply[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [form] = Form.useForm();
    const user = auth.currentUser;

    useEffect(() => {
        if (!id || !user) {
            setLoading(false);
            return;
        }

        // Fetch Ticket details
        const fetchTicket = async () => {
            try {
                const docRef = doc(db, "support_tickets", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data() as ISupportTicket;
                    // Security check: Ensure this ticket belongs to the user
                    if (data.userId !== user.uid) {
                        message.error(t.tickets.messages.accessDenied || "Access Denied");
                        navigate("/shop/profile");
                        return;
                    }
                    setTicket({ id: docSnap.id, ...data });
                } else {
                    message.error(t.tickets.messages.notFound || "Ticket not found");
                    navigate("/shop/profile");
                }
            } catch (error) {
                console.error("Error fetching ticket:", error);
                message.error("Failed to load ticket details");
            } finally {
                setLoading(false);
            }
        };

        fetchTicket();

        // Subscribe to replies
        const repliesRef = collection(db, "support_tickets", id, "replies");
        const q = query(repliesRef, orderBy("createdAt", "asc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ITicketReply));
            setReplies(data);
        });

        return () => unsubscribe();
    }, [id, user, navigate, t.tickets.messages]);

    const onFinish = async (values: { message: string }) => {
        if (!id || !user || !ticket) return;
        setSending(true);

        try {
            // Add reply to sub-collection
            await addDoc(collection(db, "support_tickets", id, "replies"), {
                message: values.message,
                userId: user.uid,
                isAdminReply: false,
                createdAt: Date.now(),
            });

            // Update ticket status if it was RESOLVED/CLOSED maybe?
            // Or just update updatedAt
            await updateDoc(doc(db, "support_tickets", id), {
                updatedAt: Date.now(),
                status: ticket.status === "CLOSED" ? "OPEN" : ticket.status
            });

            form.resetFields();
            message.success(t.tickets.messages.replySent);
        } catch (error) {
            console.error("Error sending reply:", error);
            message.error("Failed to send reply");
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
                <div style={{ textAlign: "center", padding: 100 }}><Spin size="large" /></div>
            </ShopLayout>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "OPEN": return "blue";
            case "IN_PROGRESS": return "orange";
            case "RESOLVED": return "green";
            case "CLOSED": return "default";
            default: return "blue";
        }
    };

    return (
        <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
            <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px" }}>
                <Button
                    type="link"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate("/shop/profile")}
                    style={{ padding: 0, marginBottom: 16, color: "#FF006E" }}
                >
                    {t.common?.backToProfile || "Back to Profile"}
                </Button>

                <Card
                    style={{ borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", marginBottom: 24 }}
                    title={
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Title level={4} style={{ margin: 0 }}>{ticket?.subject}</Title>
                            <Tag color={getStatusColor(ticket?.status || "")}>{ticket?.status}</Tag>
                        </Space>
                    }
                >
                    <Paragraph style={{ fontSize: 16, color: "#555" }}>
                        {ticket?.message}
                    </Paragraph>
                    <div style={{ marginTop: 16 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {t.tickets.category}: {ticket?.category} • {new Date(ticket?.createdAt || 0).toLocaleString(language === 'km' ? 'km-KH' : 'en-US')}
                        </Text>
                    </div>
                </Card>

                <Title level={4} style={{ marginBottom: 20 }}>
                    <MessageOutlined style={{ marginRight: 8, color: "#FF006E" }} />
                    {t.tickets.conversation}
                </Title>

                <div style={{ marginBottom: 24 }}>
                    <List
                        dataSource={replies}
                        locale={{ emptyText: t.tickets.noReplies }}
                        renderItem={(item) => (
                            <div style={{
                                display: 'flex',
                                justifyContent: item.isAdminReply ? 'flex-start' : 'flex-end',
                                marginBottom: 16
                            }}>
                                <div style={{
                                    maxWidth: '80%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: item.isAdminReply ? 'flex-start' : 'flex-end'
                                }}>
                                    <Space style={{ marginBottom: 4 }}>
                                        {item.isAdminReply && <Avatar size="small" style={{ backgroundColor: '#87d068' }}>A</Avatar>}
                                        <Text strong style={{ fontSize: 12 }}>
                                            {item.isAdminReply ? t.tickets.adminSupport : t.profile.fullName || "Me"}
                                        </Text>
                                        {!item.isAdminReply && <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: '#FF006E' }} />}
                                    </Space>
                                    <div style={{
                                        padding: '12px 16px',
                                        background: item.isAdminReply ? '#f0f2f5' : '#FF006E',
                                        color: item.isAdminReply ? '#000' : '#fff',
                                        borderRadius: item.isAdminReply ? '0 12px 12px 12px' : '12px 0 12px 12px',
                                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                                    }}>
                                        {item.message}
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 10, marginTop: 4 }}>
                                        {new Date(item.createdAt).toLocaleString(language === 'km' ? 'km-KH' : 'en-US')}
                                    </Text>
                                </div>
                            </div>
                        )}
                    />
                </div>

                {ticket?.status !== "CLOSED" && (
                    <Card style={{ borderRadius: 16, border: "1px solid #eee" }}>
                        <Form form={form} onFinish={onFinish}>
                            <Form.Item name="message" rules={[{ required: true, message: t.tickets.typeReply }]}>
                                <Input.TextArea
                                    rows={3}
                                    placeholder={t.tickets.typeReply}
                                    style={{ borderRadius: 8, resize: 'none' }}
                                />
                            </Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={sending}
                                icon={<SendOutlined />}
                                style={{
                                    background: "#FF006E",
                                    border: "none",
                                    borderRadius: 8,
                                    height: 40,
                                    float: 'right'
                                }}
                            >
                                {t.tickets.sendReply}
                            </Button>
                        </Form>
                    </Card>
                )}
            </div>
        </ShopLayout>
    );
};
