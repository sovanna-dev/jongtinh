import React, { useState } from "react";
import {
    Layout, Input, Badge, Space, Typography, Button, Drawer, List, Image, message,
    Dropdown, Avatar, Popover, List as AntdList
} from "antd";
import {
    ShoppingCartOutlined, SearchOutlined, ShoppingOutlined, DeleteOutlined,
    UserOutlined, LogoutOutlined, OrderedListOutlined, DashboardOutlined,
    ProfileOutlined, SunOutlined, MoonOutlined, BellOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router";
import { auth, db } from "../../firebase";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, writeBatch, deleteDoc } from "firebase/firestore";
import { useCart } from "../../contexts/CartContext";
import { ColorModeContext } from "../../contexts/color-mode";
import { INotification } from "../../interfaces";
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
    const [notifications, setNotifications] = useState<INotification[]>([]);
    const { cart, removeFromCart, updateQuantity, cartCount, cartTotal } = useCart();

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    // Fetch Notifications
    React.useEffect(() => {
        if (!user) {
            setNotifications([]);
            return;
        }

        // In ShopLayout.tsx, find the notification query:
        const q = query(
            collection(db, "notifications"),
            where("userId", "==", user.uid),
            orderBy("timestamp", "desc"),  // Changed from 'createdAt'
            limit(10)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as INotification));
            setNotifications(data);
        }, (error) => {
            console.error("Notifications fetch error:", error);
        });

        return () => unsubscribe();
    }, [user]);

    const isDark = mode === "dark";
    const unreadCount = notifications.filter(n => !n.isRead).length;

    const markAsRead = async (notificationId: string) => {
        try {
            const notificationRef = doc(db, "notifications", notificationId);
            await updateDoc(notificationRef, { isRead: true });
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;
        try {
            const batch = writeBatch(db);
            notifications.forEach(n => {
                if (!n.isRead) {
                    const ref = doc(db, "notifications", n.id);
                    batch.update(ref, { isRead: true });
                }
            });
            await batch.commit();
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
        }
    };

    const deleteNotification = async (e: React.MouseEvent, notificationId: string) => {
        e.stopPropagation();
        try {
            await deleteDoc(doc(db, "notifications", notificationId));
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

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
                padding: window.innerWidth > 768 ? "0 40px" : "0 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backdropFilter: "blur(20px)",
                boxShadow: isDark ? "0 4px 30px rgba(0,0,0,0.5)" : "0 4px 30px rgba(0,0,0,0.03)",
                position: "sticky",
                top: 0,
                zIndex: 100,
                height: window.innerWidth > 768 ? 80 : 70,
                borderBottom: isDark ? "1px solid #333" : "1px solid #eee",
                transition: "all 0.3s ease"
            }}>
                <Space
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate("/shop")}
                    size={window.innerWidth > 768 ? 16 : 8}
                >
                    <div style={{
                        width: window.innerWidth > 768 ? 52 : 40,
                        height: window.innerWidth > 768 ? 52 : 40,
                        borderRadius: window.innerWidth > 768 ? 16 : 12,
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
                                borderRadius: window.innerWidth > 768 ? 14 : 10,
                                objectFit: "contain",
                                background: "#fff"
                            }}
                        />
                    </div>
                    {window.innerWidth > 480 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                            <Title level={3} style={{
                                margin: 0,
                                color: "#FF006E",
                                fontWeight: 900,
                                letterSpacing: -1.2,
                                fontSize: window.innerWidth > 768 ? 26 : 20,
                                lineHeight: 1
                            }}>
                                JONGTINH
                            </Title>
                            {window.innerWidth > 768 && (
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
                            )}
                        </div>
                    )}
                </Space>

                <div style={{
                    flex: 1,
                    display: window.innerWidth > 640 ? "flex" : "none",
                    justifyContent: "center",
                    padding: window.innerWidth > 1024 ? "0 60px" : "0 20px"
                }}>
                    <div style={{ position: "relative", width: "100%", maxWidth: 600 }}>
                        <Input
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onPressEnter={onSearch}
                            prefix={<SearchOutlined style={{ color: "#FF006E", fontSize: 20, marginRight: 8 }} />}
                            style={{
                                borderRadius: 16,
                                height: 44,
                                background: isDark ? "#2a2a2a" : "#f5f5f7",
                                border: "none",
                                fontSize: 16,
                                paddingLeft: 20,
                                boxShadow: "none"
                            }}
                        />
                    </div>
                </div>

                <Space size={window.innerWidth > 768 ? 28 : 12}>
                    {window.innerWidth <= 640 && (
                        <Button
                            type="text"
                            shape="circle"
                            icon={<SearchOutlined style={{ fontSize: 22, color: isDark ? "#fff" : "#333" }} />}
                            onClick={() => navigate("/shop/search")}
                        />
                    )}
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

                    {user && (
                        <Popover
                            placement="bottomRight"
                            title={
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                                    <Text strong>Recent Notifications</Text>
                                    {unreadCount > 0 && (
                                        <Button type="link" size="small" onClick={markAllAsRead} style={{ fontSize: 12, padding: 0 }}>
                                            Mark all as read
                                        </Button>
                                    )}
                                </div>
                            }
                            trigger="click"
                            content={
                                <div style={{ width: 320 }}>
                                    <AntdList
                                        itemLayout="horizontal"
                                        dataSource={notifications.slice(0, 5)}
                                        renderItem={item => (
                                            <AntdList.Item
                                                style={{
                                                    cursor: 'pointer',
                                                    padding: '12px',
                                                    transition: 'all 0.3s',
                                                    background: item.isRead ? 'transparent' : (isDark ? 'rgba(255, 0, 110, 0.05)' : 'rgba(255, 0, 110, 0.02)')
                                                }}
                                                onClick={() => {
                                                    if (!item.isRead) markAsRead(item.id);
                                                    navigate('/shop/profile');
                                                }}
                                                actions={[
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        danger
                                                        icon={<DeleteOutlined style={{ fontSize: 14 }} />}
                                                        onClick={(e) => deleteNotification(e, item.id)}
                                                    />
                                                ]}
                                            >
                                                <AntdList.Item.Meta
                                                    avatar={
                                                        <div style={{
                                                            width: 36, height: 36, borderRadius: '50%',
                                                            background: item.isRead ? (isDark ? '#333' : '#f5f5f5') : '#fff0f6',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                        }}>
                                                            <BellOutlined style={{ color: item.isRead ? '#999' : '#FF006E' }} />
                                                        </div>
                                                    }
                                                    title={<Text strong={!item.isRead} style={{ fontSize: 14 }}>{item.title}</Text>}
                                                    description={
                                                        <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                                                            {item.message}
                                                        </Text>
                                                    }
                                                />
                                            </AntdList.Item>
                                        )}
                                    />
                                    <Button
                                        type="link"
                                        block
                                        onClick={() => navigate('/shop/orders')}
                                        style={{ marginTop: 8, borderTop: '1px solid #f0f0f0', borderRadius: 0 }}
                                    >
                                        View All Notifications
                                    </Button>
                                </div>
                            }
                        >
                            <Badge count={unreadCount} overflowCount={9} color="#FF006E">
                                <BellOutlined style={{ fontSize: 24, cursor: "pointer", color: isDark ? "#fff" : "#333" }} />
                            </Badge>
                        </Popover>
                    )}

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