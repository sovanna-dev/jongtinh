import React, { useState } from "react";
import { Typography, Card, Descriptions, Button, Avatar, Space, message } from "antd";
import { UserOutlined, EditOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";
import { auth } from "../../firebase";
import { IProduct } from "../../interfaces";
import { ShopLayout } from "./ShopLayout";

const { Title, Text } = Typography;

interface CartItem {
    product: IProduct;
    quantity: number;
}

interface ProfilePageProps {
    cart: CartItem[];
    setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ cart, setCart }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const user = auth.currentUser;

    return (
        <ShopLayout cart={cart} setCart={setCart} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
            <div style={{ maxWidth: 600, margin: "0 auto" }}>
                <Title level={2}>My Profile</Title>
                <Card style={{ borderRadius: 16, textAlign: "center" }}>
                    <Avatar
                        size={100}
                        icon={<UserOutlined />}
                        style={{
                            background: "linear-gradient(135deg, #FF006E, #8338EC)",
                            marginBottom: 16,
                        }}
                    />
                    <Title level={3}>{user?.displayName || user?.email?.split("@")[0] || "User"}</Title>
                    <Text type="secondary">{user?.email}</Text>

                    <Descriptions bordered column={1} style={{ marginTop: 24, textAlign: "left" }}>
                        <Descriptions.Item label={<><MailOutlined /> Email</>}>
                            {user?.email || "Not provided"}
                        </Descriptions.Item>
                        <Descriptions.Item label={<><PhoneOutlined /> Phone</>}>
                            {user?.phoneNumber || "Not provided"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Member Since">
                            {user?.metadata?.creationTime
                                ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "long",
                                  })
                                : "Unknown"}
                        </Descriptions.Item>
                    </Descriptions>

                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        style={{ marginTop: 24, background: "#FF006E", border: "none", borderRadius: 8, height: 40 }}
                        onClick={() => message.info("Edit profile feature coming soon!")}
                    >
                        Edit Profile
                    </Button>
                </Card>
            </div>
        </ShopLayout>
    );
};