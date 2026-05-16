import React from "react";
import { useNavigate } from "react-router";
import { Typography, Button, List, Image, Space, Empty } from "antd";
import { DeleteOutlined, ShoppingOutlined } from "@ant-design/icons";
import { IProduct } from "../../interfaces";
import { ShopLayout } from "./ShopLayout";

const { Title, Text } = Typography;

interface CartItem {
    product: IProduct;
    quantity: number;
}

interface CartPageProps {
    cart: CartItem[];
    setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

export const CartPage: React.FC<CartPageProps> = ({ cart, setCart }) => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = React.useState("");

    const cartTotal = cart.reduce((sum, item) => sum + item.product.finalPrice * item.quantity, 0);

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            setCart((prev) => prev.filter((item) => item.product.id !== productId));
            return;
        }
        setCart((prev) =>
            prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
        );
    };

    const removeItem = (productId: string) => {
        setCart((prev) => prev.filter((item) => item.product.id !== productId));
    };

    return (
        <ShopLayout cart={cart} setCart={setCart} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
            <Title level={2}>Shopping Cart</Title>

            {cart.length === 0 ? (
                <Empty
                    description="Your cart is empty"
                    style={{ padding: 48 }}
                >
                    <Button type="primary" onClick={() => navigate("/shop")} icon={<ShoppingOutlined />}>
                        Continue Shopping
                    </Button>
                </Empty>
            ) : (
                <>
                    <List
                        dataSource={cart}
                        renderItem={(item) => (
                            <List.Item
                                actions={[
                                    <Button danger icon={<DeleteOutlined />} onClick={() => removeItem(item.product.id)}>
                                        Remove
                                    </Button>,
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={
                                        <Image
                                            src={item.product.images?.[0] || "https://via.placeholder.com/100"}
                                            width={100}
                                            height={100}
                                            style={{ objectFit: "cover", borderRadius: 8 }}
                                            fallback="https://via.placeholder.com/100?text=N/A"
                                            preview={false}
                                        />
                                    }
                                    title={
                                        <Text
                                            strong
                                            style={{ cursor: "pointer", fontSize: 16 }}
                                            onClick={() => navigate(`/shop/product/${item.product.id}`)}
                                        >
                                            {item.product.name}
                                        </Text>
                                    }
                                    description={
                                        <Text style={{ color: "#FF006E", fontSize: 16 }}>
                                            ${item.product.finalPrice.toFixed(2)}
                                        </Text>
                                    }
                                />
                                <Space>
                                    <Button size="small" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
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
                                    <Text strong style={{ marginLeft: 24 }}>
                                        ${(item.product.finalPrice * item.quantity).toFixed(2)}
                                    </Text>
                                </Space>
                            </List.Item>
                        )}
                    />

                    <div style={{ textAlign: "right", marginTop: 24, padding: 24, background: "#fff", borderRadius: 12 }}>
                        <Title level={3}>
                            Total: <Text style={{ color: "#FF006E" }}>${cartTotal.toFixed(2)}</Text>
                        </Title>
                        <Button
                            type="primary"
                            size="large"
                            onClick={() => navigate("/shop/checkout")}
                            style={{ background: "#FF006E", height: 48, fontSize: 16, marginTop: 16 }}
                        >
                            Proceed to Checkout
                        </Button>
                    </div>
                </>
            )}
        </ShopLayout>
    );
};