import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { Row, Col, Typography, Spin, Button, Space, Empty, Divider } from "antd";
import { ArrowLeftOutlined, FilterOutlined } from "@ant-design/icons";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import { ShopLayout } from "./ShopLayout";
import { ProductCard } from "../../components/shop/ProductCard";
import { FilterDrawer } from "../../components/shop/FilterDrawer";
import { useProducts } from "../../hooks/useProducts";

const { Title, Text, Paragraph } = Typography;

// Style metadata for header images and descriptions
const STYLE_META: Record<string, { title: string; description: string; image: string; color: string }> = {
    acubi: {
        title: "Acubi Style",
        description: "Discover the latest in Acubi Style fashion at JongTinh. Our curated collection features contemporary designs with unique silhouettes and versatile pieces. Elevate your wardrobe with statement items that blend modern aesthetics with everyday wearability.",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200",
        color: "#FF006E",
    },
    street: {
        title: "Street Style",
        description: "Urban streetwear that defines modern culture. Bold designs, comfortable fits, and attitude-packed pieces for your everyday look.",
        image: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1200",
        color: "#8338EC",
    },
    coquette: {
        title: "Coquette Style",
        description: "Feminine, romantic, and playful pieces that embrace soft aesthetics. Lace, bows, and pastels for the dreamy wardrobe.",
        image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1200",
        color: "#3A86FF",
    },
    kpop: {
        title: "KPOP Style",
        description: "Inspired by your favorite K-pop idols. Trendy, bold, and eye-catching pieces that make you stage-ready.",
        image: "https://images.unsplash.com/photo-1612502168967-0126ec0b6ad2?w=1200",
        color: "#FFBE0B",
    },
    casual: {
        title: "Casual Style",
        description: "Effortless everyday looks that prioritize comfort without compromising style. Perfect for any occasion.",
        image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200",
        color: "#4CAF50",
    },
    oversized: {
        title: "Oversized Style",
        description: "Relaxed silhouettes and comfortable fits. Embrace the oversized trend with our carefully selected pieces.",
        image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1200",
        color: "#FB5607",
    },
    minimal: {
        title: "Minimal Style",
        description: "Clean lines, neutral tones, and timeless designs. Less is more with our minimal collection.",
        image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1200",
        color: "#00B4D8",
    },
};

export const StyleCollectionPage: React.FC = () => {
    const { style } = useParams<{ style: string }>();
    const navigate = useNavigate();
    const styleKey = (style || "acubi").toLowerCase();
    const styleMeta = STYLE_META[styleKey] || STYLE_META["acubi"];

    const [searchQuery, setSearchQuery] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [sortBy, setSortBy] = useState("createdAt");
    const [activeFilters, setActiveFilters] = useState({
        priceRange: [0, 5000],
        brands: [] as string[],
        inStock: false,
        minRating: 0,
    });

    // Fetch products filtered by style
    const {
        products,
        loading: productsLoading,
        hasMore,
        loadMore,
        loadingMore,
    } = useProducts({
        searchQuery: styleKey, // Search by style name
        sortBy: sortBy,
        pageSize: 12,
        filters: activeFilters,
    });

    return (
        <ShopLayout
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearch={() => {
                if (searchQuery.trim()) {
                    navigate(`/shop/search?q=${encodeURIComponent(searchQuery.trim())}`);
                }
            }}
        >
            {/* Header Banner */}
            <div
                style={{
                    position: "relative",
                    borderRadius: 20,
                    overflow: "hidden",
                    marginBottom: 32,
                    height: 300,
                }}
            >
                <img
                    src={styleMeta.image}
                    alt={styleMeta.title}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        position: "absolute",
                        top: 0,
                        left: 0,
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 100%)",
                    }}
                />
                <div style={{ position: "absolute", bottom: 32, left: 32, color: "#fff" }}>
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate("/shop")}
                        style={{ marginBottom: 12, color: "#fff", borderColor: "rgba(255,255,255,0.5)" }}
                        ghost
                    >
                        Back to Shop
                    </Button>
                    <Title level={1} style={{ color: "#fff", margin: 0, fontSize: 40, fontWeight: 800 }}>
                        {styleMeta.title}
                    </Title>
                </div>
            </div>

            {/* Description */}
            <Paragraph
                style={{
                    fontSize: 16,
                    color: "#666",
                    lineHeight: 1.8,
                    maxWidth: 800,
                    marginBottom: 32,
                    padding: "0 8px",
                }}
            >
                {styleMeta.description}
            </Paragraph>

            {/* Sort & Filter Bar */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 24,
                    padding: "0 8px",
                }}
            >
                <Text type="secondary">
                    {products.length} products found
                </Text>
                <Space size={12}>
                    <Button
                        icon={<FilterOutlined />}
                        onClick={() => setIsFilterOpen(true)}
                        style={{ borderRadius: 10, height: 40 }}
                    >
                        Filters
                    </Button>
                    <Button
                        type="text"
                        size="small"
                        style={{ fontWeight: 600 }}
                        onClick={() =>
                            setSortBy((s) => (s === "priceLowHigh" ? "createdAt" : "priceLowHigh"))
                        }
                    >
                        {sortBy === "priceLowHigh" ? "💰 Price: Low to High" : "🆕 Newest First"}
                    </Button>
                </Space>
            </div>

            {/* Product Grid */}
            {productsLoading && !loadingMore ? (
                <div style={{ textAlign: "center", padding: "120px 0" }}>
                    <Spin size="large" />
                </div>
            ) : (
                <>
                    {products.length > 0 ? (
                        <Row gutter={[24, 32]}>
                            {products.map((product) => (
                                <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                                    <ProductCard product={product} isDark={false} />
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <Empty description={`No products found in ${styleMeta.title}`} style={{ padding: "100px 0" }}>
                            <Button type="primary" onClick={() => navigate("/shop")}>
                                Browse All Products
                            </Button>
                        </Empty>
                    )}

                    {hasMore && (
                        <div style={{ textAlign: "center", marginTop: 64, marginBottom: 48 }}>
                            <Button
                                size="large"
                                onClick={loadMore}
                                loading={loadingMore}
                                style={{
                                    borderRadius: 15,
                                    minWidth: 240,
                                    height: 54,
                                    fontWeight: 700,
                                    fontSize: 16,
                                }}
                            >
                                {loadingMore ? "Loading..." : "Load More"}
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* Filter Drawer */}
            <FilterDrawer
                visible={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                filters={activeFilters}
                onFilterChange={setActiveFilters}
                onReset={() =>
                    setActiveFilters({ priceRange: [0, 5000], brands: [], inStock: false, minRating: 0 })
                }
                isDark={false}
            />
        </ShopLayout>
    );
};