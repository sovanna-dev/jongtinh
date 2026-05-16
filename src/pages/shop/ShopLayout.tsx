import React, { useState } from "react";
import { Layout, Input, Badge, Space, Typography, Button, Drawer, List, Image, message, Tag } from "antd";
import { ShoppingCartOutlined, SearchOutlined, ShoppingOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
import { IProduct } from "../../interfaces";

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

interface CartItem {
    product: IProduct;
    quantity: number;
}

interface ShopLayoutProps {
    children: React.ReactNode;
    cart: CartItem[];
    setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
    searchQuery: string;
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    onSearch: () => void;
}

export const ShopLayout: React.FC<ShopLayoutProps> = ({
    children,
    cart,
    setCart,
    searchQuery,
    setSearchQuery,
    onSearch,
}) => {
    const navigate = useNavigate();
    const [cartOpen, setCartOpen] = useState(false);

    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cart.reduce((sum, item) => sum + item.product.finalPrice * item.quantity, 0);

    const removeFromCart = (productId: string) => {
        setCart((prev) => prev.filter((item) => item.product.id !== productId));
        message.info("Item removed from cart");
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setCart((prev) =>
            prev.map((item) =>
                item.product.id === productId ? { ...item, quantity } : item
            )
        );
    };

    return (
        <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
            {/* Header */}
            <Header
                style={{
                    background: "#fff",
                    padding: "0 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    position: "sticky",
                    top: 0,
                    zIndex: 100,
                }}
            >
                <Space
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate("/shop")}
                >
                    <ShoppingOutlined style={{ fontSize: 28, color: "#FF006E" }} />
                    <Title level={3} style={{ margin: 0, color: "#FF006E" }}>
                        JONGTINH
                    </Title>
                </Space>

                <Space size="large">
                    <Input.Search
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onSearch={onSearch}
                        style={{ width: 300 }}
                        enterButton={<SearchOutlined />}
                    />
                    <Badge count={cartCount} showZero offset={[-5, 5]}>
                        <ShoppingCartOutlined
                            style={{ fontSize: 24, cursor: "pointer" }}
                            onClick={() => setCartOpen(true)}
                        />
                    </Badge>
                </Space>
            </Header>

            {/* Content */}
            <Content style={{ padding: "24px" }}>{children}</Content>

            {/* Footer */}
            <Footer style={{ textAlign: "center", background: "#fff" }}>
                <Space split={<span style={{ color: "#d9d9d9" }}>|</span>}>
                    <a href="/shop">Home</a>
                    <a href="#">About</a>
                    <a href="#">Contact</a>
                    <a href="#">Privacy Policy</a>
                    <a href="#">Terms & Conditions</a>
                </Space>
                <br />
                <Text type="secondary" style={{ marginTop: 8, display: "block" }}>
                    © 2025 JongTinh. All rights reserved.
                </Text>
            </Footer>

            {/* Cart Drawer */}
            <Drawer
                title={`Shopping Cart (${cartCount} items)`}
                open={cartOpen}
                onClose={() => setCartOpen(false)}
                extra={
                    cart.length > 0 && (
                        <Button
                            type="primary"
                            onClick={() => {
                                setCartOpen(false);
                                navigate("/shop/checkout");
                            }}
                            style={{ background: "#FF006E" }}
                        >
                            Checkout
                        </Button>
                    )
                }
            >
                {cart.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 48 }}>
                        <ShoppingCartOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />
                        <p>Your cart is empty</p>
                        <Button onClick={() => setCartOpen(false)}>Continue Shopping</Button>
                    </div>
                ) : (
                    <>
                        <List
                            dataSource={cart}
                            renderItem={(item) => (
                                <List.Item
                                    actions={[
                                        <Button
                                            size="small"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => removeFromCart(item.product.id)}
                                        />,
                                    ]}
                                >
                                    <List.Item.Meta
                                        avatar={
                                            <Image
                                                src={item.product.images?.[0] || "https://via.placeholder.com/60"}
                                                width={60}
                                                height={60}
                                                style={{ objectFit: "cover", borderRadius: 8 }}
                                                fallback="https://via.placeholder.com/60?text=N/A"
                                                preview={false}
                                            />
                                        }
                                        title={item.product.name}
                                        description={
                                            <Space>
                                                <Text>${(item.product.discountPrice ?? item.product.price).toFixed(2)}</Text>
                                                <Button
                                                    size="small"
                                                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                >
                                                    -
                                                </Button>
                                                <Text strong>{item.quantity}</Text>
                                                <Button
                                                    size="small"
                                                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                    disabled={item.quantity >= (item.product.stockQuantity || 99)}
                                                >
                                                    +
                                                </Button>
                                            </Space>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                        <div style={{ textAlign: "right", marginTop: 16, padding: 16, borderTop: "1px solid #f0f0f0" }}>
                            <Title level={4}>
                                Total: <Text style={{ color: "#FF006E" }}>${cartTotal.toFixed(2)}</Text>
                            </Title>
                            <Button
                                type="primary"
                                size="large"
                                block
                                onClick={() => {
                                    setCartOpen(false);
                                    navigate("/shop/checkout");
                                }}
                                style={{ background: "#FF006E", marginTop: 8 }}
                            >
                                Proceed to Checkout
                            </Button>
                        </div>
                    </>
                )}
            </Drawer>
        </Layout>
    );
};