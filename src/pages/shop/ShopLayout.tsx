import React, { useState } from "react";
import {
    Layout, Input, Badge, Space, Typography, Button, Drawer, List, Image, message,
    Dropdown, Avatar, Popover, List as AntdList, Tooltip
} from "antd";
import {
    ShoppingCartOutlined, SearchOutlined, ShoppingOutlined, DeleteOutlined,
    UserOutlined, LogoutOutlined, OrderedListOutlined, DashboardOutlined,
    ProfileOutlined, SunOutlined, MoonOutlined, BellOutlined, AreaChartOutlined,
    HeartOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router";
import { auth, db } from "../../firebase";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, collection, query, where, orderBy, limit, onSnapshot, updateDoc, writeBatch, deleteDoc } from "firebase/firestore";
import { useCustomerAuth } from "../../contexts/CustomerAuthContext";
import { useCart } from "../../contexts/CartContext";
import { useWishlist } from "../../contexts/WishlistContext";
import { ColorModeContext } from "../../contexts/color-mode";
import { useLanguage } from "../../contexts/LanguageContext";
import { INotification } from "../../interfaces";
import logo from "../../images/logo.webp";
import { AuthModal } from "../../components/shop/AuthModal";
import { LiveChat } from "../../components/shop/LiveChat";
import { LiveChartPopup } from "../../components/shop/LiveChartPopup";


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
    const { language, setLanguage, t } = useLanguage();
    const [cartOpen, setCartOpen] = useState(false);
    const [user, setUser] = useState<User | null>(auth.currentUser);
    const [notifications, setNotifications] = useState<INotification[]>([]);
    const { cart, removeFromCart, updateQuantity, cartCount, cartTotal } = useCart();
    const { favorites } = useWishlist();
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const { user: customerUser, logout: customerLogout } = useCustomerAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [chartVisible, setChartVisible] = useState(false);

    // Check if user is admin
    React.useEffect(() => {
        const checkAdminStatus = async () => {
            const currentUser = user || customerUser;
            if (!currentUser) {
                setIsAdmin(false);
                return;
            }
            try {
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                if (userDoc.exists()) {
                    setIsAdmin(userDoc.data()?.isAdmin === true);
                } else {
                    setIsAdmin(false);
                }
            } catch {
                setIsAdmin(false);
            }
        };
        checkAdminStatus();
    }, [user, customerUser]);
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
        message.success(t.header.loggedOut);
        navigate("/shop");
    };

    const profileMenuItems = [
        // Only show Dashboard for admin users
        ...(isAdmin ? [{
            key: "dashboard",
            icon: <DashboardOutlined />,
            label: t.header.dashboard,
            onClick: () => {
                window.location.hash = "#/admin";
            },
        }] : []),
        {
            key: "orders",
            icon: <OrderedListOutlined />,
            label: t.header.myOrders,
            onClick: () => navigate("/shop/orders"),
        },
        {
            key: "wishlist",
            icon: <HeartOutlined />,
            label: t.header.wishlist,
            onClick: () => navigate("/shop/wishlist"),
        },
        {
            key: "profile",
            icon: <ProfileOutlined />,
            label: t.header.myProfile,
            onClick: () => navigate("/shop/profile"),
        },
        { type: "divider" as const },
        {
            key: "logout",
            icon: <LogoutOutlined />,
            label: t.header.logout,
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
                            placeholder={t.header.search}
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
                        onClick={() => setLanguage(language === "en" ? "km" : "en")}
                        style={{
                            height: 44,
                            width: 44,
                            fontWeight: 700,
                            fontSize: 14,
                            color: isDark ? "#fff" : "#333",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "50%",
                        }}
                    >
                        {language === "en" ? "ខ្មែរ" : "EN"}
                    </Button>

                    <Button
                        type="text"
                        shape="circle"
                        icon={isDark ? <SunOutlined style={{ color: "#FFBE0B", fontSize: 22 }} /> : <MoonOutlined style={{ color: "#333", fontSize: 22 }} />}
                        onClick={() => setMode(isDark ? "light" : "dark")}
                        style={{ height: 44, width: 44 }}
                    />

                    {isAdmin && (
                        <Tooltip title={t.header.chartsTooltip}>
                            <Button
                                type="text"
                                shape="circle"
                                icon={<AreaChartOutlined style={{ color: "#FF006E", fontSize: 24 }} />}
                                onClick={() => setChartVisible(true)}
                                style={{ height: 44, width: 44 }}
                            />
                        </Tooltip>
                    )}

                    <Tooltip title={t.header.wishlist}>
                        <Badge count={favorites.size} showZero offset={[-2, 2]} color="#FF006E">
                            <HeartOutlined
                                style={{ fontSize: 26, cursor: "pointer", color: isDark ? "#fff" : "#333" }}
                                onClick={() => navigate("/shop/wishlist")}
                            />
                        </Badge>
                    </Tooltip>

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
                                    <Text strong>{t.notifications.title}</Text>
                                    {unreadCount > 0 && (
                                        <Button type="link" size="small" onClick={markAllAsRead} style={{ fontSize: 12, padding: 0 }}>
                                            {t.notifications.markAllAsRead}
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
                                        {t.notifications.viewAll}
                                    </Button>
                                </div>
                            }
                        >
                            <Badge count={unreadCount} overflowCount={9} color="#FF006E">
                                <BellOutlined style={{ fontSize: 24, cursor: "pointer", color: isDark ? "#fff" : "#333" }} />
                            </Badge>
                        </Popover>
                    )}

                    {/* Replace the existing user/login section in the header */}
                    {user || customerUser ? (
                        <Dropdown menu={{ items: profileMenuItems }} placement="bottomRight" trigger={["click"]} arrow>
                            <Space style={{ cursor: "pointer" }}>
                                <Avatar
                                    src={user?.photoURL || customerUser?.photoURL}
                                    size={44}
                                    icon={<UserOutlined />}
                                    style={{
                                        background: "linear-gradient(135deg, #FF006E, #8338EC)",
                                        border: `2px solid ${isDark ? "#444" : "#fff"}`,
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                    }}
                                />
                            </Space>
                        </Dropdown>
                    ) : (
                        <Button
                            type="primary"
                            onClick={() => setAuthModalOpen(true)}
                            size="large"
                            style={{
                                background: "linear-gradient(135deg, #FF006E, #8338EC)",
                                border: "none", borderRadius: 14, height: 46, fontWeight: 700,
                                padding: "0 28px", boxShadow: "0 6px 15px rgba(255, 0, 110, 0.3)",
                            }}
                            icon={<UserOutlined />}
                        >
                            {t.header.login}
                        </Button>
                    )}

                    {/* Auth Modal */}
                    <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />

                </Space>
            </Header>

            <Content style={{ padding: "40px 24px" }}>
                <div style={{ maxWidth: 1300, margin: "0 auto" }}>
                    {children}
                </div>
            </Content>

            <Footer style={{
                background: isDark ? "#0d0d0d" : "#1a1a2e",
                color: isDark ? "#ccc" : "#e0e0e0",
                padding: "0",
                borderTop: isDark ? "1px solid #222" : "1px solid #2a2a4a",
            }}>
                {/* Main Footer Content */}
                <div style={{
                    maxWidth: 1300,
                    margin: "0 auto",
                    padding: "60px 24px 40px",
                    display: "grid",
                    gridTemplateColumns: window.innerWidth > 768 ? "1.5fr 1fr 1fr 1.2fr" : "1fr",
                    gap: 40,
                }}>
                    {/* Column 1: Brand */}
                    <div>
                        <Space align="center" size={12} style={{ marginBottom: 20 }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: 14,
                                background: "linear-gradient(135deg, #FF006E 0%, #8338EC 100%)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "0 8px 16px rgba(255, 0, 110, 0.2)",
                            }}>
                                <img src={logo} alt="JongTinh" style={{ width: 32, height: 32, filter: "brightness(0) invert(1)" }} />
                            </div>
                            <div>
                                <Title level={3} style={{ margin: 0, color: "#fff", fontWeight: 800, letterSpacing: -1, fontSize: 24 }}>
                                    JONGTINH
                                </Title>
                                <Text style={{ fontSize: 11, color: "#999", letterSpacing: 3, textTransform: "uppercase" }}>
                                    ចង់ទិញ
                                </Text>
                            </div>
                        </Space>

                        <Text style={{ color: isDark ? "#aaa" : "#ccc", fontSize: 14, lineHeight: 1.8, display: "block", marginBottom: 24 }}>
                            {t.footer.description}
                        </Text>

                        {/* Social Media Icons */}
                        <Space size={12}>
                            <a href="https://t.me/jongtinh" target="_blank" rel="noopener noreferrer"
                                style={{
                                    width: 42, height: 42, borderRadius: 12,
                                    background: "linear-gradient(135deg, #0088cc, #00a8e8)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    transition: "all 0.3s ease", cursor: "pointer",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,136,204,0.3)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.66-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.41-.88.03-.24.37-.49 1.02-.74 3.98-1.73 6.63-2.87 7.95-3.43 3.79-1.58 4.57-1.85 5.08-1.86.11 0 .37.03.54.17.14.12.18.28.2.45.02.16.03.38.01.55z"/>
                                </svg>
                            </a>

                            <a href="https://facebook.com/jongtinh" target="_blank" rel="noopener noreferrer"
                                style={{
                                    width: 42, height: 42, borderRadius: 12,
                                    background: "linear-gradient(135deg, #1877f2, #3b5998)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    transition: "all 0.3s ease", cursor: "pointer",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(24,119,242,0.3)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                            </a>

                            <a href="https://tiktok.com/@jongtinh" target="_blank" rel="noopener noreferrer"
                                style={{
                                    width: 42, height: 42, borderRadius: 12,
                                    background: "linear-gradient(135deg, #000000, #333333)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    transition: "all 0.3s ease", cursor: "pointer",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.3)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                                </svg>
                            </a>
                        </Space>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div>
                        <Title level={5} style={{ color: "#fff", marginBottom: 20, fontWeight: 700, fontSize: 16 }}>
                            {t.footer.quickLinks}
                        </Title>
                        <Space direction="vertical" size={12}>
                            <a href="#/shop" style={{ color: isDark ? "#aaa" : "#ccc", fontSize: 14, textDecoration: "none", transition: "color 0.3s" }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = "#FF006E"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = isDark ? "#aaa" : "#ccc"; }}
                            >{t.footer.home}</a>
                            <a href="#/shop/orders" style={{ color: isDark ? "#aaa" : "#ccc", fontSize: 14, textDecoration: "none", transition: "color 0.3s" }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = "#FF006E"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = isDark ? "#aaa" : "#ccc"; }}
                            >{t.footer.orders}</a>
                            <a href="#/shop/wishlist" style={{ color: isDark ? "#aaa" : "#ccc", fontSize: 14, textDecoration: "none", transition: "color 0.3s" }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = "#FF006E"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = isDark ? "#aaa" : "#ccc"; }}
                            >{t.footer.wishlist}</a>
                            <a href="#/shop/cart" style={{ color: isDark ? "#aaa" : "#ccc", fontSize: 14, textDecoration: "none", transition: "color 0.3s" }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = "#FF006E"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = isDark ? "#aaa" : "#ccc"; }}
                            >{t.footer.cart}</a>
                            <a href="#/shop/profile" style={{ color: isDark ? "#aaa" : "#ccc", fontSize: 14, textDecoration: "none", transition: "color 0.3s" }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = "#FF006E"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = isDark ? "#aaa" : "#ccc"; }}
                            >{t.footer.profile}</a>
                            <a href="#/shop/faq" style={{ color: isDark ? "#aaa" : "#ccc", fontSize: 14, textDecoration: "none", transition: "color 0.3s" }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = "#FF006E"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = isDark ? "#aaa" : "#ccc"; }}
                            >{t.footer.faq}</a>
                            <a href="#/shop/faq" style={{ color: isDark ? "#aaa" : "#ccc", fontSize: 14, textDecoration: "none", transition: "color 0.3s" }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = "#FF006E"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = isDark ? "#aaa" : "#ccc"; }}
                            >{t.footer.about}</a>
                            <a href="#/shop/profile" style={{ color: isDark ? "#aaa" : "#ccc", fontSize: 14, textDecoration: "none", transition: "color 0.3s" }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = "#FF006E"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = isDark ? "#aaa" : "#ccc"; }}
                            >{t.footer.contact}</a>
                        </Space>
                    </div>

                    {/* Column 3: Business Hours */}
                    <div>
                        <Title level={5} style={{ color: "#fff", marginBottom: 20, fontWeight: 700, fontSize: 16 }}>
                            {t.footer.businessHours}
                        </Title>
                        <Space direction="vertical" size={10}>
                            <div>
                                <Text style={{ color: "#FF006E", fontSize: 13, fontWeight: 600 }}>{t.footer.monFri}</Text>
                                <br />
                                <Text style={{ color: isDark ? "#aaa" : "#ccc", fontSize: 14 }}>{t.footer.monFriTime}</Text>
                            </div>
                            <div>
                                <Text style={{ color: "#FF006E", fontSize: 13, fontWeight: 600 }}>{t.footer.saturday}</Text>
                                <br />
                                <Text style={{ color: isDark ? "#aaa" : "#ccc", fontSize: 14 }}>{t.footer.satTime}</Text>
                            </div>
                            <div>
                                <Text style={{ color: "#FF006E", fontSize: 13, fontWeight: 600 }}>{t.footer.sunday}</Text>
                                <br />
                                <Text style={{ color: isDark ? "#aaa" : "#ccc", fontSize: 14 }}>{t.footer.closed}</Text>
                            </div>
                        </Space>
                    </div>

                    {/* Column 4: Contact Info */}
                    <div>
                        <Title level={5} style={{ color: "#fff", marginBottom: 20, fontWeight: 700, fontSize: 16 }}>
                            {t.footer.contactUs}
                        </Title>
                        <Space direction="vertical" size={16} style={{ width: "100%" }}>
                            <div style={{ display: "flex", gap: 12 }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                    background: "rgba(255,0,110,0.15)", display: "flex",
                                    alignItems: "center", justifyContent: "center",
                                }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF006E">
                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                    </svg>
                                </div>
                                <div>
                                    <Text style={{ color: isDark ? "#aaa" : "#ccc", fontSize: 13, display: "block" }}>
                                        {t.footer.addressLine1}
                                    </Text>
                                    <Text style={{ color: isDark ? "#aaa" : "#ccc", fontSize: 13, display: "block" }}>
                                        {t.footer.addressLine2}
                                    </Text>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: 12 }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                    background: "rgba(255,0,110,0.15)", display: "flex",
                                    alignItems: "center", justifyContent: "center",
                                }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF006E">
                                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                                    </svg>
                                </div>
                                <div>
                                    <Text style={{ color: isDark ? "#aaa" : "#ccc", fontSize: 13, display: "block" }}>
                                        +855 12 345 678
                                    </Text>
                                    <Text style={{ color: isDark ? "#aaa" : "#ccc", fontSize: 13, display: "block" }}>
                                        +855 98 765 432
                                    </Text>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: 12 }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                    background: "rgba(255,0,110,0.15)", display: "flex",
                                    alignItems: "center", justifyContent: "center",
                                }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF006E">
                                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                    </svg>
                                </div>
                                <div>
                                    <Text style={{ color: isDark ? "#aaa" : "#ccc", fontSize: 13, display: "block" }}>
                                        support@jongtinh.com
                                    </Text>
                                    <Text style={{ color: isDark ? "#aaa" : "#ccc", fontSize: 13, display: "block" }}>
                                        info@jongtinh.com
                                    </Text>
                                </div>
                            </div>
                        </Space>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div style={{
                    borderTop: isDark ? "1px solid #222" : "1px solid #2a2a4a",
                    padding: "20px 24px",
                    textAlign: "center",
                }}>
                    <div style={{ maxWidth: 1300, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                        <Text style={{ color: isDark ? "#777" : "#888", fontSize: 13 }}>
                            © {new Date().getFullYear()} <span style={{ color: "#FF006E", fontWeight: 600 }}>JongTinh</span> (ចង់ទិញ). {t.footer.rights}
                        </Text>
                        <Space size={24}>
                            <a href="#" style={{ color: isDark ? "#777" : "#888", fontSize: 13, textDecoration: "none" }}>{t.footer.privacy}</a>
                            <a href="#" style={{ color: isDark ? "#777" : "#888", fontSize: 13, textDecoration: "none" }}>{t.footer.terms}</a>
                            <a href="#" style={{ color: isDark ? "#777" : "#888", fontSize: 13, textDecoration: "none" }}>{t.footer.refund}</a>
                        </Space>
                    </div>
                </div>
            </Footer>

            <Drawer
                title={
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <ShoppingCartOutlined style={{ color: "#FF006E" }} />
                        <span>{t.cart.title}</span>
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
                        <Title level={4}>{t.cart.empty}</Title>
                        <Text type="secondary" style={{ display: "block", marginBottom: 32 }}>
                            {t.cart.empty}
                        </Text>
                        <Button
                            type="primary"
                            size="large"
                            onClick={() => setCartOpen(false)}
                            style={{ background: "#FF006E", borderRadius: 12, border: "none", height: 48, padding: "0 32px" }}
                        >
                            {t.cart.startShopping}
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
                                                    {item.product.selectedSize && (
                                                        <Text style={{ fontSize: 12, color: "#FF006E", display: "block" }}>{t.product.size}: {item.product.selectedSize}</Text>
                                                    )}
                                                    {item.product.selectedColor && (
                                                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                                                            <div style={{
                                                                width: 14, height: 14, borderRadius: "50%",
                                                                backgroundColor: typeof item.product.selectedColor === "string"
                                                                    ? item.product.selectedColor
                                                                    : item.product.selectedColor?.hex || "#ccc",
                                                                border: "1px solid #d9d9d9"
                                                            }} />
                                                            <Text style={{ fontSize: 12, color: "#666" }}>
                                                                {typeof item.product.selectedColor === "string"
                                                                    ? item.product.selectedColor
                                                                    : item.product.selectedColor?.name || ""}
                                                            </Text>
                                                        </div>
                                                    )}
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        danger
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => removeFromCart(item.product.id, item.product.selectedColor, item.product.selectedSize)}
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
                                                            onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.product.selectedColor, item.product.selectedSize)}
                                                            style={{ padding: 0, width: 24 }}
                                                        ><b>-</b></Button>
                                                        <Text strong style={{ minWidth: 20, textAlign: "center" }}>{item.quantity}</Text>
                                                        <Button
                                                            type="text"
                                                            size="small"
                                                            onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.product.selectedColor, item.product.selectedSize)}
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
                                <Text type="secondary">{t.cart.subtotal}</Text>
                                <Text strong>${cartTotal.toFixed(2)}</Text>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                                <Title level={4} style={{ margin: 0 }}>{t.cart.total}</Title>
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
                                    {t.cart.checkout}
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
                                    {t.cart.viewCart}
                                </Button>
                            </Space>
                        </div>
                    </>
                )}
            </Drawer>

            <LiveChat isDark={isDark} />
            <LiveChartPopup
                visible={chartVisible}
                onClose={() => setChartVisible(false)}
                isDark={isDark}
            />
        </Layout>
    );
};