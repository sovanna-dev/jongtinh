import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { Row, Col, Typography, Image, Tag, Button, Space, Descriptions, Divider, Spin, message } from "antd";
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

    if (isLoading) return <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}><div style={{ textAlign: "center", padding: 100 }}><Spin size="large" /></div></ShopLayout>;
    if (!product) return <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}><div style={{ textAlign: "center", padding: 100 }}><Title level={4}>Product not found</Title><Button onClick={() => navigate("/shop")}>Back to Shop</Button></div></ShopLayout>;

    return (
        <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/shop")} style={{ marginBottom: 16 }}>Back to Shop</Button>
            <Row gutter={[32, 32]}>
                <Col xs={24} md={12}>
                    <Image src={product.images?.[selectedImage] || "https://via.placeholder.com/500"} width="100%" style={{ borderRadius: 12, objectFit: "cover" }} fallback="https://via.placeholder.com/500?text=No+Image" />
                    {product.images && product.images.length > 1 && (
                        <Row gutter={8} style={{ marginTop: 12 }}>
                            {product.images.map((img, i) => (
                                <Col key={i}><Image src={img} width={60} height={60} preview={false} onClick={() => setSelectedImage(i)} style={{ borderRadius: 8, cursor: "pointer", border: selectedImage === i ? "2px solid #FF006E" : "2px solid transparent", objectFit: "cover" }} fallback="https://via.placeholder.com/60" /></Col>
                            ))}
                        </Row>
                    )}
                </Col>
                <Col xs={24} md={12}>
                    <Title level={2}>{product.name}</Title>
                    <Space style={{ marginBottom: 16 }}><Text style={{ fontSize: 18 }}>⭐ {product.rating}</Text><Text type="secondary">({product.reviewCount} reviews)</Text></Space>
                    <div style={{ marginBottom: 24 }}>
                        {product.discountPrice ? (
                            <Space align="end"><Title level={2} style={{ color: "#FF006E", margin: 0 }}>${product.discountPrice.toFixed(2)}</Title><Text delete type="secondary" style={{ fontSize: 18 }}>${product.price.toFixed(2)}</Text><Tag color="red">Save {Math.round(((product.price - product.discountPrice) / product.price) * 100)}%</Tag></Space>
                        ) : <Title level={2} style={{ color: "#FF006E", margin: 0 }}>${product.price.toFixed(2)}</Title>}
                    </div>
                    <Tag color={isInStock ? "green" : "red"} style={{ marginBottom: 16 }}>{isInStock ? `${product.stockQuantity} in stock` : "Out of Stock"}</Tag>
                    <div style={{ marginBottom: 24 }}><Space><Text>Quantity:</Text><Button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={!isInStock}>-</Button><Text strong style={{ fontSize: 16, margin: "0 8px" }}>{quantity}</Text><Button onClick={() => setQuantity(Math.min(product.stockQuantity || 99, quantity + 1))} disabled={!isInStock}>+</Button></Space></div>
                    <Button type="primary" size="large" icon={<ShoppingCartOutlined />}
                        onClick={() => { addToCart(product, quantity); message.success(`${product.name} added!`); }}
                        disabled={!isInStock} style={{ background: isInStock ? "#FF006E" : "#d9d9d9", border: "none", height: 48, fontSize: 16, marginBottom: 24 }}>
                        {isInStock ? "Add to Cart" : "Out of Stock"}
                    </Button>
                    <Divider /><Title level={4}>Description</Title><Text>{product.description}</Text>
                    {product.specifications && Object.keys(product.specifications).length > 0 && <><Divider /><Title level={4}>Specifications</Title><Descriptions bordered size="small" column={1}>{Object.entries(product.specifications).map(([k, v]) => <Descriptions.Item label={k} key={k}>{v}</Descriptions.Item>)}</Descriptions></>}
                    {product.colors && product.colors.length > 0 && <><Divider /><Title level={4}>Colors</Title><Space>{product.colors.map((c) => <div key={c} style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: c, border: "2px solid #d9d9d9" }} />)}</Space></>}
                </Col>
            </Row>
        </ShopLayout>
    );
};