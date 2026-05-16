import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Typography, Button, List, Image, Space, Empty } from "antd";
import { DeleteOutlined, ShoppingOutlined } from "@ant-design/icons";
import { ShopLayout } from "./ShopLayout";
import { useCart } from "../../contexts/CartContext";

const { Title, Text } = Typography;

export const CartPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();

    return (
        <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
            <Title level={2}>Shopping Cart</Title>
            {cart.length === 0 ? (
                <Empty description="Your cart is empty" style={{ padding: 48 }}>
                    <Button type="primary" onClick={() => navigate("/shop")} icon={<ShoppingOutlined />}>Continue Shopping</Button>
                </Empty>
            ) : (
                <>
                    <List dataSource={cart} renderItem={(item) => {
                        const price = item.product.discountPrice ?? item.product.price;
                        return (
                            <List.Item actions={[<Button danger icon={<DeleteOutlined />} onClick={() => removeFromCart(item.product.id)}>Remove</Button>]}>
                                <List.Item.Meta
                                    avatar={<Image src={item.product.images?.[0] || "https://via.placeholder.com/100"} width={100} height={100} style={{ objectFit: "cover", borderRadius: 8 }} fallback="https://via.placeholder.com/100?text=N/A" preview={false} />}
                                    title={<Text strong style={{ cursor: "pointer", fontSize: 16 }} onClick={() => navigate(`/shop/product/${item.product.id}`)}>{item.product.name}</Text>}
                                    description={<Text style={{ color: "#FF006E", fontSize: 16 }}>${price.toFixed(2)}</Text>} />
                                <Space>
                                    <Button size="small" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>-</Button>
                                    <Text strong>{item.quantity}</Text>
                                    <Button size="small" onClick={() => updateQuantity(item.product.id, item.quantity + 1)} disabled={item.quantity >= (item.product.stockQuantity || 99)}>+</Button>
                                    <Text strong style={{ marginLeft: 24 }}>${(price * item.quantity).toFixed(2)}</Text>
                                </Space>
                            </List.Item>
                        );
                    }} />
                    <div style={{ textAlign: "right", marginTop: 24, padding: 24, background: "#fff", borderRadius: 12 }}>
                        <Title level={3}>Total: <Text style={{ color: "#FF006E" }}>${cartTotal.toFixed(2)}</Text></Title>
                        <Button type="primary" size="large" onClick={() => navigate("/shop/checkout")} style={{ background: "#FF006E", height: 48, fontSize: 16, marginTop: 16 }}>Proceed to Checkout</Button>
                    </div>
                </>
            )}
        </ShopLayout>
    );
};