import React, { useState, useEffect } from "react";
import { Typography, Card, Descriptions, Button, Avatar, Space, message, Spin, Tag, Modal, Form, Input, Upload } from "antd";
import {
    UserOutlined, EditOutlined, MailOutlined, PhoneOutlined, CalendarOutlined,
    CameraOutlined, InboxOutlined
} from "@ant-design/icons";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { IProduct } from "../../interfaces";
import { ShopLayout } from "./ShopLayout";

const { Title, Text } = Typography;
const { Dragger } = Upload;

interface CartItem {
    product: IProduct;
    quantity: number;
}

interface ProfilePageProps {
    cart: CartItem[];
    setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

interface UserProfile {
    displayName: string;
    email: string;
    phoneNumber: string;
    photoUrl: string;
    isAdmin: boolean;
    role: string;
    createdAt: number;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ cart, setCart }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [form] = Form.useForm();
    const user = auth.currentUser;

    // Fetch profile
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) { setLoading(false); return; }
            try {
                const docRef = doc(db, "users", user.uid);
                const snapshot = await getDoc(docRef);
                if (snapshot.exists()) {
                    const data = snapshot.data();
                    setProfile({
                        displayName: data.displayName || user.displayName || "User",
                        email: data.email || user.email || "",
                        phoneNumber: data.phoneNumber || user.phoneNumber || "",
                        photoUrl: data.photoUrl || user.photoURL || "",
                        isAdmin: data.isAdmin || false,
                        role: data.role || "viewer",
                        createdAt: data.createdAt || 0,
                    });
                } else {
                    setProfile({
                        displayName: user.displayName || "User",
                        email: user.email || "",
                        phoneNumber: user.phoneNumber || "",
                        photoUrl: user.photoURL || "",
                        isAdmin: false,
                        role: "viewer",
                        createdAt: 0,
                    });
                }
            } catch (error) {
                console.error("Failed to fetch profile:", error);
            }
            setLoading(false);
        };
        fetchProfile();
    }, [user]);

    // Open edit modal
    const handleEdit = () => {
        form.setFieldsValue({
            displayName: profile?.displayName,
            phoneNumber: profile?.phoneNumber,
        });
        setEditModalOpen(true);
    };

    // Upload image to Cloudinary
    const uploadImage = async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "jongtinh_upload");
            formData.append("folder", "profiles");

            fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: "POST",
                body: formData,
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.secure_url) resolve(data.secure_url);
                    else reject(new Error("Upload failed"));
                })
                .catch(reject);
        });
    };

    // Save profile
    const handleSave = async (values: any) => {
        if (!user) return;
        setSaving(true);
        try {
            const updates: any = {
                displayName: values.displayName,
                phoneNumber: values.phoneNumber || "",
                updatedAt: Date.now(),
            };
            await updateDoc(doc(db, "users", user.uid), updates);

            // Update local state
            setProfile((prev) =>
                prev
                    ? {
                          ...prev,
                          displayName: values.displayName,
                          phoneNumber: values.phoneNumber || "",
                      }
                    : null
            );

            message.success("Profile updated successfully!");
            setEditModalOpen(false);
        } catch (error: any) {
            message.error("Failed to update profile: " + error.message);
        }
        setSaving(false);
    };

    // Handle photo upload
    const handlePhotoUpload = async (file: File) => {
        if (!user) return;
        setUploading(true);
        try {
            const url = await uploadImage(file);

            // Update Firestore
            await updateDoc(doc(db, "users", user.uid), {
                photoUrl: url,
                updatedAt: Date.now(),
            });

            // Update local state
            setProfile((prev) => (prev ? { ...prev, photoUrl: url } : null));
            message.success("Profile photo updated!");
        } catch (error: any) {
            message.error("Failed to upload photo: " + error.message);
        }
        setUploading(false);
    };

    const getRoleLabel = (role: string): string => {
        const labels: Record<string, string> = {
            super_admin: "Super Admin",
            product_manager: "Product Manager",
            order_manager: "Order Manager",
            support_agent: "Support Agent",
            viewer: "Customer",
        };
        return labels[role] || role;
    };

    if (loading) {
        return (
            <ShopLayout cart={cart} setCart={setCart} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
                <div style={{ textAlign: "center", padding: 100 }}><Spin size="large" /></div>
            </ShopLayout>
        );
    }

    return (
        <ShopLayout cart={cart} setCart={setCart} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
            <div style={{ maxWidth: 600, margin: "0 auto" }}>
                <Title level={2}>My Profile</Title>

                <Card style={{ borderRadius: 16, textAlign: "center" }}>
                    {/* Avatar with upload overlay */}
                    <div style={{ position: "relative", display: "inline-block" }}>
                        <Avatar
                            size={100}
                            src={profile?.photoUrl || undefined}
                            icon={!profile?.photoUrl ? <UserOutlined /> : undefined}
                            style={{
                                background: "linear-gradient(135deg, #FF006E, #8338EC)",
                                marginBottom: 16,
                                fontSize: 36,
                            }}
                        >
                            {!profile?.photoUrl && profile?.displayName?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        {/* Upload button overlay */}
                        <Upload
                            showUploadList={false}
                            accept="image/*"
                            customRequest={({ file }) => handlePhotoUpload(file as File)}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    bottom: 16,
                                    right: 0,
                                    width: 32,
                                    height: 32,
                                    borderRadius: "50%",
                                    background: "#FF006E",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    border: "2px solid #fff",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                }}
                            >
                                <CameraOutlined style={{ color: "#fff", fontSize: 14 }} />
                            </div>
                        </Upload>
                    </div>

                    <Title level={3} style={{ marginBottom: 4 }}>
                        {profile?.displayName || "User"}
                    </Title>
                    <Text type="secondary">{profile?.email}</Text>

                    {profile?.isAdmin && (
                        <div style={{ marginTop: 8 }}>
                            <Tag color="red">{getRoleLabel(profile?.role || "")}</Tag>
                        </div>
                    )}

                    <Descriptions bordered column={1} style={{ marginTop: 24, textAlign: "left" }}>
                        <Descriptions.Item label={<><MailOutlined /> Email</>}>
                            {profile?.email || "Not provided"}
                        </Descriptions.Item>
                        <Descriptions.Item label={<><PhoneOutlined /> Phone</>}>
                            {profile?.phoneNumber || "Not provided"}
                        </Descriptions.Item>
                        <Descriptions.Item label={<><CalendarOutlined /> Member Since</>}>
                            {profile?.createdAt
                                ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                                      year: "numeric", month: "long", day: "numeric",
                                  })
                                : "Unknown"}
                        </Descriptions.Item>
                    </Descriptions>

                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        style={{
                            marginTop: 24,
                            background: "#FF006E",
                            border: "none",
                            borderRadius: 8,
                            height: 40,
                        }}
                        onClick={handleEdit}
                    >
                        Edit Profile
                    </Button>
                </Card>
            </div>

            {/* ═══════ EDIT PROFILE MODAL ═══════ */}
            <Modal
                title="Edit Profile"
                open={editModalOpen}
                onCancel={() => setEditModalOpen(false)}
                footer={null}
                width={500}
            >
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item
                        name="displayName"
                        label="Full Name"
                        rules={[{ required: true, message: "Please enter your name" }]}
                    >
                        <Input placeholder="Your full name" size="large" />
                    </Form.Item>

                    <Form.Item name="phoneNumber" label="Phone Number">
                        <Input placeholder="Your phone number" size="large" />
                    </Form.Item>

                    <Form.Item label="Email (cannot be changed)">
                        <Input value={profile?.email} disabled size="large" />
                    </Form.Item>

                    <Space style={{ width: "100%", justifyContent: "flex-end" }}>
                        <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={saving}
                            style={{ background: "#FF006E", border: "none", borderRadius: 8 }}
                        >
                            Save Changes
                        </Button>
                    </Space>
                </Form>
            </Modal>
        </ShopLayout>
    );
};