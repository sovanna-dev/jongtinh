import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Typography, List, Tag, Button, Spin, Empty, Card, Row, Col, Divider, Space } from "antd";
import { OrderedListOutlined, ShoppingOutlined, RightOutlined, CalendarOutlined } from "@ant-design/icons";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { IOrder } from "../../interfaces";
import { ShopLayout } from "./ShopLayout";

const { Title, Text } = Typography;
const STATUS_COLORS: Record<string, string> = {
    PENDING: "#FFBE0B",
    PROCESSING: "#3A86FF",
    SHIPPING: "#8338EC",
    DELIVERED: "#4CAF50",
    CANCELLED: "#E53935"
};

export const OrdersPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [orders, setOrders] = useState<IOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const user = auth.currentUser;

    useEffect(() => {
        if (!user) { setLoading(false); return; }
        (async () => {
            try {
                const q = query(collection(db, "orders"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
                const snapshot = await getDocs(q);
                setOrders(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as IOrder));
            } catch (e) {
                console.error("Error fetching orders:", e);
            } finally {
                setLoading(false);
            }
        })();
    }, [user]);

    return (
        <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
            <div style={{ maxWidth: 900, margin: "0 auto" }}>
                <div style={{ marginBottom: 32 }}>
                    <Title level={2} style={{ fontWeight: 800, margin: 0 }}>My Orders</Title>
                    <Text type="secondary">Track and manage your recent purchases</Text>
                </div>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "100px 0" }}>
                        <Spin size="large" />
                    </div>
                ) : orders.length === 0 ? (
                    <Card style={{ borderRadius: 24, textAlign: "center", padding: "64px 0", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                        <Empty
                            image={<OrderedListOutlined style={{ fontSize: 64, color: "#d9d9d9" }} />}
                            description={<Text type="secondary" style={{ fontSize: 18 }}>You haven't placed any orders yet</Text>}
                        >
                            <Button
                                type="primary"
                                size="large"
                                onClick={() => navigate("/shop")}
                                style={{ background: "#FF006E", borderRadius: 12, height: 48, fontWeight: 600, marginTop: 16 }}
                            >
                                Start Shopping
                            </Button>
                        </Empty>
                    </Card>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {orders.map((order) => (
                            <Card
                                key={order.id}
                                hoverable
                                onClick={() => navigate(`/shop/order/${order.id}`)}
                                style={{ borderRadius: 20, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                                bodyStyle={{ padding: 24 }}
                            >
                                <Row gutter={24} align="middle">
                                    <Col xs={24} sm={16}>
                                        <Space direction="vertical" size={4}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <Text strong style={{ fontSize: 16 }}>Order #{order.orderId?.split('-').pop()?.toUpperCase() || order.id.substring(0, 8).toUpperCase()}</Text>
                                                <Tag
                                                    color={STATUS_COLORS[order.orderStatus]}
                                                    style={{ borderRadius: 6, fontWeight: 600, border: "none" }}
                                                >
                                                    {order.orderStatus}
                                                </Tag>
                                            </div>
                                            <Space style={{ color: "#8c8c8c", fontSize: 13 }}>
                                                <CalendarOutlined />
                                                <Text type="secondary">{new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                                                <span>•</span>
                                                <Text type="secondary">{order.items?.length || 0} items</Text>
                                            </Space>
                                        </Space>

                                        <div style={{ marginTop: 16, display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
                                            {order.items?.slice(0, 4).map((item, idx) => (
                                                <img
                                                    key={idx}
                                                    src={item.productImage}
                                                    style={{ width: 44, height: 44, borderRadius: 8, objectFit: "cover", border: "1px solid #f0f0f0" }}
                                                    alt={item.productName}
                                                />
                                            ))}
                                            {order.items && order.items.length > 4 && (
                                                <div style={{ width: 44, height: 44, borderRadius: 8, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}>
                                                    +{order.items.length - 4}
                                                </div>
                                            )}
                                        </div>
                                    </Col>

                                    <Col xs={24} sm={8} style={{ textAlign: "right", marginTop: window.innerWidth < 576 ? 16 : 0 }}>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                            <Text type="secondary" style={{ fontSize: 12 }}>Total Amount</Text>
                                            <Text strong style={{ color: "#FF006E", fontSize: 20 }}>${order.total?.toFixed(2)}</Text>
                                            <Button
                                                type="link"
                                                icon={<RightOutlined />}
                                                style={{ padding: 0, marginTop: 8, fontWeight: 600 }}
                                            >
                                                View Details
                                            </Button>
                                        </div>
                                    </Col>
                                </Row>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </ShopLayout>
    );
};
