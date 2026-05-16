import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Typography, List, Tag, Button, Spin, Empty, Card } from "antd";
import { OrderedListOutlined } from "@ant-design/icons";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { IOrder } from "../../interfaces";
import { ShopLayout } from "./ShopLayout";
import { useCart } from "../../contexts/CartContext";

const { Title, Text } = Typography;
const STATUS_COLORS: Record<string, string> = { PENDING: "#FFBE0B", PROCESSING: "#3A86FF", SHIPPING: "#8338EC", DELIVERED: "#4CAF50", CANCELLED: "#E53935" };

export const OrdersPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [orders, setOrders] = useState<IOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const user = auth.currentUser;
    const { cart } = useCart();

    useEffect(() => {
        if (!user) { setLoading(false); return; }
        (async () => {
            try {
                const q = query(collection(db, "orders"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
                setOrders((await getDocs(q)).docs.map((d) => ({ id: d.id, ...d.data() }) as IOrder));
            } catch (e) { console.error(e); }
            setLoading(false);
        })();
    }, [user]);

    return (
        <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
                <Title level={2}><OrderedListOutlined /> My Orders</Title>
                {loading ? <Spin size="large" style={{ display: "block", margin: "48px auto" }} /> :
                    orders.length === 0 ? <Empty description="No orders yet"><Button type="primary" onClick={() => navigate("/shop")}>Start Shopping</Button></Empty> :
                        <List dataSource={orders} renderItem={(o) => (
                            <Card hoverable onClick={() => navigate(`/shop/order/${o.id}`)} style={{ marginBottom: 12, borderRadius: 12 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div><Text strong>Order #{o.orderId?.substring(0, 8)?.toUpperCase()}</Text><br /><Text type="secondary">{new Date(o.createdAt).toLocaleDateString()} · {o.items?.length || 0} items</Text></div>
                                    <div style={{ textAlign: "right" }}><Tag color={STATUS_COLORS[o.orderStatus]}>{o.orderStatus}</Tag><br /><Text strong style={{ color: "#FF006E" }}>${o.total?.toFixed(2)}</Text></div>
                                </div>
                            </Card>
                        )} />}
            </div>
        </ShopLayout>
    );
};