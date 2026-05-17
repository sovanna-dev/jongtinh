import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Typography, Form, Input, Button, Radio, Space, Divider, message, Steps, Card, Result, Row, Col, Badge, Empty } from "antd";
import { CreditCardOutlined, BankOutlined, DollarOutlined, ShoppingOutlined, ArrowLeftOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { collection, doc, setDoc, addDoc } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { ShopLayout } from "./ShopLayout";
import { useCart } from "../../contexts/CartContext";
import { useCustomerAuth } from "../../contexts/CustomerAuthContext";
import { AuthModal } from "../../components/shop/AuthModal";

const { Title, Text } = Typography;

export const CheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [searchQuery, setSearchQuery] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cod");
    const [currentStep, setCurrentStep] = useState<"address" | "payment" | "success">("address");
    const [orderId, setOrderId] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [addressValues, setAddressValues] = useState({ fullName: "", phoneNumber: "", streetAddress: "", city: "", province: "", postalCode: "" });
    const { cart, clearCart, cartTotal } = useCart();
    const { user: customerUser } = useCustomerAuth();
    const user = auth.currentUser || customerUser;

    const shippingCost = cart.length > 0 ? 5.00 : 0;
    const subtotal = cartTotal;
    const total = subtotal + shippingCost;

    const handlePlaceOrder = async () => {
        if (isCreating) return;

        // 🔥 Check if user is logged in
        if (!user) {
            setAuthModalOpen(true);
            return;
        }

        if (!addressValues.fullName || !addressValues.phoneNumber || !addressValues.streetAddress || !addressValues.city || !addressValues.province) {
            message.error("Fill all required fields."); setCurrentStep("address"); return;
        }

        setIsCreating(true);
        try {
            const newOrderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

            await setDoc(doc(db, "orders", newOrderId), {
                id: newOrderId, orderId: newOrderId, userId: user.uid,
                items: cart.map((item) => {
                    const p = item.product.discountPrice ?? item.product.price;
                    return { productId: item.product.id, productName: item.product.name, productImage: item.product.images?.[0] || "", price: p, quantity: item.quantity, userId: user.uid, totalPrice: p * item.quantity };
                }),
                shippingAddress: addressValues, paymentMethod,
                subtotal: subtotal, shippingCost: 0, total: subtotal,
                orderStatus: paymentMethod === "cod" ? "PROCESSING" : "PENDING",
                createdAt: Date.now(), updatedAt: Date.now(),
                trackingSteps: [
                    { id: "pending", title: "Order Pending", description: "Waiting for confirmation" },
                    { id: "processing", title: "Processing", description: "Preparing your order" },
                    { id: "shipping", title: "Shipping", description: "On the way to you" },
                    { id: "delivered", title: "Delivered", description: "Order completed" },
                ],
            });

            try {
                await addDoc(collection(db, "notifications"), {
                    userId: user.uid,
                    title: "Order Placed Successfully!",
                    message: `Your order #${newOrderId.substring(0, 8).toUpperCase()} has been placed and is being processed.`,
                    timestamp: Date.now(), type: "order", isRead: false,
                    destination: "order", destinationId: newOrderId,
                });
            } catch (notifError) {
                console.error("Notification creation failed:", notifError);
            }

            setOrderId(newOrderId);
            setCurrentStep("success");
            clearCart();
            message.success("Order placed!");
        } catch (e: any) {
            console.error("Order error:", e);
            message.error("Failed: " + (e.message || "Unknown error"));
        }
        setIsCreating(false);
    };

    const handleAddressSubmit = (values: { fullName: string; phoneNumber: string; streetAddress: string; city: string; province: string; postalCode: string }) => {
        setAddressValues(values);
        if (!user) {
            setAuthModalOpen(true);
            return;
        }
        paymentMethod === "cod" ? handlePlaceOrder() : setCurrentStep("payment");
    };


    if (cart.length === 0 && currentStep !== "success") {
        return (
            <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
                <div style={{ textAlign: "center", padding: "100px 0" }}>
                    <Card style={{ maxWidth: 500, margin: "0 auto", borderRadius: 24, border: "none", boxShadow: "0 8px 32px rgba(0,0,0,0.05)" }}>
                        <Empty
                            image={<ShoppingOutlined style={{ fontSize: 64, color: "#d9d9d9" }} />}
                            description={<Text type="secondary" style={{ fontSize: 18 }}>Your cart is empty</Text>}
                        >
                            <Button type="primary" size="large" onClick={() => navigate("/shop")} style={{ background: "#FF006E", borderRadius: 12, border: "none", height: 48 }}>
                                Continue Shopping
                            </Button>
                        </Empty>
                    </Card>
                </div>
                <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
            </ShopLayout>

        );
    }

    if (currentStep === "success") {
        return (
            <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
                <div style={{ maxWidth: 700, margin: "40px auto" }}>
                    <Card style={{ borderRadius: 32, border: "none", boxShadow: "0 12px 48px rgba(0,0,0,0.08)", overflow: "hidden" }}>
                        <Result
                            status="success"
                            title={<Title level={2} style={{ fontWeight: 800 }}>Order Placed Successfully!</Title>}
                            subTitle={
                                <div style={{ background: "#f9f9f9", padding: 24, borderRadius: 16, marginTop: 24 }}>
                                    <Text style={{ fontSize: 16 }}>Your order <Text strong style={{ color: "#FF006E" }}>#{orderId}</Text> has been received and is being processed.</Text>
                                    <br />
                                    <Text type="secondary">We will notify you once it's shipped.</Text>
                                </div>
                            }
                            extra={[
                                <Button
                                    type="primary"
                                    key="track"
                                    size="large"
                                    onClick={() => navigate(`/shop/order/${orderId}`)}
                                    style={{ background: "#FF006E", border: "none", borderRadius: 12, height: 48, minWidth: 160, fontWeight: 600 }}
                                >
                                    Track Order
                                </Button>,
                                <Button
                                    key="shop"
                                    size="large"
                                    onClick={() => navigate("/shop")}
                                    style={{ borderRadius: 12, height: 48, minWidth: 160 }}
                                >
                                    Continue Shopping
                                </Button>
                            ]}
                        />
                    </Card>
                </div>
                <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
            </ShopLayout>

        );
    }

    if (currentStep === "payment") {
        const paymentName = paymentMethod === "aba" ? "ABA Pay" : paymentMethod === "acleda" ? "ACLEDA Bank" : "Wing Bank";
        return (
            <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
                <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 0" }}>
                    <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => setCurrentStep("address")} style={{ paddingLeft: 0, marginBottom: 16, color: "#555" }}>
                        Back to Information
                    </Button>

                    <Steps
                        current={1}
                        items={[{ title: "Info" }, { title: "Payment" }, { title: "Review" }]}
                        style={{ marginBottom: 40 }}
                    />

                    <Card style={{ borderRadius: 24, border: "none", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", textAlign: "center" }}>
                        <div style={{ marginBottom: 24 }}>
                            <Title level={3} style={{ margin: 0 }}>Scan to Pay with {paymentName}</Title>
                            <Text type="secondary">Amount to pay: <Text strong style={{ color: "#FF006E", fontSize: 18 }}>${total.toFixed(2)}</Text></Text>
                        </div>

                        <div style={{
                            width: 280,
                            height: 280,
                            margin: "0 auto 32px auto",
                            borderRadius: 24,
                            padding: 20,
                            background: "#fff",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                            border: "1px solid #f0f0f0",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative"
                        }}>
                            {/* Modern QR Placeholder */}
                            <svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke={paymentMethod === 'aba' ? '#005a9c' : '#FF006E'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="2" width="8" height="8" rx="1" /><rect x="14" y="2" width="8" height="8" rx="1" /><rect x="2" y="14" width="8" height="8" rx="1" />
                                <rect x="14" y="14" width="3" height="3" rx="0.5" /><rect x="19" y="14" width="3" height="3" rx="0.5" />
                                <rect x="14" y="19" width="3" height="3" rx="0.5" /><rect x="19" y="19" width="3" height="3" rx="0.5" />
                                <path d="M6 6h0M18 6h0M6 18h0" strokeWidth="2.5" />
                            </svg>
                            <div style={{
                                position: "absolute",
                                background: "#fff",
                                borderRadius: "50%",
                                width: 40,
                                height: 40,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                            }}>
                                <SafetyCertificateOutlined style={{ color: "#FF006E", fontSize: 20 }} />
                            </div>
                        </div>

                        <div style={{ background: "#FFFBE6", padding: "12px 16px", borderRadius: 12, border: "1px solid #FFE58F", marginBottom: 32 }}>
                            <Text type="warning" style={{ fontSize: 13, fontWeight: 600 }}>
                                ℹ️ This is a demo payment. Please click the button below to simulate a successful payment.
                            </Text>
                        </div>

                        <Space direction="vertical" style={{ width: "100%" }} size={16}>
                            <Button
                                type="primary"
                                size="large"
                                block
                                loading={isCreating}
                                onClick={handlePlaceOrder}
                                style={{ background: "#4CAF50", border: "none", height: 56, fontSize: 18, fontWeight: 700, borderRadius: 16, boxShadow: "0 8px 16px rgba(76, 175, 80, 0.2)" }}
                            >
                                I Have Completed the Payment
                            </Button>
                            <Button type="text" onClick={() => setCurrentStep("address")} style={{ fontWeight: 600 }}>
                                Cancel and change method
                            </Button>
                        </Space>
                    </Card>
                </div>
                <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
            </ShopLayout>

        );
    }

    return (
        <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
            <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 0" }}>
                <Title level={2} style={{ fontWeight: 800, marginBottom: 32 }}>Checkout</Title>

                <Steps
                    current={0}
                    items={[{ title: "Shipping" }, { title: "Payment" }, { title: "Confirm" }]}
                    style={{ marginBottom: 48, maxWidth: 600 }}
                />

                <Row gutter={[48, 48]}>
                    <Col xs={24} lg={14}>
                        <Form form={form} layout="vertical" onFinish={handleAddressSubmit} initialValues={addressValues} requiredMark={false}>
                            <Card
                                title={<Title level={4} style={{ margin: 0 }}>Shipping Information</Title>}
                                style={{ borderRadius: 24, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", marginBottom: 32 }}
                                styles={{ body: { padding: 24 } }}
                            >
                                <Row gutter={16}>
                                    <Col span={24}>
                                        <Form.Item name="fullName" label="Full Name" rules={[{ required: true, message: "Required" }]}>
                                            <Input size="large" placeholder="Enter your full name" style={{ borderRadius: 10 }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item name="phoneNumber" label="Phone Number" rules={[{ required: true, message: "Required" }]}>
                                            <Input size="large" placeholder="Phone number for delivery" style={{ borderRadius: 10 }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item name="streetAddress" label="Street Address" rules={[{ required: true, message: "Required" }]}>
                                            <Input size="large" placeholder="House #, Street name" style={{ borderRadius: 10 }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="city" label="City" rules={[{ required: true, message: "Required" }]}>
                                            <Input size="large" placeholder="City" style={{ borderRadius: 10 }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="province" label="Province" rules={[{ required: true, message: "Required" }]}>
                                            <Input size="large" placeholder="Province" style={{ borderRadius: 10 }} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>

                            <Card
                                title={<Title level={4} style={{ margin: 0 }}>Payment Method</Title>}
                                style={{ borderRadius: 24, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
                                styles={{ body: { padding: 24 } }}
                            >
                                <Radio.Group
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    style={{ width: "100%" }}
                                >
                                    <Space direction="vertical" style={{ width: "100%" }} size={12}>
                                        <Card
                                            hoverable
                                            size="small"
                                            style={{
                                                borderRadius: 12,
                                                border: paymentMethod === 'cod' ? "2px solid #FF006E" : "1px solid #f0f0f0",
                                                background: paymentMethod === 'cod' ? "rgba(255, 0, 110, 0.02)" : "#fff"
                                            }}
                                            onClick={() => setPaymentMethod('cod')}
                                        >
                                            <Radio value="cod" style={{ width: "100%" }}>
                                                <Space size={12}>
                                                    <DollarOutlined style={{ fontSize: 20, color: "#52c41a" }} />
                                                    <div>
                                                        <Text strong style={{ display: "block" }}>Cash on Delivery</Text>
                                                        <Text type="secondary" style={{ fontSize: 12 }}>Pay when you receive your order</Text>
                                                    </div>
                                                </Space>
                                            </Radio>
                                        </Card>

                                        <Card
                                            hoverable
                                            size="small"
                                            style={{
                                                borderRadius: 12,
                                                border: paymentMethod === 'aba' ? "2px solid #FF006E" : "1px solid #f0f0f0",
                                                background: paymentMethod === 'aba' ? "rgba(255, 0, 110, 0.02)" : "#fff"
                                            }}
                                            onClick={() => setPaymentMethod('aba')}
                                        >
                                            <Radio value="aba" style={{ width: "100%" }}>
                                                <Space size={12}>
                                                    <BankOutlined style={{ fontSize: 20, color: "#005a9c" }} />
                                                    <div>
                                                        <Text strong style={{ display: "block" }}>ABA Pay</Text>
                                                        <Text type="secondary" style={{ fontSize: 12 }}>Instant payment via ABA Mobile</Text>
                                                    </div>
                                                </Space>
                                            </Radio>
                                        </Card>

                                        <Card
                                            hoverable
                                            size="small"
                                            style={{
                                                borderRadius: 12,
                                                border: paymentMethod === 'wing' ? "2px solid #FF006E" : "1px solid #f0f0f0",
                                                background: paymentMethod === 'wing' ? "rgba(255, 0, 110, 0.02)" : "#fff"
                                            }}
                                            onClick={() => setPaymentMethod('wing')}
                                        >
                                            <Radio value="wing" style={{ width: "100%" }}>
                                                <Space size={12}>
                                                    <CreditCardOutlined style={{ fontSize: 20, color: "#FFD700" }} />
                                                    <div>
                                                        <Text strong style={{ display: "block" }}>Wing Bank</Text>
                                                        <Text type="secondary" style={{ fontSize: 12 }}>Secure payment via Wing</Text>
                                                    </div>
                                                </Space>
                                            </Radio>
                                        </Card>
                                    </Space>
                                </Radio.Group>
                            </Card>

                            <Button
                                type="primary"
                                size="large"
                                htmlType="submit"
                                block
                                style={{
                                    background: "#FF006E",
                                    height: 60,
                                    borderRadius: 16,
                                    fontSize: 18,
                                    fontWeight: 700,
                                    marginTop: 40,
                                    border: "none",
                                    boxShadow: "0 8px 24px rgba(255, 0, 110, 0.25)"
                                }}
                            >
                                {paymentMethod === "cod" ? "Place My Order" : "Continue to Payment"} — ${total.toFixed(2)}
                            </Button>
                        </Form>
                    </Col>

                    <Col xs={24} lg={10}>
                        <Card
                            style={{
                                borderRadius: 24,
                                border: "none",
                                boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                                position: "sticky",
                                top: 100
                            }}
                            title={<Title level={4} style={{ margin: 0 }}>Order Summary</Title>}
                        >
                            <div style={{ maxHeight: 300, overflowY: "auto", marginBottom: 20 }}>
                                {cart.map((item) => {
                                    const p = item.product.discountPrice ?? item.product.price;
                                    return (
                                        <div key={item.product.id} style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                                            <Badge count={item.quantity} color="#FF006E">
                                                <img src={item.product.images?.[0]} style={{ width: 50, height: 50, borderRadius: 8, objectFit: "cover", border: "1px solid #eee" }} />
                                            </Badge>
                                            <div style={{ flex: 1 }}>
                                                <Text strong style={{ display: "block", fontSize: 13 }} ellipsis>{item.product.name}</Text>
                                                <Text type="secondary" style={{ fontSize: 12 }}>${p.toFixed(2)} each</Text>
                                            </div>
                                            <Text strong style={{ marginLeft: 8 }}>${(p * item.quantity).toFixed(2)}</Text>
                                        </div>
                                    );
                                })}
                            </div>

                            <Divider style={{ margin: "12px 0" }} />

                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                                <Text type="secondary">Subtotal</Text>
                                <Text strong>${cartTotal.toFixed(2)}</Text>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                                <Text type="secondary">Shipping Fee</Text>
                                <Text strong>${shippingCost.toFixed(2)}</Text>
                            </div>

                            <Divider style={{ margin: "16px 0" }} />

                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                                <Title level={3} style={{ margin: 0 }}>Order Total</Title>
                                <Title level={3} style={{ margin: 0, color: "#FF006E" }}>${total.toFixed(2)}</Title>
                            </div>

                            <div style={{ background: "#f6ffed", padding: "12px 16px", borderRadius: 12, border: "1px solid #b7eb8f", display: "flex", gap: 10, alignItems: "center" }}>
                                <SafetyCertificateOutlined style={{ color: "#52c41a", fontSize: 20 }} />
                                <Text style={{ fontSize: 12, color: "#389e0d" }}>Your payment is secured with industry-standard encryption.</Text>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>
            <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        </ShopLayout>

    );
};
