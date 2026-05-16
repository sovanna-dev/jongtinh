import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { doc, getDoc, collection, query, where, limit, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { Typography, Steps, Card, Descriptions, Tag, Button, Spin, Space } from "antd";
import { IOrder } from "../../interfaces";
import { ShopLayout } from "./ShopLayout";
import { IProduct } from "../../interfaces";

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

export const OrderTracking: React.FC<{ cart: CartItem[]; setCart: React.Dispatch<React.SetStateAction<CartItem[]>> }> = ({ cart, setCart }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [order, setOrder] = useState<IOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                // Try to find by document ID first (since we use setDoc with orderId as doc ID)
                const docRef = doc(db, "orders", id);
                const snapshot = await getDoc(docRef);

                if (snapshot.exists()) {
                    setOrder({ id: snapshot.id, ...snapshot.data() } as IOrder);
                } else {
                    // Fallback: search by orderId field
                    const q = query(collection(db, "orders"), where("orderId", "==", id), limit(1));
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        const doc = querySnapshot.docs[0];
                        setOrder({ id: doc.id, ...doc.data() } as IOrder);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch order:", error);
            }
            setIsLoading(false);
        };
        fetchOrder();
    }, [id]);

    if (isLoading) {
        return (
            <ShopLayout cart={cart} setCart={setCart} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
                <div style={{ textAlign: "center", padding: 100 }}><Spin size="large" /></div>
            </ShopLayout>
        );
    }

    if (!order) {
        return (
            <ShopLayout cart={cart} setCart={setCart} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
                <div style={{ textAlign: "center", padding: 100 }}>
                    <Title level={4}>Order not found</Title>
                    <Button onClick={() => navigate("/shop")}>Back to Shop</Button>
                </div>
            </ShopLayout>
        );
    }

    const statusOrder = ["PENDING", "PROCESSING", "SHIPPING", "DELIVERED"];
    const currentStep = statusOrder.indexOf(order.orderStatus);

    return (
        <ShopLayout cart={cart} setCart={setCart} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
                <Button onClick={() => navigate("/shop")} style={{ marginBottom: 16 }}>← Back to Shop</Button>

                <Card>
                    <Space align="center" style={{ marginBottom: 16 }}>
                        <Title level={3} style={{ margin: 0 }}>
                            Order #{order.orderId?.substring(0, 8)?.toUpperCase()}
                        </Title>
                        <Tag color={STATUS_COLORS[order.orderStatus]}>{order.orderStatus}</Tag>
                    </Space>

                    <Text type="secondary">
                        Placed on {new Date(order.createdAt).toLocaleString()}
                    </Text>

                    <Steps
                        current={currentStep >= 0 ? currentStep : 0}
                        status={order.orderStatus === "CANCELLED" ? "error" : "process"}
                        style={{ marginTop: 24, marginBottom: 24 }}
                        items={[
                            { title: "Order Placed" },
                            { title: "Processing" },
                            { title: "Shipping" },
                            { title: "Delivered" },
                        ]}
                    />

                    <Descriptions bordered column={2} style={{ marginTop: 24 }}>
                        <Descriptions.Item label="Customer">{order.shippingAddress?.fullName}</Descriptions.Item>
                        <Descriptions.Item label="Phone">{order.shippingAddress?.phoneNumber}</Descriptions.Item>
                        <Descriptions.Item label="Address" span={2}>
                            {order.shippingAddress?.streetAddress}, {order.shippingAddress?.city}, {order.shippingAddress?.province}
                        </Descriptions.Item>
                        <Descriptions.Item label="Payment">{order.paymentMethod?.toUpperCase()}</Descriptions.Item>
                        <Descriptions.Item label="Total">
                            <Text strong style={{ color: "#FF006E" }}>${order.total?.toFixed(2)}</Text>
                        </Descriptions.Item>
                    </Descriptions>

                    <Title level={4} style={{ marginTop: 24 }}>Items</Title>
                    {order.items?.map((item, index) => (
                        <div key={index} style={{
                            display: "flex", justifyContent: "space-between",
                            padding: "8px 0", borderBottom: "1px solid #f0f0f0"
                        }}>
                            <Text>{item.productName} x {item.quantity}</Text>
                            <Text>${(item.price * item.quantity).toFixed(2)}</Text>
                        </div>
                    ))}
                </Card>
            </div>
        </ShopLayout>
    );
};