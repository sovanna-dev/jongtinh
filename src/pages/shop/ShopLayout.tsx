import React, { useState } from "react";
import { Layout, Input, Badge, Space, Typography, Button, Drawer, List, Image, message, Dropdown, Avatar } from "antd";
import {
    ShoppingCartOutlined, SearchOutlined, ShoppingOutlined, DeleteOutlined,
    UserOutlined, LogoutOutlined, OrderedListOutlined, DashboardOutlined,
    ProfileOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
import { useCart } from "../../contexts/CartContext";

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

interface ShopLayoutProps {
    children: React.ReactNode;
    searchQuery: string;
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    onSearch: () => void;
}

export const ShopLayout: React.FC<ShopLayoutProps> = ({ children, searchQuery, setSearchQuery, onSearch }) => {
    const navigate = useNavigate();
    const [cartOpen, setCartOpen] = useState(false);
    const user = auth.currentUser;
    const { cart, removeFromCart, updateQuantity, cartCount, cartTotal } = useCart();

    const handleLogout = async () => {
        await signOut(auth);
        message.success("Logged out");
        navigate("/shop");
    };

    const profileMenuItems = [
        {
            key: "dashboard",
            icon: <DashboardOutlined />,
            label: "Dashboard",
            onClick: () => navigate("/admin"),
        },
        {
            key: "orders",
            icon: <OrderedListOutlined />,
            label: "My Orders",
            onClick: () => navigate("/shop/orders"),
        },
        {
            key: "profile",
            icon: <ProfileOutlined />,
            label: "My Profile",
            onClick: () => navigate("/shop/profile"),
        },
        { type: "divider" as const },
        {
            key: "logout",
            icon: <LogoutOutlined />,
            label: "Logout",
            danger: true,
            onClick: handleLogout,
        },
    ];

    return (
        <Layout style={{ minHeight: "100vh", background: "#F5F5F5" }}>
            <Header style={{
                background: "#fff", padding: "0 24px", display: "flex",
                alignItems: "center", justifyContent: "space-between",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)", position: "sticky",
                top: 0, zIndex: 100, height: 72,
            }}>
                <Space style={{ cursor: "pointer" }} onClick={() => navigate("/shop")}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: "linear-gradient(135deg, #FF006E, #8338EC)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <ShoppingOutlined style={{ fontSize: 22, color: "#fff" }} />
                    </div>
                    <div>
                        <Title level={4} style={{ margin: 0, color: "#FF006E", lineHeight: 1.2 }}>JONGTINH</Title>
                        <Text style={{ fontSize: 10, color: "#999", letterSpacing: 2 }}>ចង់ទិញ</Text>
                    </div>
                </Space>

                <Input.Search
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onSearch={onSearch}
                    style={{ maxWidth: 400, width: "100%", margin: "0 24px" }}
                    size="large"
                    enterButton={<SearchOutlined />}
                />

                <Space size={24}>
                    <Badge count={cartCount} showZero offset={[-2, 2]} size="small">
                        <ShoppingCartOutlined
                            style={{ fontSize: 22, cursor: "pointer", color: "#333" }}
                            onClick={() => setCartOpen(true)}
                        />
                    </Badge>

                    {user ? (
                        <Dropdown menu={{ items: profileMenuItems }} placement="bottomRight" trigger={["click"]}>
                            <Space style={{ cursor: "pointer" }}>
                                <Avatar icon={<UserOutlined />}
                                    style={{ background: "linear-gradient(135deg, #FF006E, #8338EC)" }} />
                                <Text strong style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {user.displayName || user.email?.split("@")[0] || "User"}
                                </Text>
                            </Space>
                        </Dropdown>
                    ) : (
                        <Button type="primary" onClick={() => navigate("/login")}
                            style={{ background: "#FF006E", border: "none", borderRadius: 8 }}
                            icon={<UserOutlined />}>Login</Button>
                    )}
                </Space>
            </Header>

            <Content style={{ padding: "24px" }}>{children}</Content>

            <Footer style={{ textAlign: "center", background: "#fff", borderTop: "1px solid #f0f0f0" }}>
                <Space split={<span style={{ color: "#d9d9d9" }}>|</span>} size={16}>
                    <a href="/shop" style={{ color: "#666" }}>Home</a>
                    <a href="/shop/orders" style={{ color: "#666" }}>My Orders</a>
                    <a href="#" style={{ color: "#666" }}>About Us</a>
                    <a href="#" style={{ color: "#666" }}>Contact</a>
                    <a href="#" style={{ color: "#666" }}>Privacy Policy</a>
                </Space>
                <br />
                <Text type="secondary" style={{ marginTop: 8, display: "block", fontSize: 12 }}>
                    © 2025 JongTinh (ចង់ទិញ). All rights reserved.
                </Text>
            </Footer>

            <Drawer
                title={`Shopping Cart (${cartCount} items)`}
                open={cartOpen}
                onClose={() => setCartOpen(false)}
                width={420}
                extra={cart.length > 0 && (
                    <Button type="primary" onClick={() => { setCartOpen(false); navigate("/shop/checkout"); }}
                        style={{ background: "#FF006E", border: "none", borderRadius: 8 }}>Checkout</Button>
                )}
            >
                {cart.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 48 }}>
                        <ShoppingCartOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />
                        <p style={{ marginTop: 16, color: "#999" }}>Your cart is empty</p>
                        <Button onClick={() => setCartOpen(false)}>Continue Shopping</Button>
                    </div>
                ) : (
                    <>
                        <List
                            dataSource={cart}
                            renderItem={(item) => {
                                const price = item.product.discountPrice ?? item.product.price;
                                return (
                                    <List.Item
                                        actions={[
                                            <Button
                                                key="remove"
                                                size="small"
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => removeFromCart(item.product.id)}
                                            />,
                                        ]}
                                    >
                                        <List.Item.Meta
                                            avatar={
                                                <Image
                                                    src={item.product.images?.[0] || "https://via.placeholder.com/60"}
                                                    width={60}
                                                    height={60}
                                                    style={{ objectFit: "cover", borderRadius: 8 }}
                                                    fallback="https://via.placeholder.com/60?text=N/A"
                                                    preview={false}
                                                />
                                            }
                                            title={item.product.name}
                                            description={
                                                <Space>
                                                    <Text style={{ color: "#FF006E", fontWeight: 600 }}>
                                                        ${price.toFixed(2)}
                                                    </Text>
                                                    <Button
                                                        size="small"
                                                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                    >
                                                        -
                                                    </Button>
                                                    <Text strong>{item.quantity}</Text>
                                                    <Button
                                                        size="small"
                                                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                        disabled={item.quantity >= (item.product.stockQuantity || 99)}
                                                    >
                                                        +
                                                    </Button>
                                                </Space>
                                            }
                                        />
                                    </List.Item>
                                );
                            }}
                        />
                        <div style={{
                            textAlign: "right",
                            marginTop: 16,
                            padding: 16,
                            borderTop: "1px solid #f0f0f0",
                        }}>
                            <Title level={4}>
                                Total: <Text style={{ color: "#FF006E" }}>${cartTotal.toFixed(2)}</Text>
                            </Title>
                            <Button
                                type="primary"
                                size="large"
                                block
                                onClick={() => { setCartOpen(false); navigate("/shop/checkout"); }}
                                style={{
                                    background: "#FF006E",
                                    border: "none",
                                    borderRadius: 8,
                                    height: 48,
                                    marginTop: 8,
                                }}
                            >
                                Proceed to Checkout
                            </Button>
                        </div>
                    </>
                )}
            </Drawer>
        </Layout>
    );
};