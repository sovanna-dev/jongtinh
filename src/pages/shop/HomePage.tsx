import React, { useState, useEffect, useMemo, useContext } from "react";
import { Row, Col, Typography, Spin, Button, Space, Empty } from "antd";
import { useNavigate } from "react-router";
import { FilterOutlined } from "@ant-design/icons";
import { collection, getDocs, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { ICategory, IPromotionBanner, INotification } from "../../interfaces";
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
        sortBy: sortBy,
        pageSize: 12,
        filters: activeFilters
    });

    // --- Helpers ---
    const handleSelectCategory = (categoryId: string | null) => {
        setSelectedCategory(categoryId);
        setSelectedSubCategory(null);
    };

    const currentCategoryData = useMemo(() =>
        categories.find(c => c.id === selectedCategory),
    [categories, selectedCategory]);

    // --- Fetching Global Metadata ---
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                // Fetch Categories
                const categoryQuery = query(collection(db, "categories"), orderBy("name"));
                const categorySnap = await getDocs(categoryQuery);
                setCategories(categorySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ICategory[]);

                // Fetch Banners
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
            {/* 1. Hero: Promotion Banners */}
            <BannerCarousel
                banners={banners}
                onBannerClick={(banner) => {
                    if (banner.actionUrl?.startsWith("category/")) {
                        handleSelectCategory(banner.actionUrl.replace("category/", ""));
                    }
                }}
            />

            {/* 2. Personalized Notifications */}
            <NotificationBanner
                notifications={notifications}
                dismissedIds={dismissedNotifications}
                onDismiss={(id) => setDismissedNotifications(prev => [...prev, id])}
                isDark={isDark}
            />

            {/* 3. Navigation: Category & SubCategory */}
            <div style={{ padding: "0 4px", marginBottom: 32 }}>
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

            {/* 4. Section Header & Tools */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginBottom: 24,
                padding: "0 8px"
            }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontSize: 28 }}>
                        {currentCategoryData ? currentCategoryData.name : "Featured Products"}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 14 }}>
                        {selectedSubCategory
                            ? `Discover our collection of ${currentCategoryData?.subCategories.find(s => s.id === selectedSubCategory)?.name}`
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
                    <Space direction="vertical" size={0}>
                        <Text type="secondary" style={{ fontSize: 10, textTransform: "uppercase" }}>Sort</Text>
                        <Button
                            type="text"
                            size="small"
                            style={{ padding: 0, height: 'auto', fontWeight: 600 }}
                            onClick={() => setSortBy(s => s === "priceLowHigh" ? "createdAt" : "priceLowHigh")}
                        >
                            {sortBy === "priceLowHigh" ? "Price: Low to High" : "Newest First"}
                        </Button>
                    </Space>
                </Space>
            </div>

            {/* 5. Product Grid */}
            {productsLoading && !loadingMore ? (
                <div style={{ textAlign: "center", padding: "120px 0" }}>
                    <Spin size="large" tip="Loading amazing products..." />
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
                        <Empty
                            description="No products found matching your selection"
                            style={{ padding: "100px 0" }}
                        >
                            <Button type="primary" onClick={() => handleSelectCategory(null)}>
                                View All Products
                            </Button>
                        </Empty>
                    )}

                    {/* 6. Load More */}
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
                                    background: isDark ? "#333" : "#fff",
                                    borderColor: isDark ? "#444" : "#d9d9d9",
                                    boxShadow: isDark ? "0 4px 15px rgba(0,0,0,0.4)" : "0 4px 15px rgba(0,0,0,0.05)"
                                }}
                            >
                                {loadingMore ? "Loading..." : "Discover More"}
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
