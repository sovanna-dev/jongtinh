import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { Row, Col, Typography, Image, Tag, Button, Space, Descriptions, Divider, Spin, message, Card } from "antd";
import { ShoppingCartOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { IProduct } from "../../interfaces";
import { ShopLayout } from "./ShopLayout";
import { useCart } from "../../contexts/CartContext";

const { Title, Text } = Typography;

export const ProductDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<IProduct | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const { addToCart } = useCart();

    useEffect(() => {
        if (!id) return;
        (async () => {
            setIsLoading(true);
            try {
                const snap = await getDoc(doc(db, "products", id));
                if (snap.exists()) setProduct({ id: snap.id, ...snap.data() } as IProduct);
            } catch (e) { console.error(e); }
            setIsLoading(false);
        })();
    }, [id]);

    const isInStock = product?.isAvailable && (product?.stockQuantity || 0) > 0;

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigate(`/shop/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    if (isLoading) return <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={handleSearch}><div style={{ textAlign: "center", padding: 100 }}><Spin size="large" /></div></ShopLayout>;
    if (!product) return <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={handleSearch}><div style={{ textAlign: "center", padding: 100 }}><Title level={4}>Product not found</Title><Button onClick={() => navigate("/shop")}>Back to Shop</Button></div></ShopLayout>;

    return (
        <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={handleSearch}>
            <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/shop")}
                style={{
                    marginBottom: 24,
                    borderRadius: 10,
                    fontWeight: 600,
                    border: "none",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                }}
            >
                Back to Shop
            </Button>

            <Row gutter={[48, 48]}>
                <Col xs={24} md={12}>
                    <div style={{ position: "sticky", top: 100 }}>
                        <Card
                            style={{
                                borderRadius: 24,
                                overflow: "hidden",
                                border: "none",
                                boxShadow: "0 8px 32px rgba(0,0,0,0.08)"
                            }}
                            styles={{ body: { padding: 0 } }}
                        >
                            <Image
                                src={product.images?.[selectedImage] || "https://via.placeholder.com/600"}
                                width="100%"
                                style={{ borderRadius: 0, objectFit: "cover", minHeight: 400 }}
                                fallback="https://via.placeholder.com/600?text=No+Image"
                            />
                        </Card>

                        {product.images && product.images.length > 1 && (
                            <div style={{
                                display: "flex",
                                gap: 12,
                                marginTop: 20,
                                overflowX: "auto",
                                padding: "4px 0",
                                scrollbarWidth: "none"
                            }}>
                                {product.images.map((img, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setSelectedImage(i)}
                                        style={{
                                            flexShrink: 0,
                                            width: 80,
                                            height: 80,
                                            borderRadius: 12,
                                            overflow: "hidden",
                                            cursor: "pointer",
                                            border: selectedImage === i ? "3px solid #FF006E" : "3px solid transparent",
                                            transition: "all 0.2s ease",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                                        }}
                                    >
                                        <img src={img} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Col>

                <Col xs={24} md={12}>
                    <div style={{ padding: "0 8px" }}>
                        <Text type="secondary" style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 }}>{product.category}</Text>
                        <Title level={1} style={{ marginTop: 8, marginBottom: 0, fontSize: 32, fontWeight: 800 }}>{product.name}</Title>
                        {product.brand && (
                            <Text type="secondary" style={{ fontSize: 14, display: "block", marginBottom: 16 }}>
                                by <Text strong style={{ color: "#FF006E" }}>{product.brand}</Text>
                            </Text>
                        )}

                        <Space style={{ marginBottom: 24 }}>
                            <div style={{
                                background: "#FFFBE6",
                                padding: "4px 12px",
                                borderRadius: 12,
                                border: "1px solid #FFE58F",
                                display: "flex",
                                alignItems: "center",
                                gap: 4
                            }}>
                                <Text style={{ color: "#faad14", fontSize: 16 }}>★</Text>
                                <Text strong style={{ fontSize: 16 }}>{product.rating}</Text>
                            </div>
                            <Text type="secondary" style={{ fontSize: 14 }}>({product.reviewCount} verified reviews)</Text>
                        </Space>

                        <div style={{
                            background: "rgba(255, 0, 110, 0.03)",
                            padding: 24,
                            borderRadius: 20,
                            marginBottom: 32,
                            border: "1px dashed rgba(255, 0, 110, 0.2)"
                        }}>
                            {product.discountPrice ? (
                                <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                                    <Title level={1} style={{ color: "#FF006E", margin: 0, fontSize: 42, fontWeight: 800 }}>${product.discountPrice.toFixed(2)}</Title>
                                    <Text delete type="secondary" style={{ fontSize: 20 }}>${product.price.toFixed(2)}</Text>
                                    <Tag color="#FF006E" style={{ borderRadius: 8, border: "none", fontWeight: 700, padding: "4px 12px", fontSize: 14 }}>
                                        Save {Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                                    </Tag>
                                </div>
                            ) : (
                                <Title level={1} style={{ color: "#FF006E", margin: 0, fontSize: 42, fontWeight: 800 }}>${product.price.toFixed(2)}</Title>
                            )}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
                            <div style={{
                                border: "1px solid #d9d9d9",
                                borderRadius: 12,
                                padding: "4px 8px",
                                display: "flex",
                                alignItems: "center",
                                gap: 16
                            }}>
                                <Button type="text" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={!isInStock} icon={<b>-</b>} />
                                <Text strong style={{ fontSize: 18, minWidth: 20, textAlign: "center" }}>{quantity}</Text>
                                <Button type="text" onClick={() => setQuantity(Math.min(product.stockQuantity || 99, quantity + 1))} disabled={!isInStock} icon={<b>+</b>} />
                            </div>
                            <Tag
                                color={isInStock ? "success" : "error"}
                                style={{
                                    borderRadius: 8,
                                    padding: "4px 12px",
                                    fontSize: 14,
                                    fontWeight: 600,
                                    margin: 0
                                }}
                            >
                                {isInStock ? `${product.stockQuantity} items in stock` : "Out of Stock"}
                            </Tag>
                        </div>

                        <Button
                            type="primary"
                            size="large"
                            block
                            icon={<ShoppingCartOutlined style={{ fontSize: 20 }} />}
                            onClick={() => { addToCart(product, quantity); message.success(`${product.name} added to cart!`); }}
                            disabled={!isInStock}
                            style={{
                                background: isInStock ? "#FF006E" : "#d9d9d9",
                                border: "none",
                                height: 60,
                                borderRadius: 16,
                                fontSize: 18,
                                fontWeight: 700,
                                boxShadow: isInStock ? "0 8px 24px rgba(255, 0, 110, 0.25)" : "none",
                                marginBottom: 40
                            }}
                        >
                            {isInStock ? "Add to Cart" : "Out of Stock"}
                        </Button>

                        <Divider />

                        <div style={{ marginBottom: 32 }}>
                            <Title level={4} style={{ fontWeight: 700 }}>Description</Title>
                            <Text style={{ fontSize: 16, lineHeight: 1.8, color: "#444" }}>{product.description}</Text>
                        </div>

                        {product.specifications && Object.keys(product.specifications).length > 0 && (
                            <div style={{ marginBottom: 32 }}>
                                <Title level={4} style={{ fontWeight: 700 }}>Product Specifications</Title>
                                <Descriptions
                                    bordered
                                    size="middle"
                                    column={1}
                                    labelStyle={{ fontWeight: 600, width: "30%", background: "#fafafa" }}
                                    style={{ marginTop: 16, borderRadius: 12, overflow: "hidden" }}
                                >
                                    {Object.entries(product.specifications).map(([k, v]) => (
                                        <Descriptions.Item label={k} key={k}>{v}</Descriptions.Item>
                                    ))}
                                </Descriptions>
                            </div>
                        )}

                        {product.attributes && Object.keys(product.attributes).filter(k => k !== "size").length > 0 && (
                            <div style={{ marginBottom: 32 }}>
                                <Title level={4} style={{ fontWeight: 700 }}>Details</Title>
                                <Descriptions
                                    bordered
                                    size="middle"
                                    column={1}
                                    labelStyle={{ fontWeight: 600, width: "30%", background: "#fafafa" }}
                                    style={{ marginTop: 16, borderRadius: 12, overflow: "hidden" }}
                                >
                                    {Object.entries(product.attributes)
                                        .filter(([key]) => key !== "size")
                                        .map(([key, value]) => (
                                            <Descriptions.Item label={key.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())} key={key}>
                                                {value}
                                            </Descriptions.Item>
                                        ))}
                                </Descriptions>
                            </div>
                        )}

                        {product.colors && product.colors.length > 0 && (
                            <div>
                                <Title level={4} style={{ fontWeight: 700 }}>Available Colors</Title>
                                <Space size={16} style={{ marginTop: 12 }}>
                                    {product.colors.map((c) => (
                                        <div
                                            key={c}
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: "50%",
                                                backgroundColor: c,
                                                border: "3px solid #fff",
                                                boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                                            }}
                                        />
                                    ))}
                                </Space>
                            </div>
                        )}
                    </div>
                </Col>
            </Row>
        </ShopLayout>
    );
};
