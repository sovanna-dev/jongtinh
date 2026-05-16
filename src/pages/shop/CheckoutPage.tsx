import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Typography, Form, Input, Button, Radio, Space, Divider, message, Steps, Card, Result } from "antd";
import { CreditCardOutlined, BankOutlined, DollarOutlined, ShoppingOutlined } from "@ant-design/icons";
import { collection, doc, setDoc } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { IProduct } from "../../interfaces";
import { ShopLayout } from "./ShopLayout";

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
    const [currentStep, setCurrentStep] = useState<"address" | "payment" | "success">("address");
    const [orderId, setOrderId] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // 🔥 Store address values in state so they persist between steps
    const [addressValues, setAddressValues] = useState({
        fullName: "",
        phoneNumber: "",
        streetAddress: "",
        city: "",
        province: "",
        postalCode: "",
    });

    const subtotal = cart.reduce((sum, item) => {
        const price = item.product.discountPrice ?? item.product.price;
        return sum + price * item.quantity;
    }, 0);
    const total = subtotal;

    const handlePlaceOrder = async () => {
        if (isCreating) return; // Prevent double-click

        const user = auth.currentUser;
        if (!user) {
            message.error("Please login first to place an order.");
            return;
        }

        console.log("Address values:", addressValues);

        if (!addressValues.fullName || !addressValues.phoneNumber || !addressValues.streetAddress || !addressValues.city || !addressValues.province) {
            message.error("Please go back and fill in all required address fields.");
            setCurrentStep("address");
            return;
        }

        setIsCreating(true);
        try {
            const newOrderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
            console.log("Creating order:", newOrderId);

            const orderData = {
                id: newOrderId,
                orderId: newOrderId,
                userId: user.uid,
                items: cart.map((item) => {
                    const price = item.product.discountPrice ?? item.product.price;
                    return {
                        productId: item.product.id,
                        productName: item.product.name,
                        productImage: item.product.images?.[0] || "",
                        price: price,
                        quantity: item.quantity,
                        userId: user.uid,
                        totalPrice: price * item.quantity,
                    };
                }),
                shippingAddress: {
                    fullName: addressValues.fullName,
                    phoneNumber: addressValues.phoneNumber,
                    streetAddress: addressValues.streetAddress,
                    city: addressValues.city,
                    province: addressValues.province,
                    postalCode: addressValues.postalCode || "",
                    additionalInfo: "",
                },
                paymentMethod: paymentMethod,
                subtotal: subtotal,
                shippingCost: 0,
                total: total,
                orderStatus: paymentMethod === "cod" ? "PROCESSING" : "PROCESSING",
                createdAt: Date.now(),
                updatedAt: Date.now(),
                trackingSteps: [
                    { id: "pending", title: "Order Pending", description: "Waiting for confirmation" },
                    { id: "processing", title: "Processing", description: "Preparing your order" },
                    { id: "shipping", title: "Shipping", description: "On the way to you" },
                    { id: "delivered", title: "Delivered", description: "Order completed" },
                ],
            };

            console.log("Saving to Firestore...");
            // Use setDoc with custom ID instead of addDoc (auto-generated ID)
            await setDoc(doc(db, "orders", newOrderId), orderData);
            console.log("Order saved! Document ID:", docRef.id);

            setOrderId(newOrderId);
            setCurrentStep("success");
            setCart([]);
            message.success("Order placed successfully!");
        } catch (error: any) {
            console.error("Order error:", error);
            message.error("Failed: " + (error.message || "Unknown error"));
        } finally {
            setIsCreating(false);
        }
    };

    const handleAddressSubmit = (values: any) => {
        // Save address values to state
        setAddressValues({
            fullName: values.fullName || "",
            phoneNumber: values.phoneNumber || "",
            streetAddress: values.streetAddress || "",
            city: values.city || "",
            province: values.province || "",
            postalCode: values.postalCode || "",
        });

        if (paymentMethod === "cod") {
            handlePlaceOrder();
        } else {
            setCurrentStep("payment");
        }
    };

    const handleIHavePaid = () => {
        handlePlaceOrder();
    };

    // ---------- Empty Cart ----------
    if (cart.length === 0 && currentStep !== "success") {
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

    // ---------- Success ----------
    if (currentStep === "success") {
        return (
            <ShopLayout cart={cart} setCart={setCart} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
                <div style={{ maxWidth: 600, margin: "0 auto", padding: 24 }}>
                    <Result
                        status="success"
                        title="Order Placed Successfully!"
                        subTitle={
                            <div>
                                <Text>Your order ID is: <Text strong>{orderId}</Text></Text>
                                <br />
                                <Text type="secondary">
                                    {paymentMethod === "cod"
                                        ? "Your order is being processed. You will pay upon delivery."
                                        : "Thank you for your payment. Your order is now being processed."}
                                </Text>
                            </div>
                        }
                        extra={[
                            <Button type="primary" key="track" onClick={() => navigate(`/shop/order/${orderId}`)}>
                                Track Order
                            </Button>,
                            <Button key="shop" onClick={() => navigate("/shop")}>
                                Continue Shopping
                            </Button>,
                        ]}
                    />
                </div>
            </ShopLayout>
        );
    }

    // ---------- Payment QR Screen ----------
    if (currentStep === "payment") {
        const paymentName = paymentMethod === "aba" ? "ABA Pay" : paymentMethod === "acleda" ? "ACLEDA Bank" : "Wing Bank";
        const accountInfo: Record<string, { name: string; number: string; bank: string }> = {
            aba: { name: "JongTinh Co., Ltd", number: "002 123 456", bank: "ABA Bank" },
            acleda: { name: "JongTinh Co., Ltd", number: "1234-5678-9012", bank: "ACLEDA Bank" },
            wing: { name: "JongTinh Co., Ltd", number: "012 345 678", bank: "Wing Bank" },
        };
        const info = accountInfo[paymentMethod] || accountInfo.aba;

        return (
            <ShopLayout cart={cart} setCart={setCart} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
                <div style={{ maxWidth: 500, margin: "0 auto", padding: 24 }}>
                    <Steps current={1} items={[{ title: "Address" }, { title: "Payment" }, { title: "Confirmation" }]} style={{ marginBottom: 32 }} />

                    <Card>
                        <Title level={3} style={{ textAlign: "center" }}>{paymentName}</Title>
                        <Text type="secondary" style={{ display: "block", textAlign: "center", marginBottom: 16 }}>Scan the QR code below to pay</Text>

                        <div style={{ textAlign: "center", marginBottom: 24 }}>
                            <div style={{ width: 250, height: 250, margin: "0 auto", borderRadius: 16, border: "2px solid #f0f0f0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fff" }}>
                                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1">
                                    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
                                    <rect x="15" y="15" width="2" height="2" /><rect x="19" y="15" width="2" height="2" /><rect x="15" y="19" width="2" height="2" /><rect x="19" y="19" width="2" height="2" />
                                    <rect x="11" y="15" width="2" height="6" /><rect x="15" y="11" width="6" height="2" />
                                </svg>
                                <Text strong style={{ marginTop: 12, color: "#FF006E", fontSize: 18 }}>{paymentName}</Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>Scan to Pay</Text>
                            </div>
                        </div>

                        <Card size="small" style={{ marginBottom: 16, background: "#f9f9f9" }}>
                            <Space direction="vertical" style={{ width: "100%" }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}><Text type="secondary">Account Name</Text><Text strong>{info.name}</Text></div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}><Text type="secondary">Account Number</Text><Text strong>{info.number}</Text></div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}><Text type="secondary">Amount</Text><Text strong style={{ color: "#FF006E", fontSize: 18 }}>${total.toFixed(2)}</Text></div>
                            </Space>
                        </Card>

                        <Text type="warning" style={{ display: "block", textAlign: "center", marginBottom: 16 }}>⚠️ This is a demo QR. Do not send real money.</Text>

                        <Space direction="vertical" style={{ width: "100%" }}>
                            <Button type="primary" size="large" block loading={isCreating} onClick={handleIHavePaid}
                                style={{ background: "#4CAF50", border: "none", height: 48, fontSize: 16 }}>✅ I Have Paid</Button>
                            <Button size="large" block onClick={() => setCurrentStep("address")}>← Back</Button>
                        </Space>
                    </Card>
                </div>
            </ShopLayout>
        );
    }

    // ---------- Address Form (Step 1) ----------
    return (
        <ShopLayout cart={cart} setCart={setCart} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
            <Title level={2}>Checkout</Title>
            <Steps current={0} items={[{ title: "Address" }, { title: "Payment" }, { title: "Confirmation" }]} style={{ marginBottom: 32 }} />

            <div style={{ maxWidth: 800, margin: "0 auto" }}>
                <div style={{ background: "#fff", padding: 24, borderRadius: 12, marginBottom: 24 }}>
                    <Title level={4}>Order Summary</Title>
                    {cart.map((item) => {
                        const price = item.product.discountPrice ?? item.product.price;
                        return (
                            <div key={item.product.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                <Text>{item.product.name} x {item.quantity}</Text>
                                <Text>${(price * item.quantity).toFixed(2)}</Text>
                            </div>
                        );
                    })}
                    <Divider />
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <Text strong>Total</Text>
                        <Text strong style={{ color: "#FF006E", fontSize: 18 }}>${total.toFixed(2)}</Text>
                    </div>
                </div>

                <Form form={form} layout="vertical" onFinish={handleAddressSubmit} initialValues={addressValues}>
                    <div style={{ background: "#fff", padding: 24, borderRadius: 12, marginBottom: 24 }}>
                        <Title level={4}>Shipping Address</Title>
                        <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}><Input placeholder="Your full name" /></Form.Item>
                        <Form.Item name="phoneNumber" label="Phone Number" rules={[{ required: true }]}><Input placeholder="Your phone number" /></Form.Item>
                        <Form.Item name="streetAddress" label="Street Address" rules={[{ required: true }]}><Input placeholder="Street address" /></Form.Item>
                        <Form.Item name="city" label="City" rules={[{ required: true }]}><Input placeholder="City" /></Form.Item>
                        <Form.Item name="province" label="Province" rules={[{ required: true }]}><Input placeholder="Province" /></Form.Item>
                        <Form.Item name="postalCode" label="Postal Code"><Input placeholder="Postal code (optional)" /></Form.Item>
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

                    <Button type="primary" size="large" htmlType="submit" block
                        style={{ background: "#FF006E", height: 48, fontSize: 16 }}>
                        {paymentMethod === "cod" ? "Place Order" : "Continue to Payment"} — ${total.toFixed(2)}
                    </Button>
                </Form>
            </div>
        </ShopLayout>
    );
};