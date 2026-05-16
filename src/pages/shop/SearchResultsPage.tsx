import React, { useState, useEffect } from "react";
import { Row, Col, Card, Typography, Tag, Image, Space, Button, message, Spin, Breadcrumb, Empty } from "antd";
import { ShoppingCartOutlined, HomeOutlined, SearchOutlined } from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "../../firebase";
import { IProduct } from "../../interfaces";
import { ShopLayout } from "./ShopLayout";
import { useCart } from "../../contexts/CartContext";

const { Title, Text } = Typography;

export const SearchResultsPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const queryTerm = searchParams.get("q") || "";

    const [searchQuery, setSearchQuery] = useState(queryTerm);
    const [products, setProducts] = useState<IProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addToCart } = useCart();

    useEffect(() => {
        setSearchQuery(queryTerm);
        fetchSearchResults(queryTerm);
    }, [queryTerm]);

    const fetchSearchResults = async (term: string) => {
        setIsLoading(true);
        try {
            // Firestore doesn't support full-text search well.
            // For this demo, we'll fetch all products and filter client-side,
            // or we could use a better approach if the dataset was huge.
            const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);

            const allProducts = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            })) as IProduct[];

            if (!term) {
                setProducts(allProducts);
            } else {
                const filtered = allProducts.filter(p =>
                    p.name.toLowerCase().includes(term.toLowerCase()) ||
                    p.category?.toLowerCase().includes(term.toLowerCase()) ||
                    p.description?.toLowerCase().includes(term.toLowerCase())
                );
                setProducts(filtered);
            }
        } catch (error) {
            console.error("Failed to fetch search results:", error);
            message.error("Failed to perform search");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigate(`/shop/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={handleSearch}>
            <div style={{ marginBottom: 24 }}>
                <Breadcrumb
                    items={[
                        { title: <><HomeOutlined /> <span>Home</span></>, onClick: () => navigate("/shop"), className: "cursor-pointer" },
                        { title: "Search Results" },
                    ]}
                />
            </div>

            <div style={{ marginBottom: 32 }}>
                <Title level={2}>
                    <SearchOutlined style={{ marginRight: 12, color: "#FF006E" }} />
                    {queryTerm ? `Search results for "${queryTerm}"` : "All Products"}
                </Title>
                <Text type="secondary">{products.length} products found</Text>
            </div>

            {isLoading ? (
                <div style={{ textAlign: "center", padding: "100px 0" }}>
                    <Spin size="large" tip="Searching..." />
                </div>
            ) : products.length > 0 ? (
                <Row gutter={[24, 24]}>
                    {products.map((product) => {
                        const price = product.discountPrice ?? product.price;
                        const isInStock = product.isAvailable && (product.stockQuantity || 0) > 0;
                        return (
                            <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                                <Card
                                    hoverable
                                    onClick={() => navigate(`/shop/product/${product.id}`)}
                                    style={{
                                        borderRadius: 20,
                                        overflow: "hidden",
                                        border: "none",
                                        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                                        height: "100%",
                                        display: "flex",
                                        flexDirection: "column"
                                    }}
                                    bodyStyle={{ padding: 16, flex: 1, display: "flex", flexDirection: "column" }}
                                    cover={
                                        <div style={{ position: "relative", height: 220, overflow: "hidden" }}>
                                            <Image
                                                src={product.images?.[0] || "https://via.placeholder.com/300"}
                                                alt={product.name}
                                                height="100%"
                                                width="100%"
                                                style={{ objectFit: "cover" }}
                                                fallback="https://via.placeholder.com/300?text=No+Image"
                                                preview={false}
                                            />
                                            {!isInStock && (
                                                <div style={{
                                                    position: "absolute",
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    background: "rgba(0,0,0,0.4)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    zIndex: 2
                                                }}>
                                                    <Tag color="default" style={{ padding: "4px 12px", borderRadius: 12, fontWeight: 700 }}>OUT OF STOCK</Tag>
                                                </div>
                                            )}
                                        </div>
                                    }
                                >
                                    <div style={{ flex: 1 }}>
                                        <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase" }}>{product.category}</Text>
                                        <Title level={5} style={{ marginTop: 4, marginBottom: 8, fontSize: 16 }} ellipsis={{ rows: 2 }}>{product.name}</Title>
                                        <div style={{ marginBottom: 16 }}>
                                            {product.discountPrice ? (
                                                <Space>
                                                    <Text strong style={{ color: "#FF006E", fontSize: 20 }}>${product.discountPrice.toFixed(2)}</Text>
                                                    <Text delete type="secondary" style={{ fontSize: 14 }}>${product.price.toFixed(2)}</Text>
                                                </Space>
                                            ) : (
                                                <Text strong style={{ fontSize: 20 }}>${product.price.toFixed(2)}</Text>
                                            )}
                                        </div>
                                    </div>

                                    <Button
                                        block
                                        type="primary"
                                        icon={<ShoppingCartOutlined />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            addToCart(product);
                                            message.success(`${product.name} added to cart!`);
                                        }}
                                        disabled={!isInStock}
                                        style={{
                                            height: 40,
                                            borderRadius: 12,
                                            background: isInStock ? "#FF006E" : "#d9d9d9",
                                            border: "none",
                                            fontWeight: 600
                                        }}
                                    >
                                        {isInStock ? "Add to Cart" : "Out of Stock"}
                                    </Button>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            ) : (
                <div style={{ padding: "80px 0" }}>
                    <Empty
                        description={
                            <span>
                                No products found for "<strong>{queryTerm}</strong>"
                            </span>
                        }
                    >
                        <Button type="primary" onClick={() => navigate("/shop")} style={{ background: "#FF006E", border: "none", borderRadius: 10 }}>
                            Back to Shop
                        </Button>
                    </Empty>
                </div>
            )}
        </ShopLayout>
    );
};
