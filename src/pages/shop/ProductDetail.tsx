import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { Row, Col, Typography, Image, Tag, Button, Space, Descriptions, Divider, Spin, message } from "antd";
import { ShoppingCartOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { IProduct } from "../../interfaces";
import { ShopLayout } from "./ShopLayout";

const { Title, Text } = Typography;

interface CartItem {
    product: IProduct;
    quantity: number;
}

interface ProductDetailProps {
    cart: CartItem[];
    setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ cart, setCart }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<IProduct | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const docRef = doc(db, "products", id);
                const snapshot = await getDoc(docRef);
                if (snapshot.exists()) {
                    setProduct({ id: snapshot.id, ...snapshot.data() } as IProduct);
                }
            } catch (error) {
                console.error("Failed to fetch product:", error);
            }
            setIsLoading(false);
        };
        fetchProduct();
    }, [id]);

    const isInStock = product?.isAvailable && (product?.stockQuantity || 0) > 0;

    const addToCart = () => {
        if (!product || !isInStock) return;
        setCart((prev) => {
            const existing = prev.find((item) => item.product.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
                );
            }
            return [...prev, { product, quantity }];
        });
        message.success(`${product.name} added to cart!`);
    };

    if (isLoading) {
        return (
            <ShopLayout cart={cart} setCart={setCart} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
                <div style={{ textAlign: "center", padding: 100 }}><Spin size="large" /></div>
            </ShopLayout>
        );
    }

    if (!product) {
        return (
            <ShopLayout cart={cart} setCart={setCart} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
                <div style={{ textAlign: "center", padding: 100 }}>
                    <Title level={4}>Product not found</Title>
                    <Button onClick={() => navigate("/shop")}>Back to Shop</Button>
                </div>
            </ShopLayout>
        );
    }

    const finalPrice = product.discountPrice ?? product.price;

    return (
        <ShopLayout cart={cart} setCart={setCart} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/shop")} style={{ marginBottom: 16 }}>
                Back to Shop
            </Button>

            <Row gutter={[32, 32]}>
                <Col xs={24} md={12}>
                    <Image
                        src={product.images?.[selectedImage] || "https://via.placeholder.com/500"}
                        width="100%"
                        style={{ borderRadius: 12, objectFit: "cover" }}
                        fallback="https://via.placeholder.com/500?text=No+Image"
                    />
                    {product.images && product.images.length > 1 && (
                        <Row gutter={8} style={{ marginTop: 12 }}>
                            {product.images.map((img, index) => (
                                <Col key={index}>
                                    <Image
                                        src={img}
                                        width={60}
                                        height={60}
                                        preview={false}
                                        onClick={() => setSelectedImage(index)}
                                        style={{
                                            borderRadius: 8,
                                            cursor: "pointer",
                                            border: selectedImage === index ? "2px solid #FF006E" : "2px solid transparent",
                                            objectFit: "cover",
                                        }}
                                        fallback="https://via.placeholder.com/60"
                                    />
                                </Col>
                            ))}
                        </Row>
                    )}
                </Col>

                <Col xs={24} md={12}>
                    <Title level={2}>{product.name}</Title>
                    <Space align="center" style={{ marginBottom: 16 }}>
                        <Text style={{ fontSize: 18 }}>⭐ {product.rating}</Text>
                        <Text type="secondary">({product.reviewCount} reviews)</Text>
                    </Space>

                    <div style={{ marginBottom: 24 }}>
                        {product.discountPrice ? (
                            <Space align="end">
                                <Title level={2} style={{ color: "#FF006E", margin: 0 }}>
                                    ${product.discountPrice.toFixed(2)}
                                </Title>
                                <Text delete type="secondary" style={{ fontSize: 18 }}>
                                    ${product.price.toFixed(2)}
                                </Text>
                                <Tag color="red">Save {Math.round(((product.price - product.discountPrice) / product.price) * 100)}%</Tag>
                            </Space>
                        ) : (
                            <Title level={2} style={{ color: "#FF006E", margin: 0 }}>
                                ${product.price.toFixed(2)}
                            </Title>
                        )}
                    </div>

                    <Tag color={isInStock ? "green" : "red"} style={{ marginBottom: 16 }}>
                        {isInStock ? `${product.stockQuantity} in stock` : "Out of Stock"}
                    </Tag>

                    <div style={{ marginBottom: 24 }}>
                        <Space>
                            <Text>Quantity:</Text>
                            <Button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={!isInStock}>-</Button>
                            <Text strong style={{ fontSize: 16, margin: "0 8px" }}>{quantity}</Text>
                            <Button onClick={() => setQuantity(Math.min(product.stockQuantity || 99, quantity + 1))} disabled={!isInStock}>+</Button>
                        </Space>
                    </div>

                    <Button
                        type="primary"
                        size="large"
                        icon={<ShoppingCartOutlined />}
                        onClick={addToCart}
                        disabled={!isInStock}
                        style={{
                            background: isInStock ? "#FF006E" : "#d9d9d9",
                            border: "none",
                            height: 48,
                            fontSize: 16,
                            marginBottom: 24,
                        }}
                    >
                        {isInStock ? "Add to Cart" : "Out of Stock"}
                    </Button>

                    <Divider />
                    <Title level={4}>Description</Title>
                    <Text>{product.description}</Text>

                    {product.specifications && Object.keys(product.specifications).length > 0 && (
                        <>
                            <Divider />
                            <Title level={4}>Specifications</Title>
                            <Descriptions bordered size="small" column={1}>
                                {Object.entries(product.specifications).map(([key, value]) => (
                                    <Descriptions.Item label={key} key={key}>{value}</Descriptions.Item>
                                ))}
                            </Descriptions>
                        </>
                    )}

                    {product.colors && product.colors.length > 0 && (
                        <>
                            <Divider />
                            <Title level={4}>Available Colors</Title>
                            <Space>
                                {product.colors.map((color) => (
                                    <div key={color} style={{
                                        width: 32, height: 32, borderRadius: "50%",
                                        backgroundColor: color, border: "2px solid #d9d9d9",
                                    }} />
                                ))}
                            </Space>
                        </>
                    )}
                </Col>
            </Row>
        </ShopLayout>
    );
};