import React from "react";
import { useParams, useNavigate } from "react-router";
import { useOne } from "@refinedev/core";
import { Typography, Steps, Card, Descriptions, Tag, Button, Spin, Space } from "antd";
import { IOrder } from "../../interfaces";
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
    product: any;
    quantity: number;
}

export const OrderTracking: React.FC<{ cart: CartItem[]; setCart: React.Dispatch<React.SetStateAction<CartItem[]>> }> = ({ cart, setCart }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = React.useState("");

    const { data, isLoading } = useOne<IOrder>({
        resource: "orders",
        id: id || "",
    });

    const order = data?.data;

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

    const currentStep = ["PENDING", "PROCESSING", "SHIPPING", "DELIVERED"].indexOf(order.orderStatus);

    return (
        <ShopLayout cart={cart} setCart={setCart} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
                <Button onClick={() => navigate("/shop")} style={{ marginBottom: 16 }}>Back to Shop</Button>

                <Card>
                    <Space align="center" style={{ marginBottom: 16 }}>
                        <Title level={3} style={{ margin: 0 }}>Order #{order.orderId?.substring(0, 8)?.toUpperCase()}</Title>
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
                            { title: "Order Placed", description: "Pending" },
                            { title: "Processing", description: "Preparing" },
                            { title: "Shipping", description: "On the way" },
                            { title: "Delivered", description: "Completed" },
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
                        <div key={index} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                            <Text>{item.productName} x {item.quantity}</Text>
                            <Text>${(item.price * item.quantity).toFixed(2)}</Text>
                        </div>
                    ))}
                </Card>
            </div>
        </ShopLayout>
    );
};