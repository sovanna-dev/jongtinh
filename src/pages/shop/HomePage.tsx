import React, { useState, useEffect } from "react";
import { Row, Col, Card, Typography, Tag, Image, Space, Button, message, Spin } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase";
import { IProduct, ICategory } from "../../interfaces";
import { ShopLayout } from "./ShopLayout";
import { useCart } from "../../contexts/CartContext";

const { Title, Text } = Typography;
const { Meta } = Card;

export const ShopHomePage: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [products, setProducts] = useState<IProduct[]>([]);
    const [categories, setCategories] = useState<ICategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addToCart } = useCart();

    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoading(true);
            try {
                let q;
                if (selectedCategory) {
                    q = query(collection(db, "products"), where("category", "==", selectedCategory), orderBy("createdAt", "desc"), limit(50));
                } else {
                    q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(50));
                }
                const snapshot = await getDocs(q);
                setProducts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as IProduct[]);
            } catch (error) { console.error(error); }
            setIsLoading(false);
        };
        fetchProducts();
    }, [selectedCategory]);

    useEffect(() => {
        (async () => {
            try {
                const q = query(collection(db, "categories"), orderBy("name"));
                const snapshot = await getDocs(q);
                setCategories(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ICategory[]);
            } catch (error) { console.error(error); }
        })();
    }, []);

    const filteredProducts = products.filter((p) =>
        searchQuery ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
    );

    return (
        <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}>
            <div style={{ background: "linear-gradient(135deg, #FF006E 0%, #8338EC 100%)", borderRadius: 20, padding: "48px 32px", marginBottom: 32, color: "#fff", textAlign: "center", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
                <div style={{ position: "absolute", bottom: -30, left: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
                <Title level={1} style={{ color: "#fff", marginBottom: 8, fontSize: 40, position: "relative" }}>Welcome to JongTinh</Title>
                <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 18, position: "relative" }}>Discover amazing products at the best prices in Cambodia 🇰🇭</Text>
            </div>

            <div style={{ marginBottom: 24, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Tag color={selectedCategory === null ? "#FF006E" : "default"} style={{ cursor: "pointer", padding: "4px 16px", fontSize: 14, borderRadius: 20 }} onClick={() => setSelectedCategory(null)}>All</Tag>
                {categories.map((cat) => (
                    <Tag key={cat.id} color={selectedCategory === cat.id ? "#FF006E" : "default"} style={{ cursor: "pointer", padding: "4px 16px", fontSize: 14, borderRadius: 20 }} onClick={() => setSelectedCategory(cat.id)}>
                        {cat.icon && <Image src={cat.icon} width={16} style={{ marginRight: 4 }} preview={false} />}{cat.name}
                    </Tag>
                ))}
            </div>

            {isLoading && <div style={{ textAlign: "center", padding: 48 }}><Spin size="large" /></div>}

            {!isLoading && (
                <Row gutter={[16, 16]}>
                    {filteredProducts.map((product) => {
                        const price = product.discountPrice ?? product.price;
                        const isInStock = product.isAvailable && (product.stockQuantity || 0) > 0;
                        return (
                            <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                                <Card hoverable onClick={() => navigate(`/shop/product/${product.id}`)}
                                    cover={<Image src={product.images?.[0] || "https://via.placeholder.com/300"} alt={product.name} height={200} style={{ objectFit: "cover" }} fallback="https://via.placeholder.com/300?text=No+Image" preview={false} />}
                                    actions={[
                                        <Button key="add" type="primary" icon={<ShoppingCartOutlined />}
                                            onClick={(e) => { e.stopPropagation(); addToCart(product); message.success(`${product.name} added!`); }}
                                            disabled={!isInStock} style={{ background: isInStock ? "#FF006E" : "#d9d9d9", border: "none" }}>
                                            {isInStock ? "Add to Cart" : "Out of Stock"}
                                        </Button>,
                                    ]}>
                                    <Meta title={<Text strong style={{ fontSize: 14 }} ellipsis={{ tooltip: product.name }}>{product.name}</Text>}
                                        description={
                                            <div>
                                                <div style={{ marginBottom: 4 }}>
                                                    {product.discountPrice ? (
                                                        <Space>
                                                            <Text strong style={{ color: "#FF006E", fontSize: 16 }}>${product.discountPrice.toFixed(2)}</Text>
                                                            <Text delete type="secondary" style={{ fontSize: 12 }}>${product.price.toFixed(2)}</Text>
                                                            <Tag color="red" style={{ fontSize: 10 }}>-{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%</Tag>
                                                        </Space>
                                                    ) : (
                                                        <Text strong style={{ fontSize: 16 }}>${product.price.toFixed(2)}</Text>
                                                    )}
                                                </div>
                                                <Text type="secondary" style={{ fontSize: 12 }}>⭐ {product.rating} ({product.reviewCount})</Text>
                                            </div>
                                        } />
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}
            {filteredProducts.length === 0 && !isLoading && <div style={{ textAlign: "center", padding: 48 }}><Text type="secondary" style={{ fontSize: 18 }}>No products found</Text></div>}
        </ShopLayout>
    );
};