import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Typography, Form, Input, Button, Radio, Space, Divider, message, Steps, Card, Result, Row, Col, Badge, Empty, Upload, Image } from "antd";
import { CreditCardOutlined, BankOutlined, DollarOutlined, ShoppingOutlined, ArrowLeftOutlined, SafetyCertificateOutlined, UploadOutlined, CameraOutlined } from "@ant-design/icons";
import { collection, doc, setDoc, addDoc, runTransaction, getDoc } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { ICategory, IPromotionBanner, INotification, IProduct, IStyle } from "../../interfaces";
import { ShopLayout } from "./ShopLayout";
import { useCart } from "../../contexts/CartContext";
import { useCustomerAuth } from "../../contexts/CustomerAuthContext";
import { AuthModal } from "../../components/shop/AuthModal";
import { ColorModeContext } from "../../contexts/color-mode";
import { useLanguage } from "../../contexts/LanguageContext";

const { Title, Text } = Typography;

export const CheckoutPage: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { mode } = React.useContext(ColorModeContext);
    const isDark = mode === "dark";
    const [form] = Form.useForm();
    const [searchQuery, setSearchQuery] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cod");
    const [currentStep, setCurrentStep] = useState<"address" | "payment" | "success">("address");
    const [orderId, setOrderId] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [receiptUrl, setReceiptUrl] = useState("");
    const [receiptUploading, setReceiptUploading] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [addressValues, setAddressValues] = useState({ fullName: "", phoneNumber: "", streetAddress: "", city: "", province: "", postalCode: "" });
    const { cart, clearCart, cartTotal } = useCart();
    const { user: customerUser } = useCustomerAuth();
    const user = auth.currentUser || customerUser;

    const subtotal = cartTotal;
    const shippingCost = 0; // Free shipping
    const total = subtotal + shippingCost;

    const handlePlaceOrder = async () => {
        if (isCreating) return;

        // 🔥 Check if user is logged in
        if (!user) {
            setAuthModalOpen(true);
            return;
        }

        if (!addressValues.fullName || !addressValues.phoneNumber || !addressValues.streetAddress || !addressValues.city || !addressValues.province) {
            message.error(t.checkout.errors.fillRequired); setCurrentStep("address"); return;
        }

        setIsCreating(true);
        try {
            const newOrderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

            await runTransaction(db, async (transaction) => {
                // 1. Read all product snapshots
                const productSnapshots = await Promise.all(
                    cart.map((item) => transaction.get(doc(db, "products", item.product.id)))
                );

                // 2. Validate stock for each item
                cart.forEach((item, index) => {
                    const snap = productSnapshots[index];
                    if (!snap.exists()) {
                        throw new Error(t.checkout.errors.productNotExists.replace("{name}", item.product.name));
                    }
                    const currentStock = snap.data()?.stockQuantity || 0;
                    if (currentStock < item.quantity) {
                        throw new Error(t.checkout.errors.insufficientStock.replace("{name}", item.product.name).replace("{count}", currentStock.toString()));
                    }
                });

                // 3. Perform updates (Write operations)
                cart.forEach((item, index) => {
                    const snap = productSnapshots[index];
                    const currentStock = snap.data()?.stockQuantity || 0;
                    transaction.update(doc(db, "products", item.product.id), {
                        stockQuantity: currentStock - item.quantity
                    });
                });

                // 4. Create the order
                const orderData = {
                    id: newOrderId,
                    orderId: newOrderId,
                    userId: user.uid,
                    items: cart.map((item) => {
                        const p = item.product.discountPrice ?? item.product.price;
                        return {
                            productId: item.product.id,
                            productName: item.product.name,
                            productImage: item.product.images?.[0] || "",
                            price: p,
                            quantity: item.quantity,
                            userId: user.uid,
                            totalPrice: p * item.quantity,
                            selectedColor: item.product.selectedColor || null,
                            selectedSize: item.product.selectedSize || null,
                        };
                    }),
                    shippingAddress: addressValues,
                    paymentMethod,
                    subtotal: subtotal,
                    shippingCost: shippingCost,
                    total: total,
                    paymentReceiptUrl: receiptUrl || "",
                    paymentStatus: "pending",
                    paymentVerifiedAt: null,
                    paymentVerifiedBy: null,
                    orderStatus: paymentMethod === "cod" ? "PROCESSING" : "PENDING",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    trackingSteps: [
                        { id: "pending", title: t.checkout.tracking.pending.title, description: t.checkout.tracking.pending.desc },
                        { id: "processing", title: t.checkout.tracking.processing.title, description: t.checkout.tracking.processing.desc },
                        { id: "shipping", title: t.checkout.tracking.shipping.title, description: t.checkout.tracking.shipping.desc },
                        { id: "delivered", title: t.checkout.tracking.delivered.title, description: t.checkout.tracking.delivered.desc },
                    ],
                };
                transaction.set(doc(db, "orders", newOrderId), orderData);
            });

            try {
                await addDoc(collection(db, "notifications"), {
                    userId: user.uid,
                    title: t.checkout.orderSuccess,
                    message: t.checkout.orderReceived.replace("{id}", `#${newOrderId.substring(0, 8).toUpperCase()}`),
                    timestamp: Date.now(), type: "order", isRead: false,
                    destination: "order", destinationId: newOrderId,
                });
            } catch (notifError) {
                console.error("Notification creation failed:", notifError);
            }

            setOrderId(newOrderId);
            setCurrentStep("success");
            clearCart();
            message.success(t.checkout.messages.orderPlaced);
        } catch (e: any) {
            console.error("Order error:", e);
            message.error(t.checkout.errors.failed.replace("{message}", e.message || "Unknown error"));
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
                    <Card style={{
                        maxWidth: 500,
                        margin: "0 auto",
                        borderRadius: 24,
                        border: "none",
                        boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.4)" : "0 8px 32px rgba(0,0,0,0.05)",
                        background: isDark ? "#141414" : "#fff"
                    }}>
                        <Empty
                            image={<ShoppingOutlined style={{ fontSize: 64, color: isDark ? "#444" : "#d9d9d9" }} />}
                            description={<Text type="secondary" style={{ fontSize: 18 }}>{t.checkout.emptyCart}</Text>}
                        >
                            <Button type="primary" size="large" onClick={() => navigate("/shop")} style={{ background: "#FF006E", borderRadius: 12, border: "none", height: 48 }}>
                                {t.checkout.continueShopping}
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
                    <Card style={{
                        borderRadius: 32,
                        border: "none",
                        boxShadow: isDark ? "0 12px 48px rgba(0,0,0,0.5)" : "0 12px 48px rgba(0,0,0,0.08)",
                        overflow: "hidden",
                        background: isDark ? "#141414" : "#fff"
                    }}>
                        <Result
                            status="success"
                            title={<Title level={2} style={{ fontWeight: 800 }}>{t.checkout.orderSuccess}</Title>}
                            subTitle={
                                <div style={{ background: isDark ? "#1f1f1f" : "#f9f9f9", padding: 24, borderRadius: 16, marginTop: 24 }}>
                                    <Text style={{ fontSize: 16 }}>
                                        {t.checkout.orderReceived.split("{id}")[0]}
                                        <Text strong style={{ color: "#FF006E" }}>#{orderId}</Text>
                                        {t.checkout.orderReceived.split("{id}")[1]}
                                    </Text>
                                    <br />
                                    <Text>
                                        {t.checkout.orderStatusPendingMessage}
                                    </Text>
                                    <br />
                                    <Text type="secondary">{t.checkout.shippingNotify}</Text>
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
                                    {t.checkout.trackOrder}
                                </Button>,
                                <Button
                                    key="shop"
                                    size="large"
                                    onClick={() => navigate("/shop")}
                                    style={{ borderRadius: 12, height: 48, minWidth: 160 }}
                                >
                                    {t.checkout.continueShopping}
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
        const paymentName = paymentMethod === "aba" ? t.checkout.aba : paymentMethod === "acleda" ? t.checkout.acleda : t.checkout.wing;
        return (
            <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
                <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 0" }}>
                    <Button
                        type="link"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => setCurrentStep("address")}
                        style={{ paddingLeft: 0, marginBottom: 16, color: isDark ? "rgba(255,255,255,0.65)" : "#555" }}
                    >
                        {t.checkout.backToInfo}
                    </Button>

                    <Steps
                        current={1}
                        items={[{ title: t.checkout.steps.info }, { title: t.checkout.steps.payment }, { title: t.checkout.steps.review }]}
                        style={{ marginBottom: 40 }}
                    />

                    <Card style={{
                        borderRadius: 24,
                        border: "none",
                        boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.4)" : "0 8px 32px rgba(0,0,0,0.08)",
                        textAlign: "center",
                        background: isDark ? "#141414" : "#fff"
                    }}>
                        <div style={{ marginBottom: 24 }}>
                            <Title level={3} style={{ margin: 0 }}>{t.checkout.scanToPay.replace("{paymentName}", paymentName)}</Title>
                            <Text type="secondary">{t.checkout.amountToPay} <Text strong style={{ color: "#FF006E", fontSize: 18 }}>${total.toFixed(2)}</Text></Text>
                        </div>

                        <div style={{
                            width: 280,
                            height: 280,
                            margin: "0 auto 32px auto",
                            borderRadius: 24,
                            padding: 20,
                            background: isDark ? "#fff" : "#fff", // Keep QR white for scanning reliability
                            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                            border: isDark ? "1px solid #333" : "1px solid #f0f0f0",
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

                        <div style={{
                            background: isDark ? "#1d1b16" : "#FFFBE6",
                            padding: "12px 16px",
                            borderRadius: 12,
                            border: isDark ? "1px solid #443b11" : "1px solid #FFE58F",
                            marginBottom: 32
                        }}>
                            <Text type="warning" style={{ fontSize: 13, fontWeight: 600 }}>
                                {t.checkout.demoWarning}
                            </Text>
                        </div>

                        {/* Upload Receipt */}
                        <div style={{ marginBottom: 16, textAlign: "left" }}>
                            <Text strong style={{ display: "block", marginBottom: 8 }}>
                                {t.checkout.uploadReceipt.title}
                            </Text>
                            <Text type="secondary" style={{ display: "block", marginBottom: 12, fontSize: 12 }}>
                                {t.checkout.uploadReceipt.subtitle}
                            </Text>

                            <Upload
                                accept="image/*"
                                showUploadList={true}
                                maxCount={1}
                                listType="picture-card"
                                customRequest={async ({ file, onSuccess, onError }: any) => {
                                    setReceiptUploading(true);
                                    try {
                                        const formData = new FormData();
                                        formData.append("file", file);
                                        formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "jongtinh_upload");
                                        formData.append("folder", "payment_receipts");

                                        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
                                        const response = await fetch(
                                            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                                            { method: "POST", body: formData }
                                        );
                                        const data = await response.json();
                                        if (data.secure_url) {
                                            setReceiptUrl(data.secure_url);
                                            onSuccess(data, file);
                                            message.success(t.checkout.uploadReceipt.messages.success);
                                        } else {
                                            throw new Error("Upload failed");
                                        }
                                    } catch (error) {
                                        onError(error);
                                        message.error(t.checkout.uploadReceipt.messages.error);
                                    }
                                    setReceiptUploading(false);
                                }}
                                onRemove={() => {
                                    setReceiptUrl("");
                                }}
                            >
                                {!receiptUrl && (
                                    <div>
                                        <CameraOutlined style={{ fontSize: 24 }} />
                                        <div style={{ marginTop: 8 }}>{t.checkout.uploadReceipt.button}</div>
                                    </div>
                                )}
                            </Upload>

                            {receiptUrl && (
                                <div style={{
                                    marginTop: 8,
                                    padding: "8px 12px",
                                    background: "#f6ffed",
                                    border: "1px solid #b7eb8f",
                                    borderRadius: 8,
                                }}>
                                    <Text style={{ color: "#52c41a", fontSize: 13 }}>
                                        {t.checkout.uploadReceipt.successMessage}
                                    </Text>
                                </div>
                            )}
                        </div>

                        <Space direction="vertical" style={{ width: "100%" }} size={16}>
                            <Button
                                type="primary"
                                size="large"
                                block
                                loading={isCreating || receiptUploading}
                                onClick={handlePlaceOrder}
                                disabled={!receiptUrl}
                                style={{
                                    background: receiptUrl ? "#4CAF50" : "#d9d9d9",
                                    border: "none",
                                    height: 56,
                                    fontSize: 18,
                                    fontWeight: 700,
                                    borderRadius: 16,
                                    boxShadow: receiptUrl ? "0 8px 16px rgba(76, 175, 80, 0.2)" : "none",
                                }}
                            >
                                {receiptUrl ? t.checkout.uploadReceipt.submitButton : t.checkout.uploadReceipt.uploadFirst}
                            </Button>
                            <Button type="text" onClick={() => setCurrentStep("address")} style={{ fontWeight: 600 }}>
                                {t.checkout.cancelPayment}
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
                <Title level={2} style={{ fontWeight: 800, marginBottom: 32 }}>{t.checkout.title}</Title>

                <Steps
                    current={0}
                    items={[{ title: t.checkout.steps.shipping }, { title: t.checkout.steps.payment }, { title: t.checkout.steps.confirm }]}
                    style={{ marginBottom: 48, maxWidth: 600 }}
                />

                <Row gutter={[48, 48]}>
                    <Col xs={24} lg={14}>
                        <Form form={form} layout="vertical" onFinish={handleAddressSubmit} initialValues={addressValues} requiredMark={false}>
                            <Card
                                title={<Title level={4} style={{ margin: 0 }}>{t.checkout.shippingInfo}</Title>}
                                style={{
                                    borderRadius: 24,
                                    border: "none",
                                    boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.05)",
                                    marginBottom: 32,
                                    background: isDark ? "#141414" : "#fff"
                                }}
                                styles={{ body: { padding: 24 } }}
                            >
                                <Row gutter={16}>
                                    <Col span={24}>
                                        <Form.Item name="fullName" label={t.checkout.fullName} rules={[{ required: true, message: t.common.required }]}>
                                            <Input size="large" placeholder={t.checkout.fullNamePlaceholder} style={{ borderRadius: 10 }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item name="phoneNumber" label={t.checkout.phone} rules={[{ required: true, message: t.common.required }]}>
                                            <Input size="large" placeholder={t.checkout.phonePlaceholder} style={{ borderRadius: 10 }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item name="streetAddress" label={t.checkout.address} rules={[{ required: true, message: t.common.required }]}>
                                            <Input size="large" placeholder={t.checkout.addressPlaceholder} style={{ borderRadius: 10 }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="city" label={t.checkout.city} rules={[{ required: true, message: t.common.required }]}>
                                            <Input size="large" placeholder={t.checkout.city} style={{ borderRadius: 10 }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item name="province" label={t.checkout.province} rules={[{ required: true, message: t.common.required }]}>
                                            <Input size="large" placeholder={t.checkout.province} style={{ borderRadius: 10 }} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Card>

                            <Card
                                title={<Title level={4} style={{ margin: 0 }}>{t.checkout.paymentMethod}</Title>}
                                style={{
                                    borderRadius: 24,
                                    border: "none",
                                    boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.05)",
                                    background: isDark ? "#141414" : "#fff"
                                }}
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
                                                border: paymentMethod === 'cod' ? "2px solid #FF006E" : (isDark ? "1px solid #333" : "1px solid #f0f0f0"),
                                                background: paymentMethod === 'cod' ? (isDark ? "rgba(255, 0, 110, 0.1)" : "rgba(255, 0, 110, 0.02)") : (isDark ? "#1f1f1f" : "#fff")
                                            }}
                                            onClick={() => setPaymentMethod('cod')}
                                        >
                                            <Radio value="cod" style={{ width: "100%" }}>
                                                <Space size={12}>
                                                    <DollarOutlined style={{ fontSize: 20, color: "#52c41a" }} />
                                                    <div>
                                                        <Text strong style={{ display: "block" }}>{t.checkout.cod}</Text>
                                                        <Text type="secondary" style={{ fontSize: 12 }}>{t.checkout.codDesc}</Text>
                                                    </div>
                                                </Space>
                                            </Radio>
                                        </Card>

                                        <Card
                                            hoverable
                                            size="small"
                                            style={{
                                                borderRadius: 12,
                                                border: paymentMethod === 'aba' ? "2px solid #FF006E" : (isDark ? "1px solid #333" : "1px solid #f0f0f0"),
                                                background: paymentMethod === 'aba' ? (isDark ? "rgba(255, 0, 110, 0.1)" : "rgba(255, 0, 110, 0.02)") : (isDark ? "#1f1f1f" : "#fff")
                                            }}
                                            onClick={() => setPaymentMethod('aba')}
                                        >
                                            <Radio value="aba" style={{ width: "100%" }}>
                                                <Space size={12}>
                                                    <BankOutlined style={{ fontSize: 20, color: "#005a9c" }} />
                                                    <div>
                                                        <Text strong style={{ display: "block" }}>{t.checkout.aba}</Text>
                                                        <Text type="secondary" style={{ fontSize: 12 }}>{t.checkout.abaDesc}</Text>
                                                    </div>
                                                </Space>
                                            </Radio>
                                        </Card>

                                        <Card
                                            hoverable
                                            size="small"
                                            style={{
                                                borderRadius: 12,
                                                border: paymentMethod === 'acleda' ? "2px solid #FF006E" : (isDark ? "1px solid #333" : "1px solid #f0f0f0"),
                                                background: paymentMethod === 'acleda' ? (isDark ? "rgba(255, 0, 110, 0.1)" : "rgba(255, 0, 110, 0.02)") : (isDark ? "#1f1f1f" : "#fff")
                                            }}
                                            onClick={() => setPaymentMethod('acleda')}
                                        >
                                            <Radio value="acleda" style={{ width: "100%" }}>
                                                <Space size={12}>
                                                    <BankOutlined style={{ fontSize: 20, color: "#ed1c24" }} />
                                                    <div>
                                                        <Text strong style={{ display: "block" }}>{t.checkout.acleda}</Text>
                                                        <Text type="secondary" style={{ fontSize: 12 }}>{t.checkout.acledaDesc}</Text>
                                                    </div>
                                                </Space>
                                            </Radio>
                                        </Card>

                                        <Card
                                            hoverable
                                            size="small"
                                            style={{
                                                borderRadius: 12,
                                                border: paymentMethod === 'wing' ? "2px solid #FF006E" : (isDark ? "1px solid #333" : "1px solid #f0f0f0"),
                                                background: paymentMethod === 'wing' ? (isDark ? "rgba(255, 0, 110, 0.1)" : "rgba(255, 0, 110, 0.02)") : (isDark ? "#1f1f1f" : "#fff")
                                            }}
                                            onClick={() => setPaymentMethod('wing')}
                                        >
                                            <Radio value="wing" style={{ width: "100%" }}>
                                                <Space size={12}>
                                                    <CreditCardOutlined style={{ fontSize: 20, color: "#FFD700" }} />
                                                    <div>
                                                        <Text strong style={{ display: "block" }}>{t.checkout.wing}</Text>
                                                        <Text type="secondary" style={{ fontSize: 12 }}>{t.checkout.wingDesc}</Text>
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
                                {paymentMethod === "cod" ? t.checkout.placeOrder : t.checkout.continueToPayment} — ${total.toFixed(2)}
                            </Button>
                        </Form>
                    </Col>

                    <Col xs={24} lg={10}>
                        <Card
                            style={{
                                borderRadius: 24,
                                border: "none",
                                boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.4)" : "0 8px 32px rgba(0,0,0,0.08)",
                                position: "sticky",
                                top: 100,
                                background: isDark ? "#141414" : "#fff"
                            }}
                            title={<Title level={4} style={{ margin: 0 }}>{t.checkout.orderSummary}</Title>}
                        >
                            <div style={{ maxHeight: 400, overflowY: "auto", marginBottom: 20, paddingRight: 8 }}>
                                {cart.map((item) => {
                                    const p = item.product.discountPrice ?? item.product.price;
                                    return (
                                        <div key={item.product.id} style={{ display: "flex", gap: 16, marginBottom: 20, alignItems: "center" }}>
                                            <Badge count={item.quantity} color="#FF006E" offset={[-2, 2]}>
                                                <img
                                                    src={item.product.images?.[0]}
                                                    style={{
                                                        width: 64,
                                                        height: 64,
                                                        borderRadius: 12,
                                                        objectFit: "cover",
                                                        border: isDark ? "1px solid #333" : "1px solid #f0f0f0"
                                                    }}
                                                />
                                            </Badge>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <Text strong style={{ display: "block", fontSize: 14, marginBottom: 4 }} ellipsis={{ tooltip: item.product.name }}>
                                                    {item.product.name}
                                                </Text>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    ${p.toFixed(2)} {t.checkout.each}
                                                </Text>
                                            </div>
                                            <div style={{ textAlign: "right", minWidth: 80 }}>
                                                <Text strong style={{ fontSize: 15 }}>
                                                    ${(p * item.quantity).toFixed(2)}
                                                </Text>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <Divider style={{ margin: "12px 0" }} />

                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                                <Text type="secondary">{t.cart.subtotal}</Text>
                                <Text strong>${cartTotal.toFixed(2)}</Text>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                                <Text type="secondary">{t.checkout.shippingFee}</Text>
                                <Text strong style={{ color: "#52c41a" }}>{t.checkout.free}</Text>
                            </div>

                            <Divider style={{ margin: "16px 0" }} />

                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                                <Title level={3} style={{ margin: 0 }}>{t.checkout.orderTotal}</Title>
                                <Title level={3} style={{ margin: 0, color: "#FF006E" }}>${total.toFixed(2)}</Title>
                            </div>

                            <div style={{
                                background: isDark ? "#162312" : "#f6ffed",
                                padding: "12px 16px",
                                borderRadius: 12,
                                border: isDark ? "1px solid #274916" : "1px solid #b7eb8f",
                                display: "flex",
                                gap: 10,
                                alignItems: "center"
                            }}>
                                <SafetyCertificateOutlined style={{ color: "#52c41a", fontSize: 20 }} />
                                <Text style={{ fontSize: 12, color: isDark ? "#73d13d" : "#389e0d" }}>{t.checkout.securePayment}</Text>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>
            <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        </ShopLayout>

    );
};
