import React, { useState } from "react";
import { Layout, Input, Badge, Space, Typography, Button, Drawer, List, Image, message, Dropdown, Avatar } from "antd";
import {
    ShoppingCartOutlined, SearchOutlined, ShoppingOutlined, DeleteOutlined,
    UserOutlined, LogoutOutlined, OrderedListOutlined, DashboardOutlined,
    ProfileOutlined, SunOutlined, MoonOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router";
import { auth } from "../../firebase";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { useCart } from "../../contexts/CartContext";
import { ColorModeContext } from "../../contexts/color-mode";
import logo from "../../images/logo.webp";

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
    const { mode, setMode } = React.useContext(ColorModeContext);
    const [cartOpen, setCartOpen] = useState(false);
    const [user, setUser] = useState<User | null>(auth.currentUser);
    const { cart, removeFromCart, updateQuantity, cartCount, cartTotal } = useCart();

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const isDark = mode === "dark";

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
        <Layout style={{
            minHeight: "100vh",
            background: isDark ? "#0a0a0a" : "#f0f2f5",
            transition: "background 0.3s ease"
        }}>
            <Header style={{
                background: isDark ? "rgba(20, 20, 20, 0.9)" : "rgba(255, 255, 255, 0.9)",
                padding: "0 40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backdropFilter: "blur(20px)",
                boxShadow: isDark ? "0 4px 30px rgba(0,0,0,0.5)" : "0 4px 30px rgba(0,0,0,0.03)",
                position: "sticky",
                top: 0,
                zIndex: 100,
                height: 80,
                borderBottom: isDark ? "1px solid #333" : "1px solid #eee",
                transition: "all 0.3s ease"
            }}>
                <Space
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate("/shop")}
                    size={16}
                >
                    <div style={{
                        width: 52,
                        height: 52,
                        borderRadius: 16,
                        background: "linear-gradient(135deg, #FF006E 0%, #8338EC 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 2,
                        boxShadow: "0 8px 16px rgba(255, 0, 110, 0.2)"
                    }}>
                        <img
                            src={logo}
                            alt="SmartShop"
                            style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: 14,
                                objectFit: "contain",
                                background: "#fff"
                            }}
                        />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                        <Title level={3} style={{
                            margin: 0,
                            color: "#FF006E",
                            fontWeight: 900,
                            letterSpacing: -1.2,
                            fontSize: 26,
                            lineHeight: 1
                        }}>
                            JONGTINH
                        </Title>
                        <Text style={{
                            fontSize: 11,
                            color: isDark ? "#999" : "#666",
                            letterSpacing: 4.5,
                            fontWeight: 800,
                            textTransform: "uppercase",
                            marginTop: 2
                        }}>
                            ចង់ទិញ
                        </Text>
                    </div>
                </Space>

                <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "0 60px" }}>
                    <div style={{ position: "relative", width: "100%", maxWidth: 600 }}>
                        <Input
                            placeholder="Search for items, brands and more..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onPressEnter={onSearch}
                            prefix={<SearchOutlined style={{ color: "#FF006E", fontSize: 20, marginRight: 8 }} />}
                            style={{
                                borderRadius: 16,
                                height: 50,
                                background: isDark ? "#2a2a2a" : "#f5f5f7",
                                border: "none",
                                fontSize: 16,
                                paddingLeft: 20,
                                boxShadow: "none"
                            }}
                        />
                    </div>
                </div>

                <Space size={28}>
                    <Button
                        type="text"
                        shape="circle"
                        icon={isDark ? <SunOutlined style={{ color: "#FFBE0B", fontSize: 22 }} /> : <MoonOutlined style={{ color: "#333", fontSize: 22 }} />}
                        onClick={() => setMode(isDark ? "light" : "dark")}
                        style={{ height: 44, width: 44 }}
                    />

                    <Badge count={cartCount} showZero offset={[-2, 2]} color="#FF006E">
                        <ShoppingCartOutlined
                            style={{ fontSize: 26, cursor: "pointer", color: isDark ? "#fff" : "#333" }}
                            onClick={() => setCartOpen(true)}
                        />
                    </Badge>

                    {user ? (
                        <Dropdown menu={{ items: profileMenuItems }} placement="bottomRight" trigger={["click"]} arrow>
                            <Space style={{ cursor: "pointer" }}>
                                <Avatar
                                    src={user.photoURL}
                                    size={44}
                                    icon={<UserOutlined />}
                                    style={{
                                        background: "linear-gradient(135deg, #FF006E, #8338EC)",
                                        border: `2px solid ${isDark ? "#444" : "#fff"}`,
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                                    }}
                                />
                            </Space>
                        </Dropdown>
                    ) : (
                        <Button
                            type="primary"
                            onClick={() => navigate("/login")}
                            size="large"
                            style={{
                                background: "linear-gradient(135deg, #FF006E, #8338EC)",
                                border: "none",
                                borderRadius: 14,
                                height: 46,
                                fontWeight: 700,
                                padding: "0 28px",
                                boxShadow: "0 6px 15px rgba(255, 0, 110, 0.3)"
                            }}
                            icon={<UserOutlined />}
                        >
                            Login
                        </Button>
                    )}
                </Space>
            </Header>

            <Content style={{ padding: "40px 24px" }}>
                <div style={{ maxWidth: 1300, margin: "0 auto" }}>
                    {children}
                </div>
            </Content>

            <Footer style={{
                textAlign: "center",
                background: isDark ? "#1f1f1f" : "#fff",
                borderTop: isDark ? "1px solid #303030" : "1px solid #f0f0f0",
                padding: "32px 24px"
            }}>
                <Space split={<span style={{ color: "#d9d9d9" }}>|</span>} size={16}>
                    <a href="/shop" style={{ color: "#666" }}>Home</a>
                    <a href="/shop/orders" style={{ color: "#666" }}>My Orders</a>
                    <a href="#" style={{ color: "#666" }}>About Us</a>
                    <a href="#" style={{ color: "#666" }}>Contact</a>
                    <a href="#" style={{ color: "#666" }}>Privacy Policy</a>
                </Space>
                <br />
                <Text type="secondary" style={{ marginTop: 8, display: "block", fontSize: 12 }}>
                    © 2025 SmartShop (ចង់ទិញ). All rights reserved.
                </Text>
            </Footer>

            <Drawer
                title={
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <ShoppingCartOutlined style={{ color: "#FF006E" }} />
                        <span>My Shopping Cart</span>
                    </div>
                }
                open={cartOpen}
                onClose={() => setCartOpen(false)}
                width={window.innerWidth > 500 ? 450 : "100%"}
                styles={{
                    body: { padding: 0, display: "flex", flexDirection: "column" },
                    header: { borderBottom: "1px solid #f0f0f0" }
                }}
            >
                {cart.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "100px 24px" }}>
                        <div style={{
                            width: 120,
                            height: 120,
                            borderRadius: "50%",
                            background: "#f5f5f5",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 24px auto"
                        }}>
                            <ShoppingCartOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />
                        </div>
                        <Title level={4}>Your cart is empty</Title>
                        <Text type="secondary" style={{ display: "block", marginBottom: 32 }}>
                            Looks like you haven't added anything to your cart yet.
                        </Text>
                        <Button
                            type="primary"
                            size="large"
                            onClick={() => setCartOpen(false)}
                            style={{ background: "#FF006E", borderRadius: 12, border: "none", height: 48, padding: "0 32px" }}
                        >
                            Start Shopping
                        </Button>
                    </div>
                ) : (
                    <>
                        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px" }}>
                            <List
                                dataSource={cart}
                                split={false}
                                renderItem={(item) => {
                                    const price = item.product.discountPrice ?? item.product.price;
                                    return (
                                        <div style={{
                                            display: "flex",
                                            gap: 16,
                                            padding: "20px 0",
                                            borderBottom: "1px solid #f0f0f0"
                                        }}>
                                            <div style={{
                                                width: 80,
                                                height: 80,
                                                borderRadius: 12,
                                                overflow: "hidden",
                                                background: "#f9f9f9",
                                                flexShrink: 0
                                            }}>
                                                <Image
                                                    src={item.product.images?.[0] || "https://via.placeholder.com/80"}
                                                    width="100%"
                                                    height="100%"
                                                    style={{ objectFit: "cover" }}
                                                    fallback="https://via.placeholder.com/80?text=N/A"
                                                    preview={false}
                                                />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                                    <Text strong style={{ fontSize: 15, display: "block", width: "85%" }} ellipsis>{item.product.name}</Text>
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        danger
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => removeFromCart(item.product.id)}
                                                        style={{ marginTop: -4 }}
                                                    />
                                                </div>
                                                <Text type="secondary" style={{ fontSize: 13 }}>{item.product.category}</Text>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                                                    <Text strong style={{ color: "#FF006E", fontSize: 16 }}>
                                                        ${price.toFixed(2)}
                                                    </Text>
                                                    <div style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 12,
                                                        background: "#f5f5f5",
                                                        padding: "2px 8px",
                                                        borderRadius: 8
                                                    }}>
                                                        <Button
                                                            type="text"
                                                            size="small"
                                                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                            style={{ padding: 0, width: 24 }}
                                                        ><b>-</b></Button>
                                                        <Text strong style={{ minWidth: 20, textAlign: "center" }}>{item.quantity}</Text>
                                                        <Button
                                                            type="text"
                                                            size="small"
                                                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                            disabled={item.quantity >= (item.product.stockQuantity || 99)}
                                                            style={{ padding: 0, width: 24 }}
                                                        ><b>+</b></Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }}
                            />
                        </div>
                        <div style={{
                            padding: "24px",
                            background: isDark ? "#1f1f1f" : "#fff",
                            borderTop: "1px solid #f0f0f0",
                            boxShadow: "0 -4px 12px rgba(0,0,0,0.03)"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                <Text type="secondary">Subtotal</Text>
                                <Text strong>${cartTotal.toFixed(2)}</Text>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                                <Title level={4} style={{ margin: 0 }}>Total Amount</Title>
                                <Title level={4} style={{ margin: 0, color: "#FF006E" }}>${cartTotal.toFixed(2)}</Title>
                            </div>

                            <Space direction="vertical" style={{ width: "100%" }} size={12}>
                                <Button
                                    type="primary"
                                    size="large"
                                    block
                                    onClick={() => { setCartOpen(false); navigate("/shop/checkout"); }}
                                    style={{
                                        background: "#FF006E",
                                        border: "none",
                                        borderRadius: 14,
                                        height: 56,
                                        fontSize: 18,
                                        fontWeight: 700,
                                        boxShadow: "0 8px 16px rgba(255, 0, 110, 0.2)"
                                    }}
                                >
                                    Proceed to Checkout
                                </Button>
                                <Button
                                    type="default"
                                    size="large"
                                    block
                                    onClick={() => { setCartOpen(false); navigate("/shop/cart"); }}
                                    style={{
                                        borderRadius: 14,
                                        height: 50,
                                        fontWeight: 600
                                    }}
                                >
                                    View Full Cart
                                </Button>
                            </Space>
                        </div>
                    </>
                )}
            </Drawer>
        </Layout>
    );
};