import React, { useState, useEffect } from "react";
import { Typography, Card, Descriptions, Button, Avatar, Space, message, Spin, Tag, Modal, Form, Input, Upload } from "antd";
import { UserOutlined, EditOutlined, MailOutlined, PhoneOutlined, CalendarOutlined, CameraOutlined } from "@ant-design/icons";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { ShopLayout } from "./ShopLayout";
import { useCart } from "../../contexts/CartContext";

const { Title, Text } = Typography;

interface UserProfile { displayName: string; email: string; phoneNumber: string; photoUrl: string; isAdmin: boolean; role: string; createdAt: number; }

export const ProfilePage: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [profile, setProfile] = useState<UserProfile | null>(null);
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

    const handleEdit = () => { form.setFieldsValue({ displayName: profile?.displayName, phoneNumber: profile?.phoneNumber }); setEditModalOpen(true); };

    const handleSave = async (values: any) => {
        if (!user) return;
        setSaving(true);
        try { await updateDoc(doc(db, "users", user.uid), { displayName: values.displayName, phoneNumber: values.phoneNumber || "", updatedAt: Date.now() }); setProfile((p) => p ? { ...p, displayName: values.displayName, phoneNumber: values.phoneNumber } : null); message.success("Profile updated!"); setEditModalOpen(false); }
        catch (e: any) { message.error(e.message); }
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