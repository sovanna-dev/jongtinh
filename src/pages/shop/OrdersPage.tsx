import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Typography, List, Tag, Button, Spin, Empty, Card } from "antd";
import { OrderedListOutlined } from "@ant-design/icons";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { IOrder, IProduct } from "../../interfaces";
import { ShopLayout } from "./ShopLayout";

const { Title, Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
    PENDING: "#FFBE0B",
    PROCESSING: "#3A86FF",
    SHIPPING: "#8338EC",
    DELIVERED: "#4CAF50",
    CANCELLED: "#E53935",
};

interface CartItem {
    product: IProduct;
    quantity: number;
}

interface OrdersPageProps {
    cart: CartItem[];
    setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ cart, setCart }) => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [orders, setOrders] = useState<IOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const user = auth.currentUser;

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                const q = query(
                    collection(db, "orders"),
                    where("userId", "==", user.uid),
                    orderBy("createdAt", "desc")
                );
                const snapshot = await getDocs(q);
                setOrders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as IOrder));
            } catch (error) {
                console.error("Error fetching orders:", error);
            }
            setLoading(false);
        };
        fetchOrders();
    }, [user]);

    return (
        <ShopLayout cart={cart} setCart={setCart} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
                <Title level={2}>
                    <OrderedListOutlined /> My Orders
                </Title>

                {loading ? (
                    <Spin size="large" style={{ display: "block", margin: "48px auto" }} />
                ) : orders.length === 0 ? (
                    <Empty description="No orders yet" style={{ padding: 48 }}>
                        <Button type="primary" onClick={() => navigate("/shop")}>
                            Start Shopping
                        </Button>
                    </Empty>
                ) : (
                    <List
                        dataSource={orders}
                        renderItem={(order) => (
                            <Card
                                hoverable
                                onClick={() => navigate(`/shop/order/${order.id}`)}
                                style={{ marginBottom: 12, borderRadius: 12 }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <Text strong>
                                            Order #{order.orderId?.substring(0, 8)?.toUpperCase()}
                                        </Text>
                                        <br />
                                        <Text type="secondary">
                                            {new Date(order.createdAt).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}{" "}
                                            · {order.items?.length || 0} items
                                        </Text>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <Tag color={STATUS_COLORS[order.orderStatus] || "default"}>
                                            {order.orderStatus}
                                        </Tag>
                                        <br />
                                        <Text strong style={{ color: "#FF006E" }}>
                                            ${order.total?.toFixed(2)}
                                        </Text>
                                    </div>
                                </div>
                            </Card>
                        )}
                    />
                )}
            </div>
        </ShopLayout>
    );
};