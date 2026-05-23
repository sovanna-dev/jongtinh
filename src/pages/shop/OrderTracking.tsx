import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { doc, getDoc, collection, query, where, limit, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { Typography, Steps, Card, Descriptions, Tag, Button, Spin, Space } from "antd";
import { IOrder } from "../../interfaces";
import { ShopLayout } from "./ShopLayout";
import { useCart } from "../../contexts/CartContext";
import { useLanguage } from "../../contexts/LanguageContext";

const { Title, Text } = Typography;
const STATUS_COLORS: Record<string, string> = { PENDING: "#FFBE0B", PROCESSING: "#3A86FF", SHIPPING: "#8338EC", DELIVERED: "#4CAF50", CANCELLED: "#E53935" };

export const OrderTracking: React.FC = () => {
    const { t, language } = useLanguage();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [order, setOrder] = useState<IOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { cart } = useCart();

    useEffect(() => {
        if (!id) return;
        (async () => {
            setIsLoading(true);
            try {
                const docRef = doc(db, "orders", id);
                const snap = await getDoc(docRef);
                if (snap.exists()) { setOrder({ id: snap.id, ...snap.data() } as IOrder); }
                else {
                    const q = query(collection(db, "orders"), where("orderId", "==", id), limit(1));
                    const qSnap = await getDocs(q);
                    if (!qSnap.empty) setOrder({ id: qSnap.docs[0].id, ...qSnap.docs[0].data() } as IOrder);
                }
            } catch (e) { console.error(e); }
            setIsLoading(false);
        })();
    }, [id]);

    if (isLoading) return <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}><div style={{ textAlign: "center", padding: 100 }}><Spin size="large" /></div></ShopLayout>;
    if (!order) return <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}><div style={{ textAlign: "center", padding: 100 }}><Title level={4}>{t.order.notFound}</Title><Button onClick={() => navigate("/shop")}>{t.product.backToShop}</Button></div></ShopLayout>;

    const statusOrder = ["PENDING", "PROCESSING", "SHIPPING", "DELIVERED"];
    const currentStep = statusOrder.indexOf(order.orderStatus);

    return (
        <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
                <Button onClick={() => navigate("/shop")} style={{ marginBottom: 16 }}>← {t.product.backToShop}</Button>
                <Card>
                    <Space align="center" style={{ marginBottom: 16 }}><Title level={3} style={{ margin: 0 }}>{t.order.orderId} #{order.orderId?.substring(0, 8)?.toUpperCase()}</Title><Tag color={STATUS_COLORS[order.orderStatus]}>{t.order.status[order.orderStatus as keyof typeof t.order.status] || order.orderStatus}</Tag></Space>
                    <Text type="secondary">{t.order.placedOn} {new Date(order.createdAt).toLocaleString(language === 'km' ? 'km-KH' : 'en-US')}</Text>
                    <Steps current={currentStep >= 0 ? currentStep : 0} status={order.orderStatus === "CANCELLED" ? "error" : "process"} style={{ marginTop: 24, marginBottom: 24 }} items={[{ title: t.order.steps.placed }, { title: t.order.steps.processing }, { title: t.order.steps.shipping }, { title: t.order.steps.delivered }]} />
                    <Descriptions bordered column={2} style={{ marginTop: 24 }}>
                        <Descriptions.Item label={t.order.customer}>{order.shippingAddress?.fullName}</Descriptions.Item>
                        <Descriptions.Item label={t.order.phone}>{order.shippingAddress?.phoneNumber}</Descriptions.Item>
                        <Descriptions.Item label={t.order.address} span={2}>{order.shippingAddress?.streetAddress}, {order.shippingAddress?.city}, {order.shippingAddress?.province}</Descriptions.Item>
                        <Descriptions.Item label={t.order.payment}>
                            {order.paymentMethod === 'aba' ? t.checkout.aba :
                             order.paymentMethod === 'acleda' ? t.checkout.acleda :
                             order.paymentMethod === 'wing' ? t.checkout.wing :
                             order.paymentMethod === 'cod' ? t.checkout.cod :
                             order.paymentMethod?.toUpperCase()}
                        </Descriptions.Item>
                        <Descriptions.Item label={t.order.total}><Text strong style={{ color: "#FF006E" }}>${order.total?.toFixed(2)}</Text></Descriptions.Item>
                    </Descriptions>
                    <Title level={4} style={{ marginTop: 24 }}>{t.order.items}</Title>
                    {order.items?.map((item, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
                            <div>
                                <Text strong>{item.productName}</Text>
                                <div style={{ fontSize: 12, marginTop: 4 }}>
                                    {item.selectedSize && <Tag color="blue">{t.product.size}: {item.selectedSize}</Tag>}
                                    {item.selectedColor && (
                                        <Tag
                                            color={typeof item.selectedColor === 'string' ? 'default' : 'default'}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                        >
                                            {t.product.colors}:
                                            <div style={{
                                                width: 10, height: 10, borderRadius: '50%',
                                                backgroundColor: typeof item.selectedColor === 'string' ? item.selectedColor : item.selectedColor.hex,
                                                border: '1px solid #d9d9d9'
                                            }} />
                                            {typeof item.selectedColor === 'string' ? item.selectedColor : item.selectedColor.name}
                                        </Tag>
                                    )}
                                    <Text type="secondary" style={{ marginLeft: 8 }}>x {item.quantity}</Text>
                                </div>
                            </div>
                            <Text strong>${(item.price * item.quantity).toFixed(2)}</Text>
                        </div>
                    ))}
                </Card>
            </div>
        </ShopLayout>
    );
};