import React, { useState, useEffect } from "react";
import { Typography, Card, Descriptions, Button, Avatar, Space, message, Spin, Tag, Modal, Form, Input, Upload } from "antd";
import { UserOutlined, EditOutlined, MailOutlined, PhoneOutlined, CalendarOutlined, CameraOutlined, DeleteOutlined } from "@ant-design/icons";
import { doc, getDoc, updateDoc, collection, query, where, orderBy, onSnapshot, deleteDoc } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { ShopLayout } from "./ShopLayout";
import { useCart } from "../../contexts/CartContext";
import { INotification } from "../../interfaces";

const { Title, Text } = Typography;

interface UserProfile { displayName: string; email: string; phoneNumber: string; photoUrl: string; isAdmin: boolean; role: string; createdAt: number; }

export const ProfilePage: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [notifications, setNotifications] = useState<INotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();
    const user = auth.currentUser;
    const { cart } = useCart();

    useEffect(() => {
        if (!user) { setLoading(false); return; }
        (async () => {
            try {
                const snap = await getDoc(doc(db, "users", user.uid));
                const d = snap.exists() ? snap.data() : {};
                setProfile({ displayName: d.displayName || user.displayName || "User", email: d.email || user.email || "", phoneNumber: d.phoneNumber || "", photoUrl: d.photoUrl || user.photoURL || "", isAdmin: d.isAdmin || false, role: d.role || "viewer", createdAt: d.createdAt || 0 });
            } catch { message.error("Could not load profile"); }
            setLoading(false);
        })();
    }, [user]);

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            return;
        }

        const q = query(
            collection(db, "notifications"),
            where("userId", "==", user.uid),
            orderBy("timestamp", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as INotification));
            setNotifications(data);
        });

        return () => unsubscribe();
    }, [user]);

    const markAsRead = async (id: string) => {
        try {
            await updateDoc(doc(db, "notifications", id), { isRead: true });
        } catch (error) {
            message.error("Failed to mark as read");
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await deleteDoc(doc(db, "notifications", id));
            message.success("Notification deleted");
        } catch (error) {
            message.error("Failed to delete notification");
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
            message.success("Profile updated!");
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
            if (data.secure_url) { await updateDoc(doc(db, "users", user.uid), { photoUrl: data.secure_url }); setProfile((p) => p ? { ...p, photoUrl: data.secure_url } : null); message.success("Photo updated!"); }
        } catch { message.error("Upload failed"); }
    };

    if (loading) return <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}><div style={{ textAlign: "center", padding: 100 }}><Spin size="large" /></div></ShopLayout>;

    return (
        <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
            <div style={{ maxWidth: 600, margin: "0 auto" }}>
                <Title level={2}>My Profile</Title>
                <Card style={{ borderRadius: 16, textAlign: "center" }}>
                    <div style={{ position: "relative", display: "inline-block" }}>
                        <Avatar size={100} src={profile?.photoUrl} icon={!profile?.photoUrl ? <UserOutlined /> : undefined} style={{ background: "linear-gradient(135deg, #FF006E, #8338EC)", marginBottom: 16, fontSize: 36 }}>{!profile?.photoUrl && profile?.displayName?.charAt(0)?.toUpperCase()}</Avatar>
                        <Upload showUploadList={false} accept="image/*" customRequest={({ file }) => handlePhotoUpload(file as File)}>
                            <div style={{ position: "absolute", bottom: 16, right: 0, width: 32, height: 32, borderRadius: "50%", background: "#FF006E", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid #fff" }}><CameraOutlined style={{ color: "#fff", fontSize: 14 }} /></div>
                        </Upload>
                    </div>
                    <Title level={3}>{profile?.displayName}</Title>
                    <Text type="secondary">{profile?.email}</Text>
                    {profile?.isAdmin && <div style={{ marginTop: 8 }}><Tag color="red">{profile.role === "super_admin" ? "Super Admin" : profile.role === "product_manager" ? "Product Manager" : profile.role === "order_manager" ? "Order Manager" : profile.role === "support_agent" ? "Support Agent" : "Admin"}</Tag></div>}
                    <Descriptions bordered column={1} style={{ marginTop: 24, textAlign: "left" }}>
                        <Descriptions.Item label={<><MailOutlined /> Email</>}>{profile?.email}</Descriptions.Item>
                        <Descriptions.Item label={<><PhoneOutlined /> Phone</>}>{profile?.phoneNumber || "Not provided"}</Descriptions.Item>
                        <Descriptions.Item label={<><CalendarOutlined /> Member Since</>}>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "Unknown"}</Descriptions.Item>
                    </Descriptions>
                    <Button type="primary" icon={<EditOutlined />} style={{ marginTop: 24, background: "#FF006E", border: "none", borderRadius: 8, height: 40 }} onClick={handleEdit}>Edit Profile</Button>
                </Card>

                <Title level={3} style={{ marginTop: 40 }}>Notifications</Title>
                <Card style={{ borderRadius: 16 }}>
                    <Space direction="vertical" style={{ width: "100%" }} size={16}>
                        {notifications.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "20px 0" }}>
                                <Text type="secondary">No notifications yet</Text>
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
                                        alignItems: "flex-start"
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <Space align="center">
                                            <Text strong={!n.isRead}>{n.title}</Text>
                                            {!n.isRead && <Tag color="#FF006E">New</Tag>}
                                            <Tag color={n.type === "ORDER" ? "blue" : n.type === "PROMO" ? "green" : "default"}>{n.type}</Tag>
                                        </Space>
                                        <div style={{ marginTop: 4 }}>
                                            <Text type="secondary">{n.message}</Text>
                                        </div>
                                        <div style={{ marginTop: 8 }}>
                                            <Text style={{ fontSize: 12, color: "#999" }}>
                                                {new Date(n.createdAt).toLocaleString()}
                                            </Text>
                                        </div>
                                    </div>
                                    <Space>
                                        {!n.isRead && (
                                            <Button size="small" onClick={() => markAsRead(n.id)}>Mark as read</Button>
                                        )}
                                        <Button
                                            size="small"
                                            danger
                                            type="text"
                                            icon={<DeleteOutlined />}
                                            onClick={() => deleteNotification(n.id)}
                                        />
                                    </Space>
                                </div>
                            ))
                        )}
                    </Space>
                </Card>
            </div>
            <Modal title="Edit Profile" open={editModalOpen} onCancel={() => setEditModalOpen(false)} footer={null} width={500}>
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item name="displayName" label="Full Name" rules={[{ required: true }]}><Input size="large" /></Form.Item>
                    <Form.Item name="phoneNumber" label="Phone Number"><Input size="large" /></Form.Item>
                    <Form.Item label="Email"><Input value={profile?.email} disabled size="large" /></Form.Item>
                    <Space style={{ width: "100%", justifyContent: "flex-end" }}><Button onClick={() => setEditModalOpen(false)}>Cancel</Button><Button type="primary" htmlType="submit" loading={saving} style={{ background: "#FF006E", border: "none" }}>Save Changes</Button></Space>
                </Form>
            </Modal>
        </ShopLayout>
    );
};