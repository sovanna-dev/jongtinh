import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Typography, Form, Input, Button, Radio, Space, Divider, message, Steps, Card, Result } from "antd";
import { CreditCardOutlined, BankOutlined, DollarOutlined, ShoppingOutlined } from "@ant-design/icons";
import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { ShopLayout } from "./ShopLayout";
import { useCart } from "../../contexts/CartContext";

const { Title, Text } = Typography;

export const CheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [searchQuery, setSearchQuery] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cod");
    const [currentStep, setCurrentStep] = useState<"address" | "payment" | "success">("address");
    const [orderId, setOrderId] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [addressValues, setAddressValues] = useState({ fullName: "", phoneNumber: "", streetAddress: "", city: "", province: "", postalCode: "" });
    const { cart, clearCart, cartTotal } = useCart();

    const subtotal = cartTotal;
    const total = subtotal;

    const handlePlaceOrder = async () => {
        if (isCreating) return;
        const user = auth.currentUser;
        if (!user) { message.error("Please login first."); return; }
        if (!addressValues.fullName || !addressValues.phoneNumber || !addressValues.streetAddress || !addressValues.city || !addressValues.province) { message.error("Fill all required fields."); setCurrentStep("address"); return; }

        setIsCreating(true);
        try {
            const newOrderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
            await setDoc(doc(db, "orders", newOrderId), {
                id: newOrderId, orderId: newOrderId, userId: user.uid,
                items: cart.map((item) => { const p = item.product.discountPrice ?? item.product.price; return { productId: item.product.id, productName: item.product.name, productImage: item.product.images?.[0] || "", price: p, quantity: item.quantity, userId: user.uid, totalPrice: p * item.quantity }; }),
                shippingAddress: addressValues, paymentMethod, subtotal, shippingCost: 0, total,
                orderStatus: "PROCESSING", createdAt: Date.now(), updatedAt: Date.now(),
                trackingSteps: [{ id: "pending", title: "Order Pending", description: "Waiting" }, { id: "processing", title: "Processing", description: "Preparing" }, { id: "shipping", title: "Shipping", description: "On the way" }, { id: "delivered", title: "Delivered", description: "Completed" }],
            });
            setOrderId(newOrderId); setCurrentStep("success"); clearCart(); message.success("Order placed!");
        } catch (e: any) { message.error(e.message); }
        setIsCreating(false);
    };

    const handleAddressSubmit = (values: any) => { setAddressValues(values); paymentMethod === "cod" ? handlePlaceOrder() : setCurrentStep("payment"); };

    if (cart.length === 0 && currentStep !== "success") return <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}><div style={{ textAlign: "center", padding: 48 }}><Title level={4}>Your cart is empty</Title><Button type="primary" onClick={() => navigate("/shop")} icon={<ShoppingOutlined />}>Continue Shopping</Button></div></ShopLayout>;

    if (currentStep === "success") return <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}><div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}><Result status="success" title="Order Placed Successfully!" subTitle={<div><Text>Order ID: <Text strong>{orderId}</Text></Text></div>} extra={[<Button type="primary" key="track" onClick={() => navigate(`/shop/order/${orderId}`)}>Track Order</Button>, <Button key="shop" onClick={() => navigate("/shop")}>Continue Shopping</Button>]} /></div></ShopLayout>;

    if (currentStep === "payment") {
        const paymentName = paymentMethod === "aba" ? "ABA Pay" : paymentMethod === "acleda" ? "ACLEDA Bank" : "Wing Bank";
        return (
            <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
                <div style={{ maxWidth: 500, margin: "0 auto", padding: 24 }}>
                    <Steps current={1} items={[{ title: "Address" }, { title: "Payment" }, { title: "Confirmation" }]} style={{ marginBottom: 32 }} />
                    <Card>
                        <Title level={3} style={{ textAlign: "center" }}>{paymentName}</Title>
                        <div style={{ textAlign: "center", marginBottom: 24 }}>
                            <div style={{ width: 250, height: 250, margin: "0 auto", borderRadius: 16, border: "2px solid #f0f0f0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fff" }}>
                                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="15" y="15" width="2" height="2" /><rect x="19" y="15" width="2" height="2" /><rect x="15" y="19" width="2" height="2" /><rect x="19" y="19" width="2" height="2" /><rect x="11" y="15" width="2" height="6" /><rect x="15" y="11" width="6" height="2" /></svg>
                                <Text strong style={{ marginTop: 12, color: "#FF006E", fontSize: 18 }}>{paymentName}</Text>
                            </div>
                        </div>
                        <Text type="warning" style={{ display: "block", textAlign: "center", marginBottom: 16 }}>⚠️ Demo QR. Do not send real money.</Text>
                        <Space direction="vertical" style={{ width: "100%" }}>
                            <Button type="primary" size="large" block loading={isCreating} onClick={handlePlaceOrder} style={{ background: "#4CAF50", border: "none", height: 48, fontSize: 16 }}>✅ I Have Paid</Button>
                            <Button size="large" block onClick={() => setCurrentStep("address")}>← Back</Button>
                        </Space>
                    </Card>
                </div>
            </ShopLayout>
        );
    }

    return (
        <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
            <Title level={2}>Checkout</Title>
            <Steps current={0} items={[{ title: "Address" }, { title: "Payment" }, { title: "Confirmation" }]} style={{ marginBottom: 32 }} />
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
                <div style={{ background: "#fff", padding: 24, borderRadius: 12, marginBottom: 24 }}>
                    <Title level={4}>Order Summary</Title>
                    {cart.map((item) => { const p = item.product.discountPrice ?? item.product.price; return <div key={item.product.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><Text>{item.product.name} x {item.quantity}</Text><Text>${(p * item.quantity).toFixed(2)}</Text></div>; })}
                    <Divider /><div style={{ display: "flex", justifyContent: "space-between" }}><Text strong>Total</Text><Text strong style={{ color: "#FF006E", fontSize: 18 }}>${total.toFixed(2)}</Text></div>
                </div>
                <Form form={form} layout="vertical" onFinish={handleAddressSubmit} initialValues={addressValues}>
                    <div style={{ background: "#fff", padding: 24, borderRadius: 12, marginBottom: 24 }}>
                        <Title level={4}>Shipping Address</Title>
                        <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}><Input /></Form.Item>
                        <Form.Item name="phoneNumber" label="Phone Number" rules={[{ required: true }]}><Input /></Form.Item>
                        <Form.Item name="streetAddress" label="Street Address" rules={[{ required: true }]}><Input /></Form.Item>
                        <Form.Item name="city" label="City" rules={[{ required: true }]}><Input /></Form.Item>
                        <Form.Item name="province" label="Province" rules={[{ required: true }]}><Input /></Form.Item>
                        <Form.Item name="postalCode" label="Postal Code"><Input /></Form.Item>
                    </div>
                    <div style={{ background: "#fff", padding: 24, borderRadius: 12, marginBottom: 24 }}>
                        <Title level={4}>Payment Method</Title>
                        <Radio.Group value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                            <Space direction="vertical">
                                <Radio value="cod"><Space><DollarOutlined /><Text>Cash on Delivery</Text></Space></Radio>
                                <Radio value="aba"><Space><BankOutlined /><Text>ABA Pay</Text></Space></Radio>
                                <Radio value="acleda"><Space><CreditCardOutlined /><Text>ACLEDA Bank</Text></Space></Radio>
                                <Radio value="wing"><Space><CreditCardOutlined /><Text>Wing Bank</Text></Space></Radio>
                            </Space>
                        </Radio.Group>
                    </div>
                    <Button type="primary" size="large" htmlType="submit" block style={{ background: "#FF006E", height: 48, fontSize: 16 }}>{paymentMethod === "cod" ? "Place Order" : "Continue to Payment"} — ${total.toFixed(2)}</Button>
                </Form>
            </div>
        </ShopLayout>
    );
};