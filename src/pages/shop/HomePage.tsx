import React, { useState } from "react";
import { useList } from "@refinedev/core";
import { Row, Col, Card, Typography, Tag, Image, Space, Button, message } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
import { IProduct, ICategory } from "../../interfaces";
import { ShopLayout } from "./ShopLayout";

const { Text } = Typography;
const { Meta } = Card;

interface CartItem {
    product: IProduct;
    quantity: number;
}

export const ShopHomePage: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);

    const { data: productsData, isLoading } = useList<IProduct>({
        resource: "products",
        pagination: { pageSize: 50 },
        filters: selectedCategory
            ? [{ field: "category", operator: "eq", value: selectedCategory }]
            : [],
    });

    const { data: categoriesData } = useList<ICategory>({
        resource: "categories",
        pagination: { pageSize: 20 },
    });

    const products = productsData?.data || [];
    const categories = categoriesData?.data || [];

    const filteredProducts = products.filter((p) =>
        searchQuery ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
    );

    const addToCart = (product: IProduct) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.product.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { product, quantity: 1 }];
        });
        message.success(`${product.name} added to cart!`);
    };

    const handleSearch = () => {
        // Search is already reactive via filter
    };

    return (
        <ShopLayout
            cart={cart}
            setCart={setCart}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearch={handleSearch}
        >
            {/* Categories */}
            <div style={{ marginBottom: 24, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Tag
                    color={selectedCategory === null ? "#FF006E" : "default"}
                    style={{ cursor: "pointer", padding: "4px 16px", fontSize: 14, borderRadius: 20 }}
                    onClick={() => setSelectedCategory(null)}
                >
                    All
                </Tag>
                {categories.map((cat) => (
                    <Tag
                        key={cat.id}
                        color={selectedCategory === cat.id ? "#FF006E" : "default"}
                        style={{ cursor: "pointer", padding: "4px 16px", fontSize: 14, borderRadius: 20 }}
                        onClick={() => setSelectedCategory(cat.id)}
                    >
                        {cat.icon && <Image src={cat.icon} width={16} style={{ marginRight: 4 }} preview={false} />}
                        {cat.name}
                    </Tag>
                ))}
            </div>

            {/* Products Grid */}
            <Row gutter={[16, 16]}>
                {filteredProducts.map((product) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                        <Card
                            hoverable
                            onClick={() => navigate(`/shop/product/${product.id}`)}
                            cover={
                                <Image
                                    src={product.images?.[0] || "https://via.placeholder.com/300"}
                                    alt={product.name}
                                    height={200}
                                    style={{ objectFit: "cover" }}
                                    fallback="https://via.placeholder.com/300?text=No+Image"
                                    preview={false}
                                />
                            }
                            actions={[
                                <Button
                                    type="primary"
                                    icon={<ShoppingCartOutlined />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        addToCart(product);
                                    }}
                                    disabled={!product.isAvailable || product.stockQuantity <= 0}
                                    style={{
                                        background: product.isAvailable && product.stockQuantity > 0 ? "#FF006E" : "#d9d9d9",
                                        border: "none",
                                    }}
                                >
                                    {product.isAvailable && product.stockQuantity > 0 ? "Add to Cart" : "Out of Stock"}
                                </Button>,
                            ]}
                        >
                            <Meta
                                title={
                                    <Text strong style={{ fontSize: 14 }} ellipsis={{ tooltip: product.name }}>
                                        {product.name}
                                    </Text>
                                }
                                description={
                                    <div>
                                        <div style={{ marginBottom: 4 }}>
                                            {product.discountPrice ? (
                                                <Space>
                                                    <Text strong style={{ color: "#FF006E", fontSize: 16 }}>
                                                        ${product.discountPrice.toFixed(2)}
                                                    </Text>
                                                    <Text delete type="secondary" style={{ fontSize: 12 }}>
                                                        ${product.price.toFixed(2)}
                                                    </Text>
                                                    <Tag color="red" style={{ fontSize: 10 }}>
                                                        -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                                                    </Tag>
                                                </Space>
                                            ) : (
                                                <Text strong style={{ fontSize: 16 }}>
                                                    ${product.price.toFixed(2)}
                                                </Text>
                                            )}
                                        </div>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            ⭐ {product.rating} ({product.reviewCount})
                                        </Text>
                                    </div>
                                }
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            {filteredProducts.length === 0 && !isLoading && (
                <div style={{ textAlign: "center", padding: 48 }}>
                    <Text type="secondary" style={{ fontSize: 18 }}>
                        No products found
                    </Text>
                </div>
            )}
        </ShopLayout>
    );
};