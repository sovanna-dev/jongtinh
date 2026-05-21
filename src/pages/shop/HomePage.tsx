import React, { useState, useEffect, useMemo, useContext } from "react";
import { Row, Col, Typography, Spin, Button, Space, Empty, Card, Tag, message } from "antd";
import { useNavigate } from "react-router";
import { FilterOutlined, CopyOutlined, FireOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { collection, getDocs, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { ICategory, IPromotionBanner, INotification, IProduct } from "../../interfaces";
import { ShopLayout } from "./ShopLayout";
import { ColorModeContext } from "../../contexts/color-mode";
import { BannerCarousel } from "../../components/shop/BannerCarousel";
import { CategoryScroll } from "../../components/shop/CategoryScroll";
import { SubCategoryScroll } from "../../components/shop/SubCategoryScroll";
import { NotificationBanner } from "../../components/shop/NotificationBanner";
import { ProductCard } from "../../components/shop/ProductCard";
import { FilterDrawer } from "../../components/shop/FilterDrawer";
import { useProducts } from "../../hooks/useProducts";

const { Title, Text } = Typography;

// Style tags for "Choose Your Style" section
const STYLE_TAGS = [
    { name: "Acubi", color: "#FF006E" },
    { name: "Street", color: "#8338EC" },
    { name: "Coquette", color: "#3A86FF" },
    { name: "KPOP", color: "#FFBE0B" },
    { name: "Casual", color: "#4CAF50" },
    { name: "Oversized", color: "#FB5607" },
    { name: "Minimal", color: "#00B4D8" },
];

export const ShopHomePage: React.FC = () => {
    const navigate = useNavigate();
    const { mode } = useContext(ColorModeContext);
    const isDark = mode === "dark";

    // --- State ---
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
    const [categories, setCategories] = useState<ICategory[]>([]);
    const [banners, setBanners] = useState<IPromotionBanner[]>([]);
    const [notifications, setNotifications] = useState<INotification[]>([]);
    const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);

    // Filtering & Sorting State
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [sortBy, setSortBy] = useState("createdAt");
    const [activeFilters, setActiveFilters] = useState({
        priceRange: [0, 5000],
        brands: [] as string[],
        inStock: false,
        minRating: 0
    });

    // --- Product Data Hook ---
    const {
        products,
        loading: productsLoading,
        hasMore,
        loadMore,
        loadingMore
    } = useProducts({
        category: selectedCategory,
        subCategory: selectedSubCategory,
        searchQuery: searchQuery,
        sortBy: sortBy,
        pageSize: 12,
        filters: activeFilters
    });

    // --- Derived Data ---
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const newThisWeek = useMemo(() =>
        products.filter(p => (p.createdAt || 0) > sevenDaysAgo).slice(0, 8),
    [products]);

    const bestsellers = useMemo(() =>
        [...products].sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0)).slice(0, 4),
    [products]);

    // --- Helpers ---
    const handleSelectCategory = (categoryId: string | null) => {
        setSelectedCategory(categoryId);
        setSelectedSubCategory(null);
    };

    const currentCategoryData = useMemo(() =>
        categories.find(c => c.id === selectedCategory),
    [categories, selectedCategory]);

    const copyPromoCode = (code: string) => {
        navigator.clipboard.writeText(code);
        message.success(`Code "${code}" copied! Apply at checkout.`);
    };

    // --- Fetching Global Metadata ---
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const categoryQuery = query(collection(db, "categories"), orderBy("name"));
                const categorySnap = await getDocs(categoryQuery);
                setCategories(categorySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ICategory[]);

                const bannerQuery = query(
                    collection(db, "promotion_banners"),
                    where("isActive", "==", true),
                    orderBy("createdAt", "desc"),
                    limit(5)
                );
                const bannerSnap = await getDocs(bannerQuery);
                setBanners(bannerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as IPromotionBanner[]);
            } catch (error) {
                console.error("Error fetching shop metadata:", error);
            }
        };
        fetchMetadata();
    }, []);

    // Real-time Notifications
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;
        const q = query(
            collection(db, "notifications"),
            where("userId", "in", [user.uid, "all"]),
            orderBy("timestamp", "desc"),
            limit(5)
        );
        return onSnapshot(q, (snapshot) => {
            setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as INotification)));
        });
    }, []);

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
            {/* ═══════ 1. HERO BANNERS ═══════ */}
            <BannerCarousel
                banners={banners}
                onBannerClick={(banner) => {
                    if (banner.actionUrl?.startsWith("category/")) {
                        handleSelectCategory(banner.actionUrl.replace("category/", ""));
                    }
                }}
            />

            {/* ═══════ 2. NOTIFICATIONS ═══════ */}
            <NotificationBanner
                notifications={notifications}
                dismissedIds={dismissedNotifications}
                onDismiss={(id) => setDismissedNotifications(prev => [...prev, id])}
                isDark={isDark}
            />

            {/* ═══════ 3. CATEGORIES ═══════ */}
            <div style={{ padding: "0 4px", marginBottom: 24 }}>
                <CategoryScroll
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={handleSelectCategory}
                    isDark={isDark}
                />
                <SubCategoryScroll
                    subCategories={currentCategoryData?.subCategories || []}
                    selectedSubCategory={selectedSubCategory}
                    onSelectSubCategory={setSelectedSubCategory}
                    isDark={isDark}
                />
            </div>

            {/* ═══════ 4. PROMO CODE BANNER ═══════ */}
            <div style={{
                background: "linear-gradient(135deg, #FF006E 0%, #FFBE0B 100%)",
                borderRadius: 20,
                padding: "24px 32px",
                marginBottom: 40,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 16,
                boxShadow: "0 8px 24px rgba(255, 0, 110, 0.2)",
            }}>
                <div>
                    <Title level={3} style={{ color: "#fff", margin: 0, fontWeight: 800 }}>
                        🎉 EXTRA 10% OFF
                    </Title>
                    <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 16 }}>
                        Use code: <Text strong style={{ color: "#fff", fontSize: 20, letterSpacing: 3, textDecoration: "underline" }}>JONG10</Text>
                    </Text>
                </div>
                <Button
                    size="large"
                    icon={<CopyOutlined />}
                    onClick={() => copyPromoCode("JONG10")}
                    style={{
                        background: "#fff",
                        color: "#FF006E",
                        border: "none",
                        borderRadius: 14,
                        height: 48,
                        fontWeight: 700,
                        fontSize: 16,
                        padding: "0 28px",
                    }}
                >
                    Copy Code
                </Button>
            </div>

            {/* ═══════ 5. CHOOSE YOUR STYLE ═══════ */}
            <div style={{ marginBottom: 40 }}>
                <Title level={3} style={{ marginBottom: 16 }}>
                    Choose Your Style
                </Title>
                <Row gutter={[12, 12]}>
                    {STYLE_TAGS.map((style) => (
                        <Col key={style.name}>
                            <Card
                                hoverable
                                onClick={() => navigate(`/shop/search?q=${encodeURIComponent(style.name)}`)}
                                style={{
                                    borderRadius: 16,
                                    width: 130,
                                    height: 90,
                                    textAlign: "center",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: isDark
                                        ? `${style.color}22`
                                        : `${style.color}15`,
                                    border: `2px solid ${style.color}30`,
                                    cursor: "pointer",
                                }}
                                bodyStyle={{ padding: 16 }}
                            >
                                <Text strong style={{ color: style.color, fontSize: 15 }}>
                                    {style.name}
                                </Text>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>

            {/* ═══════ 6. NEW THIS WEEK ═══════ */}
            {newThisWeek.length > 0 && (
                <div style={{ marginBottom: 40 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <Space>
                            <ClockCircleOutlined style={{ color: "#FF006E", fontSize: 22 }} />
                            <Title level={3} style={{ margin: 0 }}>✨ New This Week</Title>
                        </Space>
                        <Button type="link" onClick={() => setSortBy("createdAt")} style={{ fontWeight: 600 }}>
                            View All →
                        </Button>
                    </div>
                    <Row gutter={[16, 16]}>
                        {newThisWeek.map((product) => (
                            <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                                <ProductCard product={product} isDark={isDark} />
                            </Col>
                        ))}
                    </Row>
                </div>
            )}

            {/* ═══════ 7. BESTSELLERS ═══════ */}
            {bestsellers.length > 0 && (
                <div style={{ marginBottom: 40 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <Space>
                            <FireOutlined style={{ color: "#FF006E", fontSize: 22 }} />
                            <Title level={3} style={{ margin: 0 }}>🔥 Weekly Bestsellers</Title>
                        </Space>
                        <Button type="link" onClick={() => setSortBy("rating")} style={{ fontWeight: 600 }}>
                            View All →
                        </Button>
                    </div>
                    <Row gutter={[16, 16]}>
                        {bestsellers.map((product) => (
                            <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                                <ProductCard product={product} isDark={isDark} />
                            </Col>
                        ))}
                    </Row>
                </div>
            )}

            {/* ═══════ 8. ALL PRODUCTS HEADER ═══════ */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginBottom: 24,
                padding: "0 8px",
                borderTop: isDark ? "1px solid #333" : "1px solid #f0f0f0",
                paddingTop: 32,
            }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontSize: 28 }}>
                        {currentCategoryData ? currentCategoryData.name : "All Products"}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 14 }}>
                        {selectedSubCategory
                            ? `Discover our ${currentCategoryData?.subCategories.find(s => s.id === selectedSubCategory)?.name} collection`
                            : "Handpicked quality items for your lifestyle"
                        }
                    </Text>
                </div>

                <Space size={12}>
                    <Button
                        icon={<FilterOutlined />}
                        onClick={() => setIsFilterOpen(true)}
                        style={{ borderRadius: 10, height: 40 }}
                    >
                        Filters
                    </Button>
                    <div style={{ width: 1, height: 24, background: isDark ? "#333" : "#eee" }} />
                    <Button
                        type="text"
                        size="small"
                        style={{ fontWeight: 600 }}
                        onClick={() => setSortBy(s => s === "priceLowHigh" ? "createdAt" : "priceLowHigh")}
                    >
                        {sortBy === "priceLowHigh" ? "💰 Price: Low to High" : "🆕 Newest First"}
                    </Button>
                </Space>
            </div>

            {/* ═══════ 9. PRODUCT GRID ═══════ */}
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
                                    <ProductCard product={product} isDark={isDark} />
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <Empty description="No products found" style={{ padding: "100px 0" }}>
                            <Button type="primary" onClick={() => handleSelectCategory(null)}>
                                View All Products
                            </Button>
                        </Empty>
                    )}

                    {/* Load More */}
                    {hasMore && (
                        <div style={{ textAlign: "center", marginTop: 64, marginBottom: 48 }}>
                            <Button
                                size="large"
                                onClick={loadMore}
                                loading={loadingMore}
                                style={{
                                    borderRadius: 15, minWidth: 240, height: 54,
                                    fontWeight: 700, fontSize: 16,
                                    background: isDark ? "#333" : "#fff",
                                    borderColor: isDark ? "#444" : "#d9d9d9",
                                    boxShadow: isDark ? "0 4px 15px rgba(0,0,0,0.4)" : "0 4px 15px rgba(0,0,0,0.05)"
                                }}
                            >
                                {loadingMore ? "Loading..." : "Discover More Products"}
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
                onReset={() => setActiveFilters({ priceRange: [0, 5000], brands: [], inStock: false, minRating: 0 })}
                isDark={isDark}
            />
        </ShopLayout>
    );
};