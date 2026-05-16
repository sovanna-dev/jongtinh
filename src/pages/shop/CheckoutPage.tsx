import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useCreate } from "@refinedev/core";
import { Typography, Form, Input, Button, Radio, Space, Divider, message, Steps } from "antd";
import { CreditCardOutlined, BankOutlined, DollarOutlined, ShoppingOutlined } from "@ant-design/icons";
import { IProduct, IOrder } from "../../interfaces";
import { ShopLayout } from "./ShopLayout";
import { auth } from "../../firebase";

const { Title, Text } = Typography;

interface CartItem {
    product: IProduct;
    quantity: number;
}

interface CheckoutPageProps {
    cart: CartItem[];
    setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ cart, setCart }) => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [searchQuery, setSearchQuery] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cod");
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [orderId, setOrderId] = useState("");

    const { mutate: createOrder, isLoading: isCreating } = useCreate<IOrder>();

    const subtotal = cart.reduce((sum, item) => sum + item.product.finalPrice * item.quantity, 0);
    const shippingCost = 0;
    const total = subtotal + shippingCost;

    const handlePlaceOrder = (values: any) => {
        const user = auth.currentUser;
        if (!user) {
            message.error("Please login first to place an order.");
            return;
        }

        const orderData: any = {
            orderId: `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            userId: user.uid,
            items: cart.map((item) => ({
                productId: item.product.id,
                productName: item.product.name,
                productImage: item.product.images?.[0] || "",
                price: item.product.finalPrice,
                quantity: item.quantity,
                userId: user.uid,
                totalPrice: item.product.finalPrice * item.quantity,
            })),
            shippingAddress: {
                fullName: values.fullName,
                phoneNumber: values.phoneNumber,
                streetAddress: values.streetAddress,
                city: values.city,
                province: values.province,
                postalCode: values.postalCode || "",
                additionalInfo: "",
            },
            paymentMethod: paymentMethod,
            subtotal: subtotal,
            shippingCost: shippingCost,
            total: total,
            orderStatus: paymentMethod === "cod" ? "PROCESSING" : "PENDING",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            trackingSteps: [
                { id: "pending", title: "Order Pending", description: "Waiting for confirmation" },
                { id: "processing", title: "Processing", description: "Preparing your order" },
                { id: "shipping", title: "Shipping", description: "On the way to you" },
                { id: "delivered", title: "Delivered", description: "Order completed" },
            ],
        };

        createOrder(
            { resource: "orders", values: orderData },
            {
                onSuccess: (data) => {
                    setOrderId(orderData.orderId);
                    setOrderPlaced(true);
                    setCart([]);
                    message.success("Order placed successfully!");
                },
                onError: (error) => {
                    message.error("Failed to place order: " + error.message);
                },
            }
        );
    };

    if (cart.length === 0 && !orderPlaced) {
        return (
            <ShopLayout cart={cart} setCart={setCart} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
                <div style={{ textAlign: "center", padding: 48 }}>
                    <Title level={4}>Your cart is empty</Title>
                    <Button type="primary" onClick={() => navigate("/shop")} icon={<ShoppingOutlined />}>
                        Continue Shopping
                    </Button>
                </div>
            </ShopLayout>
        );
    }

    if (orderPlaced) {
        return (
            <ShopLayout cart={cart} setCart={setCart} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
                <div style={{ textAlign: "center", padding: 48, maxWidth: 600, margin: "0 auto" }}>
                    <Title level={2} style={{ color: "#4CAF50" }}>
                        ✅ Order Placed Successfully!
                    </Title>
                    <Text style={{ fontSize: 16 }}>
                        Your order ID is: <Text strong>{orderId}</Text>
                    </Text>
                    <br /><br />
                    <Button type="primary" onClick={() => navigate(`/shop/order/${orderId}`)} style={{ marginRight: 16 }}>
                        Track Order
                    </Button>
                    <Button onClick={() => navigate("/shop")}>Continue Shopping</Button>
                </div>
            </ShopLayout>
        );
    }

    return (
        <ShopLayout cart={cart} setCart={setCart} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
            <Title level={2}>Checkout</Title>

            <Steps
                current={1}
                items={[
                    { title: "Cart" },
                    { title: "Checkout" },
                    { title: "Confirmation" },
                ]}
                style={{ marginBottom: 32 }}
            />

            <div style={{ maxWidth: 800, margin: "0 auto" }}>
                <div style={{ background: "#fff", padding: 24, borderRadius: 12, marginBottom: 24 }}>
                    <Title level={4}>Order Summary</Title>
                    {cart.map((item) => (
                        <div key={item.product.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <Text>{item.product.name} x {item.quantity}</Text>
                            <Text>${(item.product.finalPrice * item.quantity).toFixed(2)}</Text>
                        </div>
                    ))}
                    <Divider />
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <Text strong>Total</Text>
                        <Text strong style={{ color: "#FF006E", fontSize: 18 }}>
                            ${total.toFixed(2)}
                        </Text>
                    </div>
                </div>

                <Form form={form} layout="vertical" onFinish={handlePlaceOrder}>
                    <div style={{ background: "#fff", padding: 24, borderRadius: 12, marginBottom: 24 }}>
                        <Title level={4}>Shipping Address</Title>
                        <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}>
                            <Input placeholder="Your full name" />
                        </Form.Item>
                        <Form.Item name="phoneNumber" label="Phone Number" rules={[{ required: true }]}>
                            <Input placeholder="Your phone number" />
                        </Form.Item>
                        <Form.Item name="streetAddress" label="Street Address" rules={[{ required: true }]}>
                            <Input placeholder="Street address" />
                        </Form.Item>
                        <Form.Item name="city" label="City" rules={[{ required: true }]}>
                            <Input placeholder="City" />
                        </Form.Item>
                        <Form.Item name="province" label="Province" rules={[{ required: true }]}>
                            <Input placeholder="Province" />
                        </Form.Item>
                        <Form.Item name="postalCode" label="Postal Code">
                            <Input placeholder="Postal code (optional)" />
                        </Form.Item>
                    </div>

                    <div style={{ background: "#fff", padding: 24, borderRadius: 12, marginBottom: 24 }}>
                        <Title level={4}>Payment Method</Title>
                        <Radio.Group value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                            <Space direction="vertical">
                                <Radio value="cod">
                                    <Space>
                                        <DollarOutlined />
                                        <Text>Cash on Delivery</Text>
                                    </Space>
                                </Radio>
                                <Radio value="aba">
                                    <Space>
                                        <BankOutlined />
                                        <Text>ABA Pay</Text>
                                    </Space>
                                </Radio>
                                <Radio value="acleda">
                                    <Space>
                                        <CreditCardOutlined />
                                        <Text>ACLEDA Bank</Text>
                                    </Space>
                                </Radio>
                                <Radio value="wing">
                                    <Space>
                                        <CreditCardOutlined />
                                        <Text>Wing Bank</Text>
                                    </Space>
                                </Radio>
                            </Space>
                        </Radio.Group>
                    </div>

                    <Button
                        type="primary"
                        size="large"
                        htmlType="submit"
                        loading={isCreating}
                        block
                        style={{ background: "#FF006E", height: 48, fontSize: 16 }}
                    >
                        Place Order — ${total.toFixed(2)}
                    </Button>
                </Form>
            </div>
        </ShopLayout>
    );
};