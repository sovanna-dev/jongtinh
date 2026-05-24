import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Typography, Card, Descriptions, Button, Avatar, Space, message, Spin, Tag, Modal, Form, Input, Upload, Select } from "antd";
import { UserOutlined, EditOutlined, MailOutlined, PhoneOutlined, CalendarOutlined, CameraOutlined, DeleteOutlined, RightOutlined, PlusOutlined, MessageOutlined } from "@ant-design/icons";
import { doc, getDoc, updateDoc, collection, query, where, orderBy, onSnapshot, deleteDoc, addDoc } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { ShopLayout } from "./ShopLayout";
import { useCart } from "../../contexts/CartContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { INotification, ISupportTicket } from "../../interfaces";

const { Title, Text } = Typography;

interface UserProfile { displayName: string; email: string; phoneNumber: string; photoUrl: string; isAdmin: boolean; role: string; createdAt: number; }

export const ProfilePage: React.FC = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [notifications, setNotifications] = useState<INotification[]>([]);
    const [tickets, setTickets] = useState<ISupportTicket[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [createTicketModalOpen, setCreateTicketModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();
    const [ticketForm] = Form.useForm();
    const user = auth.currentUser;
    const { cart } = useCart();

    useEffect(() => {
        if (!user) { setLoading(false); return; }
        (async () => {
            try {
                const snap = await getDoc(doc(db, "users", user.uid));
                const d = snap.exists() ? snap.data() : {};
                setProfile({ displayName: d.displayName || user.displayName || "User", email: d.email || user.email || "", phoneNumber: d.phoneNumber || "", photoUrl: d.photoUrl || user.photoURL || "", isAdmin: d.isAdmin || false, role: d.role || "viewer", createdAt: d.createdAt || 0 });
            } catch { message.error(t.profile.messages.loadFailed); }
            setLoading(false);
        })();
    }, [user, t.profile.messages.loadFailed]);

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setTickets([]);
            return;
        }

        // Notifications listener
        const qNotif = query(
            collection(db, "notifications"),
            where("userId", "==", user.uid),
            orderBy("timestamp", "desc")
        );

        const unsubscribeNotif = onSnapshot(qNotif, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as INotification));
            setNotifications(data);
        });

        // Tickets listener
        const qTickets = query(
            collection(db, "support_tickets"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const unsubscribeTickets = onSnapshot(qTickets, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ISupportTicket));
            setTickets(data);
        });

        // Orders listener
        const qOrders = query(
            collection(db, "orders"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as any));
            setOrders(data);
        });

        return () => {
            unsubscribeNotif();
            unsubscribeTickets();
            unsubscribeOrders();
        };
    }, [user]);

    const handleCreateTicket = async (values: any) => {
        if (!user) return;
        setSaving(true);
        try {
            await addDoc(collection(db, "support_tickets"), {
                userId: user.uid,
                userName: profile?.displayName || user.displayName || "Anonymous",
                userEmail: user.email,
                subject: values.subject,
                message: values.message,
                category: values.category || "General",
                orderId: values.orderId || null,
                status: "OPEN",
                priority: "MEDIUM",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            message.success(t.tickets?.messages?.created || "Ticket created successfully");
            setCreateTicketModalOpen(false);
            ticketForm.resetFields();
        } catch (error) {
            message.error("Failed to create ticket");
        } finally {
            setSaving(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await updateDoc(doc(db, "notifications", id), { isRead: true });
        } catch (error) {
            message.error(t.profile.messages.notifMarkReadFailed);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await deleteDoc(doc(db, "notifications", id));
            message.success(t.profile.messages.notifDeleted);
        } catch (error) {
            message.error(t.profile.messages.notifDeleteFailed);
        }
    };

    const handleEdit = () => { form.setFieldsValue({ displayName: profile?.displayName, phoneNumber: profile?.phoneNumber }); setEditModalOpen(true); };

    const handleSave = async (values: { displayName: string; phoneNumber?: string }) => {
        if (!user) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, "users", user.uid), {
                displayName: values.displayName,
                phoneNumber: values.phoneNumber || "",
                updatedAt: Date.now()
            });
            setProfile((p) => p ? { ...p, displayName: values.displayName, phoneNumber: values.phoneNumber || "" } : null);
            message.success(t.profile.messages.updated);
            setEditModalOpen(false);
        }
        catch (e: unknown) {
            const error = e as Error;
            message.error(error.message);
        }
        setSaving(false);
    };

    const handlePhotoUpload = async (file: File) => {
        if (!user) return;
        const fd = new FormData(); fd.append("file", file); fd.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "jongtinh_upload"); fd.append("folder", "profiles");
        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: fd });
            const data = await res.json();
            if (data.secure_url) { await updateDoc(doc(db, "users", user.uid), { photoUrl: data.secure_url }); setProfile((p) => p ? { ...p, photoUrl: data.secure_url } : null); message.success(t.profile.messages.photoUpdated); }
        } catch { message.error(t.profile.messages.uploadFailed); }
    };

    if (loading) return <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}><div style={{ textAlign: "center", padding: 100 }}><Spin size="large" /></div></ShopLayout>;

    return (
        <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
            <div style={{ maxWidth: 600, margin: "0 auto" }}>
                <Title level={2}>{t.profile.title}</Title>
                <Card style={{ borderRadius: 16, textAlign: "center" }}>
                    <div style={{ position: "relative", display: "inline-block" }}>
                        <Avatar size={100} src={profile?.photoUrl} icon={!profile?.photoUrl ? <UserOutlined /> : undefined} style={{ background: "linear-gradient(135deg, #FF006E, #8338EC)", marginBottom: 16, fontSize: 36 }}>{!profile?.photoUrl && profile?.displayName?.charAt(0)?.toUpperCase()}</Avatar>
                        <Upload showUploadList={false} accept="image/*" customRequest={({ file }) => handlePhotoUpload(file as File)}>
                            <div style={{ position: "absolute", bottom: 16, right: 0, width: 32, height: 32, borderRadius: "50%", background: "#FF006E", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid #fff" }}><CameraOutlined style={{ color: "#fff", fontSize: 14 }} /></div>
                        </Upload>
                    </div>
                    <Title level={3}>{profile?.displayName}</Title>
                    <Text type="secondary">{profile?.email}</Text>
                    {profile?.isAdmin && <div style={{ marginTop: 8 }}><Tag color="red">{t.profile.roles[profile.role as keyof typeof t.profile.roles] || profile.role}</Tag></div>}
                    <Descriptions bordered column={1} style={{ marginTop: 24, textAlign: "left" }}>
                        <Descriptions.Item label={<><MailOutlined /> {t.profile.email}</>}>{profile?.email}</Descriptions.Item>
                        <Descriptions.Item label={<><PhoneOutlined /> {t.profile.phone}</>}>{profile?.phoneNumber || t.profile.notProvided}</Descriptions.Item>
                        <Descriptions.Item label={<><CalendarOutlined /> {t.profile.memberSince}</>}>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString(language === 'km' ? 'km-KH' : 'en-US') : t.profile.unknown}</Descriptions.Item>
                    </Descriptions>
                    <Button type="primary" icon={<EditOutlined />} style={{ marginTop: 24, background: "#FF006E", border: "none", borderRadius: 8, height: 40 }} onClick={handleEdit}>{t.profile.editProfile}</Button>
                    <div style={{ marginTop: 16 }}>
                        <Button
                            block
                            icon={<RightOutlined />}
                            onClick={() => navigate("/shop/orders")}
                            style={{ borderRadius: 8, height: 40, textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: "row-reverse", marginBottom: 8 }}
                        >
                            <span>{t.header.myOrders}</span>
                        </Button>
                        <Button
                            block
                            icon={<RightOutlined />}
                            onClick={() => navigate("/shop/faq")}
                            style={{ borderRadius: 8, height: 40, textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", flexDirection: "row-reverse" }}
                        >
                            <span>{t.faq.contactSupport}</span>
                        </Button>
                    </div>
                </Card>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 16 }}>
                    <Title level={3} style={{ margin: 0 }}>{t.tickets?.title || "My Support Tickets"}</Title>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setCreateTicketModalOpen(true)}
                        style={{ background: "#FF006E", border: "none" }}
                    >
                        {t.tickets?.createTicket || "New Ticket"}
                    </Button>
                </div>
                <Card style={{ borderRadius: 16 }}>
                    <Space direction="vertical" style={{ width: "100%" }} size={12}>
                        {tickets.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "20px 0" }}>
                                <Text type="secondary">{t.tickets?.noTickets || "No tickets found"}</Text>
                            </div>
                        ) : (
                            tickets.map(ticket => (
                                <div
                                    key={ticket.id}
                                    style={{
                                        padding: 16,
                                        borderRadius: 12,
                                        border: "1px solid #eee",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        cursor: "pointer",
                                        transition: "all 0.3s"
                                    }}
                                    onClick={() => navigate(`/shop/ticket/${ticket.id}`)}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = "#FF006E"}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = "#eee"}
                                >
                                    <div>
                                        <Text strong style={{ display: 'block' }}>{ticket.subject}</Text>
                                        <Space size={8} style={{ marginTop: 4 }}>
                                            <Tag color={
                                                ticket.status === "OPEN" ? "blue" :
                                                ticket.status === "IN_PROGRESS" ? "orange" :
                                                ticket.status === "RESOLVED" ? "green" : "default"
                                            }>
                                                {ticket.status}
                                            </Tag>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {new Date(ticket.createdAt).toLocaleDateString()}
                                            </Text>
                                        </Space>
                                    </div>
                                    <RightOutlined style={{ color: "#ccc" }} />
                                </div>
                            ))
                        )}
                    </Space>
                </Card>

                <Title level={3} style={{ marginTop: 40 }}>{t.profile.notifications}</Title>
                <Card style={{ borderRadius: 16 }}>
                    <Space direction="vertical" style={{ width: "100%" }} size={16}>
                        {notifications.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "20px 0" }}>
                                <Text type="secondary">{t.profile.noNotifications}</Text>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.id}
                                    style={{
                                        padding: 16,
                                        borderRadius: 12,
                                        background: n.isRead ? "#f9f9f9" : "rgba(255, 0, 110, 0.05)",
                                        border: `1px solid ${n.isRead ? "#eee" : "rgba(255, 0, 110, 0.1)"}`,
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        cursor: n.destinationId ? "pointer" : "default"
                                    }}
                                    onClick={() => {
                                        if (n.destination === "order" && n.destinationId) {
                                            navigate(`/shop/order/${n.destinationId}`);
                                        } else if (n.destination === "ticket" && n.destinationId) {
                                            navigate(`/shop/ticket/${n.destinationId}`);
                                        }
                                        if (!n.isRead) markAsRead(n.id);
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <Space align="center">
                                            <Text strong={!n.isRead}>{n.title}</Text>
                                            {!n.isRead && <Tag color="#FF006E">{t.profile.new}</Tag>}
                                            <Tag color={n.type === "order" ? "blue" : n.type === "promo" ? "green" : n.type === "support" ? "orange" : "default"}>{n.type?.toUpperCase()}</Tag>
                                        </Space>
                                        <div style={{ marginTop: 4 }}>
                                            <Text type="secondary">{n.message}</Text>
                                        </div>
                                        <div style={{ marginTop: 8 }}>
                                            <Text style={{ fontSize: 12, color: "#999" }}>
                                                {new Date(n.timestamp).toLocaleString(language === 'km' ? 'km-KH' : 'en-US')}
                                            </Text>
                                        </div>
                                    </div>
                                    <Space>
                                        {!n.isRead && (
                                            <Button size="small" onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}>{t.profile.markAsRead}</Button>
                                        )}
                                        <Button
                                            size="small"
                                            danger
                                            type="text"
                                            icon={<DeleteOutlined />}
                                            onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                                        />
                                    </Space>
                                </div>
                            ))
                        )}
                    </Space>
                </Card>
            </div>
            <Modal title={t.profile.editProfile} open={editModalOpen} onCancel={() => setEditModalOpen(false)} footer={null} width={500}>
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item name="displayName" label={t.profile.fullName} rules={[{ required: true }]}><Input size="large" /></Form.Item>
                    <Form.Item name="phoneNumber" label={t.profile.phoneLabel}><Input size="large" /></Form.Item>
                    <Form.Item label={t.profile.email}><Input value={profile?.email} disabled size="large" /></Form.Item>
                    <Space style={{ width: "100%", justifyContent: "flex-end" }}><Button onClick={() => setEditModalOpen(false)}>{t.profile.cancel}</Button><Button type="primary" htmlType="submit" loading={saving} style={{ background: "#FF006E", border: "none" }}>{t.profile.saveChanges}</Button></Space>
                </Form>
            </Modal>
            <Modal
                title={t.tickets?.createTicket || "Create Support Ticket"}
                open={createTicketModalOpen}
                onCancel={() => setCreateTicketModalOpen(false)}
                footer={null}
            >
                <Form form={ticketForm} layout="vertical" onFinish={handleCreateTicket}>
                    <Form.Item
                        name="subject"
                        label={t.tickets?.subject || "Subject"}
                        rules={[{ required: true, message: t.tickets?.subjectRequired || "Please enter a subject" }]}
                    >
                        <Input placeholder="What do you need help with?" />
                    </Form.Item>
                    <Form.Item
                        name="category"
                        label={t.tickets?.categoryLabel || "Category"}
                        rules={[{ required: true }]}
                        initialValue="general"
                    >
                        <Select>
                            <Select.Option value="order">{t.tickets?.categories?.order || "Order Inquiry"}</Select.Option>
                            <Select.Option value="payment">{t.tickets?.categories?.payment || "Payment Issue"}</Select.Option>
                            <Select.Option value="delivery">{t.tickets?.categories?.delivery || "Delivery"}</Select.Option>
                            <Select.Option value="refund">{t.tickets?.categories?.refund || "Returns & Refunds"}</Select.Option>
                            <Select.Option value="general">{t.tickets?.categories?.general || "General Inquiry"}</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="orderId"
                        label={t.tickets?.orderLabel || "Related Order (Optional)"}
                    >
                        <Select placeholder="Select an order" allowClear>
                            {orders.map(order => (
                                <Select.Option key={order.id} value={order.orderId}>
                                    #{order.orderId} - {new Date(order.createdAt).toLocaleDateString()} ({order.orderStatus})
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="message"
                        label={t.tickets?.messageLabel || "Message"}
                        rules={[{ required: true, message: t.tickets?.messageRequired || "Please describe your issue" }]}
                    >
                        <Input.TextArea rows={4} placeholder="Describe your issue in detail..." />
                    </Form.Item>
                    <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                        <Button onClick={() => setCreateTicketModalOpen(false)}>{t.profile.cancel}</Button>
                        <Button type="primary" htmlType="submit" loading={saving} style={{ background: "#FF006E", border: "none" }}>
                            {t.tickets?.submit || "Submit Ticket"}
                        </Button>
                    </Space>
                </Form>
            </Modal>
        </ShopLayout>
    );
};