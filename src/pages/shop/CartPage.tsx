import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Typography, Button, List, Image, Space, Empty, Row, Col, Card, Divider } from "antd";
import { DeleteOutlined, ShoppingOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { auth } from "../../firebase";
import { ShopLayout } from "./ShopLayout";
import { useCart } from "../../contexts/CartContext";
import { useCustomerAuth } from "../../contexts/CustomerAuthContext";
import { AuthModal } from "../../components/shop/AuthModal";

const { Title, Text } = Typography;

export const CartPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
    const { user: customerUser } = useCustomerAuth();
    const user = auth.currentUser || customerUser;

    const shipping = cart.length > 0 ? 5.00 : 0;
    const finalTotal = cartTotal + shipping;

    const handleCheckout = () => {
        if (!user) {
            setAuthModalOpen(true);
            return;
        }
        navigate("/shop/checkout");
    };

    return (
        <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
            <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <Button
                        type="link"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate("/shop")}
                        style={{ paddingLeft: 0, color: "#555" }}
                    >
                        Back to Shopping
                    </Button>
                    <Title level={2} style={{ margin: "8px 0 0 0", fontWeight: 800 }}>My Cart</Title>
                </div>
                <Text strong style={{ fontSize: 16 }}>{cart.length} Items</Text>
            </div>

            {cart.length === 0 ? (
                <Card style={{ borderRadius: 24, textAlign: "center", padding: "64px 0", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                    <Empty
                        image={<ShoppingOutlined style={{ fontSize: 64, color: "#d9d9d9" }} />}
                        description={<Text type="secondary" style={{ fontSize: 18 }}>Your shopping cart is empty</Text>}
                    >
                        <Button
                            type="primary"
                            size="large"
                            onClick={() => navigate("/shop")}
                            style={{ background: "#FF006E", borderRadius: 12, height: 48, fontWeight: 600, marginTop: 16 }}
                        >
                            Explore Products
                        </Button>
                    </Empty>
                </Card>
            ) : (
                <Row gutter={[32, 32]}>
                    <Col xs={24} lg={16}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            {cart.map((item) => {
                                const price = item.product.discountPrice ?? item.product.price;
                                return (
                                    <Card
                                        key={item.product.id}
                                        style={{ borderRadius: 20, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                                        styles={{ body: { padding: 16 } }}
                                    >
                                        <Row gutter={16} align="middle">
                                            <Col xs={8} sm={4}>
                                                <Image
                                                    src={item.product.images?.[0] || "https://via.placeholder.com/100"}
                                                    width="100%"
                                                    style={{ aspectRatio: "1/1", objectFit: "cover", borderRadius: 12 }}
                                                    fallback="https://via.placeholder.com/100?text=N/A"
                                                    preview={false}
                                                />
                                            </Col>
                                            <Col xs={16} sm={10}>
                                                <Text strong style={{ fontSize: 16, cursor: "pointer", display: "block" }}
                                                    onClick={() => navigate(`/shop/product/${item.product.id}`)}>
                                                    {item.product.name}
                                                </Text>
                                                {item.product.selectedSize && (
                                                    <Text style={{ fontSize: 12, color: "#FF006E", display: "block" }}>Size: {item.product.selectedSize}</Text>
                                                )}
                                                {item.product.selectedColor && (
                                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                                                        <div style={{
                                                            width: 12, height: 12, borderRadius: "50%",
                                                            backgroundColor: typeof item.product.selectedColor === "string"
                                                                ? item.product.selectedColor
                                                                : item.product.selectedColor?.hex || "#ccc",
                                                            border: "1px solid #d9d9d9"
                                                        }} />
                                                        <Text style={{ fontSize: 12, color: "#666" }}>
                                                            {typeof item.product.selectedColor === "string"
                                                                ? item.product.selectedColor
                                                                : item.product.selectedColor?.name || ""}
                                                        </Text>
                                                    </div>
                                                )}
                                                <Text type="secondary" style={{ fontSize: 12 }}>Unit Price: ${price.toFixed(2)}</Text>
                                            </Col>
                                            <Col xs={14} sm={6} style={{ textAlign: "center" }}>
                                                <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid #f0f0f0", borderRadius: 10, padding: "2px 8px" }}>
                                                    <Button type="text" size="small" onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.product.selectedColor, item.product.selectedSize)}><b>-</b></Button>
                                                    <Text strong style={{ margin: "0 12px", minWidth: 20 }}>{item.quantity}</Text>
                                                    <Button type="text" size="small" onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.product.selectedColor, item.product.selectedSize)} disabled={item.quantity >= (item.product.stockQuantity || 99)}><b>+</b></Button>
                                                </div>
                                            </Col>
                                            <Col xs={6} sm={3} style={{ textAlign: "right" }}>
                                                <Text strong style={{ fontSize: 16 }}>${(price * item.quantity).toFixed(2)}</Text>
                                            </Col>
                                            <Col xs={4} sm={1} style={{ textAlign: "right" }}>
                                                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeFromCart(item.product.id, item.product.selectedColor, item.product.selectedSize)} />
                                            </Col>
                                        </Row>
                                    </Card>
                                );
                            })}
                        </div>
                    </Col>

                    <Col xs={24} lg={8}>
                        <Card
                            style={{ borderRadius: 24, border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.08)", position: "sticky", top: 100 }}
                            title={<Title level={4} style={{ margin: 0 }}>Order Summary</Title>}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                                <Text type="secondary">Subtotal</Text>
                                <Text strong>${cartTotal.toFixed(2)}</Text>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                                <Text type="secondary">Shipping</Text>
                                <Text strong>${shipping.toFixed(2)}</Text>
                            </div>
                            <Divider style={{ margin: "16px 0" }} />
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
                                <Title level={3} style={{ margin: 0 }}>Total</Title>
                                <Title level={3} style={{ margin: 0, color: "#FF006E" }}>${finalTotal.toFixed(2)}</Title>
                            </div>

                            <Button
                                type="primary"
                                size="large"
                                block
                                onClick={handleCheckout}
                                style={{ background: "#FF006E", height: 56, borderRadius: 16, fontSize: 18, fontWeight: 700, border: "none", boxShadow: "0 8px 20px rgba(255, 0, 110, 0.2)" }}
                            >
                                Checkout Now
                            </Button>

                            <div style={{ marginTop: 20, textAlign: "center" }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>Secure payment powered by SmartShop Pay</Text>
                            </div>
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Auth Modal for non-logged-in users */}
            <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        </ShopLayout>
    );
};