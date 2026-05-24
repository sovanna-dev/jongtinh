import React, { useState, useEffect, useMemo, useContext } from "react";
import { Row, Col, Typography, Spin, Button, Space, Empty, Card, Tag, message, Badge, Dropdown, Input } from "antd";
import { useNavigate } from "react-router";

import { collection, getDocs, query, where, orderBy, limit, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { ICategory, IPromotionBanner, INotification, IProduct, IStyle } from "../../interfaces";
import { ShopLayout } from "./ShopLayout";
import { ColorModeContext } from "../../contexts/color-mode";
import { BannerCarousel } from "../../components/shop/BannerCarousel";
import { CategoryScroll } from "../../components/shop/CategoryScroll";
import { SubCategoryScroll } from "../../components/shop/SubCategoryScroll";
import { NotificationBanner } from "../../components/shop/NotificationBanner";
import { ProductCard } from "../../components/shop/ProductCard";
import { FilterDrawer } from "../../components/shop/FilterDrawer";
import { useProducts } from "../../hooks/useProducts";
import { useLanguage } from "../../contexts/LanguageContext";
import { FilterOutlined, CopyOutlined, FireOutlined, ClockCircleOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const STYLE_TAGS = [
    { name: "Acubi", color: "#FF006E", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80", label: "Cyber Aesthetic" },
    { name: "Street", color: "#8338EC", image: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=500&q=80", label: "Urban Vibe" },
    { name: "Coquette", color: "#3A86FF", image: "https://images.unsplash.com/photo-1550614000-4895a10e1bfd?w=500&q=80", label: "Soft & Girly" },
    { name: "KPOP", color: "#FFBE0B", image: "https://images.unsplash.com/photo-1536766820879-059fec98ec0a?w=500&q=80", label: "Idol Style" },
    { name: "Casual", color: "#4CAF50", image: "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=500&q=80", label: "Daily Essential" },
    { name: "Oversized", color: "#FB5607", image: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=500&q=80", label: "Comfy Relaxed" },
    { name: "Minimal", color: "#00B4D8", image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&q=80", label: "Clean & Simple" },
];

export const ShopHomePage: React.FC = () => {
    const navigate = useNavigate();
    const { mode } = useContext(ColorModeContext);
    const { t } = useLanguage();
    const isDark = mode === "dark";

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
    const [categories, setCategories] = useState<ICategory[]>([]);
    const [banners, setBanners] = useState<IPromotionBanner[]>([]);
    const [notifications, setNotifications] = useState<INotification[]>([]);
    const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);
    const [newProducts, setNewProducts] = useState<IProduct[]>([]);
    const [bestsellerProducts, setBestsellerProducts] = useState<IProduct[]>([]);
    const [dynamicStyles, setDynamicStyles] = useState<IStyle[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [sortBy, setSortBy] = useState("createdAt");
    const [activeFilters, setActiveFilters] = useState({
        priceRange: [0, 5000], brands: [] as string[], inStock: false, minRating: 0
    });

    const { products, loading: productsLoading, hasMore, loadMore, loadingMore } = useProducts({
        category: selectedCategory, subCategory: selectedSubCategory, searchQuery, sortBy, pageSize: 12, filters: activeFilters
    });

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (activeFilters.priceRange[0] > 0 || activeFilters.priceRange[1] < 5000) count++;
        if (activeFilters.brands.length > 0) count++;
        if (activeFilters.inStock) count++;
        if (activeFilters.minRating > 0) count++;
        return count;
    }, [activeFilters]);

    const handleSelectCategory = (categoryId: string | null) => {
        setSelectedCategory(categoryId);
        setSelectedSubCategory(null);
        document.getElementById('all-products-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    const currentCategoryData = useMemo(() => categories.find(c => c.id === selectedCategory), [categories, selectedCategory]);

    const copyPromoCode = (code: string) => {
        navigator.clipboard.writeText(code);
        message.success(t.home.linkCopied || `Code "${code}" copied! Apply at checkout.`);
    };

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const categoryQuery = query(collection(db, "categories"), orderBy("name"));
                const categorySnap = await getDocs(categoryQuery);
                setCategories(categorySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ICategory[]);

                const bannerQuery = query(collection(db, "promotion_banners"), where("isActive", "==", true), orderBy("createdAt", "desc"), limit(5));
                const bannerSnap = await getDocs(bannerQuery);
                setBanners(bannerSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as IPromotionBanner[]);

                const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                const newQuery = query(collection(db, "products"), where("createdAt", ">=", sevenDaysAgo), orderBy("createdAt", "desc"), limit(8));
                const newSnap = await getDocs(newQuery);
                setNewProducts(newSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as IProduct[]);

                const bestQuery = query(collection(db, "products"), orderBy("reviewCount", "desc"), limit(4));
                const bestSnap = await getDocs(bestQuery);
                setBestsellerProducts(bestSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as IProduct[]);

                const stylesQuery = query(collection(db, "styles"), where("isActive", "==", true), orderBy("order", "asc"));
                const stylesSnap = await getDocs(stylesQuery);
                if (!stylesSnap.empty) {
                    setDynamicStyles(stylesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as IStyle[]);
                } else {
                    setDynamicStyles(STYLE_TAGS.map((s, i) => ({ id: s.name, ...s, isActive: true, order: i } as IStyle)));
                }
            } catch (error) { console.error("Error:", error); }
        };
        fetchMetadata();
    }, []);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;
        const q = query(collection(db, "notifications"), where("userId", "in", [user.uid, "all"]), orderBy("timestamp", "desc"), limit(5));
        return onSnapshot(q, (snapshot) => {
            setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as INotification)));
        });
    }, []);

    return (
        <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {
            if (searchQuery.trim()) navigate(`/shop/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }}>
            {/* 1. HERO BANNERS */}
            <BannerCarousel banners={banners} onBannerClick={(banner) => {
                if (banner.actionUrl?.startsWith("category/")) handleSelectCategory(banner.actionUrl.replace("category/", ""));
                else if (banner.actionUrl) window.location.href = banner.actionUrl;
            }} />

            {/* 2. FEATURE ICONS */}
            {/* ═══════ FEATURE ICONS (Trust Badges) ═══════ */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 20,
                marginBottom: 32,
                padding: "0 8px",
            }}>
                {[
                    {
                        icon: "🚚",
                        title: t.home.freeShipping,
                        desc: t.home.freeShippingDesc,
                        color: "#E6F7FF",
                        action: () => navigate("/shop/search?q=free+shipping"),
                    },
                    {
                        icon: "🌍",
                        title: t.home.onlineOrder,
                        desc: t.home.onlineOrderDesc,
                        color: "#F6FFED",
                        action: () => navigate("/shop"),
                    },
                    {
                        icon: "💰",
                        title: t.home.saveMoney,
                        desc: t.home.saveMoneyDesc,
                        color: "#FFF7E6",
                        action: () => navigate("/shop/flash-sale"),
                    },
                    {
                        icon: "🏷️",
                        title: t.home.promotions,
                        desc: t.home.promotionsDesc,
                        color: "#FFF0F6",
                        action: () => navigate("/shop/flash-sale"),
                    },
                    {
                        icon: "🎧",
                        title: t.home.support,
                        desc: t.home.supportDesc,
                        color: "#F9F0FF",
                        action: () => navigate("/shop/profile"),
                    },
                    {
                        icon: "🔒",
                        title: t.home.securePayments,
                        desc: t.home.securePaymentsDesc,
                        color: "#E6FFFB",
                        action: () => {
                            message.info(t.home.securePaymentInfo);
                        },
                    },
                ].map((feature) => (
                    <Card
                        key={feature.title}
                        hoverable
                        onClick={feature.action}
                        style={{
                            borderRadius: 16,
                            textAlign: "center",
                            border: "1px solid #f0f0f0",
                            background: isDark ? "#1f1f1f" : feature.color,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                        }}
                        bodyStyle={{ padding: "24px 16px" }}
                    >
                        <Text style={{ fontSize: 32, display: "block", marginBottom: 12 }}>{feature.icon}</Text>
                        <Title level={5} style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700 }}>
                            {feature.title}
                        </Title>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {feature.desc}
                        </Text>
                    </Card>
                ))}
            </div>

            {/* 3. NOTIFICATIONS */}
            <NotificationBanner notifications={notifications} dismissedIds={dismissedNotifications}
                onDismiss={async (id) => { setDismissedNotifications(prev => [...prev, id]); try { await updateDoc(doc(db, "notifications", id), { isRead: true }); } catch (err) { console.error(err); } }}
                isDark={isDark} />

            {/* 4. CATEGORIES */}
            <div style={{ padding: "0 4px", marginBottom: 32 }}>
                <CategoryScroll categories={categories} selectedCategory={selectedCategory} onSelectCategory={handleSelectCategory} isDark={isDark} />
                <SubCategoryScroll subCategories={currentCategoryData?.subCategories || []} selectedSubCategory={selectedSubCategory} onSelectSubCategory={setSelectedSubCategory} isDark={isDark} />
            </div>

            {/* 5. CHOOSE YOUR STYLE */}
            <div style={{ marginBottom: 56 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <Title level={3} style={{ margin: 0, fontWeight: 800 }}>{t.home.chooseStyle}</Title>
                    <Space size={12}>
                        {/* Left Arrow */}
                        <Button
                            shape="circle"
                            size="large"
                            icon={<LeftOutlined />}
                            onClick={() => {
                                const container = document.getElementById("style-scroll");
                                if (container) container.scrollBy({ left: -420, behavior: "smooth" });
                            }}
                            style={{
                                border: "1px solid #e0e0e0",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 10,
                            }}
                        />
                        {/* Right Arrow */}
                        <Button
                            shape="circle"
                            size="large"
                            icon={<RightOutlined />}
                            onClick={() => {
                                const container = document.getElementById("style-scroll");
                                if (container) container.scrollBy({ left: 420, behavior: "smooth" });
                            }}
                            style={{
                                border: "1px solid #e0e0e0",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 10,
                            }}
                        />
                    </Space>
                </div>

                {/* Scrollable Container */}
                <div
                    id="style-scroll"
                    style={{
                        display: "flex",
                        gap: 16,
                        overflowX: "auto",
                        overflowY: "hidden",
                        paddingBottom: 16,
                        paddingLeft: 4,
                        paddingRight: 4,
                        scrollBehavior: "smooth",
                        cursor: "grab",
                        scrollbarWidth: "thin",
                        scrollbarColor: isDark ? "#444 #1f1f1f" : "#d9d9d9 #f5f5f5",
                    }}
                    onWheel={(e) => {
                        // Enable mouse-wheel horizontal scrolling
                        e.preventDefault();
                        const container = e.currentTarget;
                        container.scrollBy({
                            left: e.deltaY > 0 ? 200 : -200,
                            behavior: "smooth",
                        });
                    }}
                    onMouseDown={(e) => {
                        const container = e.currentTarget;
                        container.style.cursor = "grabbing";
                        container.style.userSelect = "none";
                    }}
                    onMouseUp={(e) => {
                        const container = e.currentTarget;
                        container.style.cursor = "grab";
                        container.style.userSelect = "auto";
                    }}
                >
                    {dynamicStyles.map((style) => (
                        <div
                            key={style.id}
                            onClick={() => navigate(`/shop/style/${style.slug || style.id}`)}
                            style={{
                                position: "relative",
                                minWidth: 380,
                                maxWidth: 380,
                                height: 520,
                                borderRadius: 24,
                                overflow: "hidden",
                                cursor: "pointer",
                                flexShrink: 0,
                                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                            }}
                            className="style-card"
                        >
                            {/* Background Image */}
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    backgroundImage: `url(${style.image || style.bannerImage})`,
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    transition: "transform 0.6s ease",
                                }}
                                className="style-card-bg"
                            />
                            {/* Gradient Overlay */}
                            <div style={{
                                position: "absolute",
                                top: 0, left: 0, right: 0, bottom: 0,
                                background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)",
                            }} />
                            {/* Text Content */}
                            <div style={{
                                position: "absolute",
                                bottom: 0, left: 0, right: 0,
                                padding: "24px 20px",
                            }}>
                                <Tag style={{
                                    width: "fit-content",
                                    marginBottom: 12,
                                    background: style.color || "#FF006E",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 6,
                                    fontWeight: 700,
                                    fontSize: 11,
                                    padding: "2px 12px",
                                    letterSpacing: 0.5,
                                }}>
                                    {t.home.trending}
                                </Tag>
                                <Title level={3} style={{
                                    color: "#fff",
                                    margin: "0 0 4px 0",
                                    fontWeight: 900,
                                    letterSpacing: -0.5,
                                    fontSize: 26,
                                    lineHeight: 1.2,
                                }}>
                                    {style.name || style.title}
                                </Title>
                                <Text style={{
                                    color: "rgba(255,255,255,0.8)",
                                    fontSize: 14,
                                    fontWeight: 500,
                                    display: "block",
                                }}>
                                    {style.label || style.description?.substring(0, 60)}
                                </Text>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CSS for hover effects and scrollbar */}
                <style>{`
                    .style-card:hover {
                        transform: translateY(-8px);
                        box-shadow: 0 20px 40px rgba(0,0,0,0.25);
                    }
                    .style-card:hover .style-card-bg {
                        transform: scale(1.08);
                    }
                    #style-scroll::-webkit-scrollbar {
                        height: 6px;
                    }
                    #style-scroll::-webkit-scrollbar-track {
                        background: transparent;
                        border-radius: 3px;
                    }
                    #style-scroll::-webkit-scrollbar-thumb {
                        background: ${isDark ? "#555" : "#d9d9d9"};
                        border-radius: 3px;
                    }
                    #style-scroll::-webkit-scrollbar-thumb:hover {
                        background: ${isDark ? "#777" : "#bbb"};
                    }
                `}</style>
            </div>

            {/* 6. NEW THIS WEEK */}
            {newProducts.length > 0 && (
                <div style={{ marginBottom: 56 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <Space size={12}><div style={{ width: 44, height: 44, borderRadius: 12, background: "#fff0f6", display: "flex", alignItems: "center", justifyContent: "center" }}><ClockCircleOutlined style={{ color: "#FF006E", fontSize: 24 }} /></div><Title level={3} style={{ margin: 0, fontWeight: 800 }}>{t.home.newThisWeek}</Title></Space>
                        <Button type="link" onClick={() => { setSortBy("createdAt"); document.getElementById('all-products-section')?.scrollIntoView({ behavior: 'smooth' }); }} style={{ fontWeight: 700, fontSize: 15 }}>{t.home.viewAll}</Button>
                    </div>
                    <Row gutter={[12, 24]}>{newProducts.map((p) => (<Col xs={12} sm={12} md={8} lg={6} key={p.id}><ProductCard product={p} isDark={isDark} /></Col>))}</Row>
                </div>
            )}

            {/* 7. BESTSELLERS */}
            {bestsellerProducts.length > 0 && (
                <div style={{ marginBottom: 56 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                        <Space size={12}><div style={{ width: 44, height: 44, borderRadius: 12, background: "#fff7e6", display: "flex", alignItems: "center", justifyContent: "center" }}><FireOutlined style={{ color: "#fa8c16", fontSize: 24 }} /></div><Title level={3} style={{ margin: 0, fontWeight: 800 }}>{t.home.bestsellers}</Title></Space>
                        <Button type="link" onClick={() => { setSortBy("rating"); document.getElementById('all-products-section')?.scrollIntoView({ behavior: 'smooth' }); }} style={{ fontWeight: 700, fontSize: 15 }}>{t.home.viewAll}</Button>
                    </div>
                    <Row gutter={[12, 24]}>{bestsellerProducts.map((p) => (<Col xs={12} sm={12} md={8} lg={6} key={p.id}><ProductCard product={p} isDark={isDark} /></Col>))}</Row>
                </div>
            )}

            {/* 8. DEAL BANNER */}
            <div style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=80')", backgroundSize: "cover", backgroundPosition: "center", borderRadius: 24, padding: "80px 32px", marginBottom: 48, textAlign: "center", color: "#fff", position: "relative", overflow: "hidden", minHeight: 340, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                <div style={{ position: "relative", zIndex: 1 }}>
                    <Text style={{ color: "#FF006E", fontSize: 16, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>{t.home.exclusiveOffer}</Text>
                    <Title level={1} style={{ color: "#fff", margin: "12px 0", fontWeight: 900, fontSize: 42 }}>{t.flashSale.subtitle.split("{percent}")[0]}<span style={{ color: "#FF006E", fontSize: 64 }}>70% OFF</span>{t.flashSale.subtitle.split("{percent}")[1]}</Title>
                    <Text style={{ color: "#fff", fontSize: 20, display: "block", marginBottom: 32, fontWeight: 500, textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>{t.flashSale.scrollHint}</Text>
                    <Button size="large" onClick={() => navigate("/shop/flash-sale")} style={{ background: "#FF006E", border: "none", borderRadius: 12, height: 50, fontWeight: 700, fontSize: 16, padding: "0 40px" }}>{t.home.shopNow} →</Button>
                </div>
            </div>

            {/* 9. ALL PRODUCTS */}
            <div id="all-products-section" style={{ marginBottom: 32, padding: "40px 12px 0", borderTop: isDark ? "1px solid #333" : "1px solid #eee" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 20, marginBottom: 32 }}>
                    <div>
                        <Space align="baseline" size={12}><Title level={2} style={{ margin: 0, fontSize: 32, fontWeight: 900 }}>{currentCategoryData ? currentCategoryData.name : t.home.allProducts}</Title><Text type="secondary" style={{ fontSize: 16, fontWeight: 600 }}>{t.home.foundItems.replace("{count}", String(products.length)).replace("{plus}", hasMore ? "+" : "")}</Text></Space>
                        <div style={{ marginTop: 6 }}><Text type="secondary" style={{ fontSize: 15, fontWeight: 400 }}>{selectedSubCategory ? `Discover our exclusive ${currentCategoryData?.subCategories.find(s => s.id === selectedSubCategory)?.name} selection.` : t.home.subtitle}</Text></div>
                    </div>
                    <Space size={16}>
                        <Badge count={activeFilterCount} color="#FF006E" size="small" offset={[-2, 2]}><Button icon={<FilterOutlined />} onClick={() => setIsFilterOpen(true)} style={{ borderRadius: 12, height: 46, padding: "0 24px", fontWeight: 600, fontSize: 15, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>{t.home.filters}</Button></Badge>
                        <div style={{ width: 1, height: 28, background: isDark ? "#444" : "#ddd" }} />
                        <Dropdown menu={{ items: [{ key: "createdAt", label: `🆕 ${t.home.newest}` }, { key: "priceLowHigh", label: `💰 ${t.home.priceLow}` }, { key: "priceHighLow", label: `💸 ${t.home.priceHigh}` }, { key: "rating", label: `⭐ ${t.home.topRated}` }], onClick: ({ key }) => setSortBy(key), selectedKeys: [sortBy] }} trigger={["click"]}>
                            <Button type="text" style={{ fontWeight: 700, height: 46, fontSize: 15, padding: "0 12px", color: "#FF006E" }}>{sortBy === "priceLowHigh" ? t.home.priceLow : sortBy === "priceHighLow" ? t.home.priceHigh : sortBy === "rating" ? t.home.topRated : t.home.newest} ▼</Button>
                        </Dropdown>
                    </Space>
                </div>

                {productsLoading && !loadingMore ? (
                    <div style={{ textAlign: "center", padding: "120px 0" }}><Spin size="large" /></div>
                ) : products.length > 0 ? (
                    <>
                        <Row gutter={[12, 32]}>{products.map((p) => (<Col xs={12} sm={12} md={8} lg={6} key={p.id}><ProductCard product={p} isDark={isDark} /></Col>))}</Row>
                        {hasMore && (
                            <div style={{ textAlign: "center", marginTop: 80, marginBottom: 60 }}>
                                <Button size="large" onClick={loadMore} loading={loadingMore} style={{ borderRadius: 18, minWidth: 280, height: 60, fontWeight: 800, fontSize: 17, background: isDark ? "#1f1f1f" : "#fff", borderColor: "#FF006E", color: "#FF006E", boxShadow: "0 8px 24px rgba(255, 0, 110, 0.12)" }}>{loadingMore ? t.home.loading : t.home.discoverMore}</Button>
                            </div>
                        )}
                    </>
                ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t.home.noProducts} style={{ padding: "100px 0" }}>
                        <Button type="primary" onClick={() => handleSelectCategory(null)} style={{ background: "#FF006E", border: "none" }}>{t.home.viewAllProducts}</Button>
                    </Empty>
                )}
            </div>

            {/* 10. SEASONAL SALE BANNERS */}
            <Row gutter={[16, 16]} style={{ marginBottom: 48 }}>
                {[
                    { title: "SEASONAL SALE", subtitle: "Winter Collection -50% OFF", bg: "#1a1a2e", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600" },
                    { title: "NEW FOOTWEAR", subtitle: "Spring / Summer 2025", bg: "#2d1b69", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600" },
                    { title: "T-SHIRTS", subtitle: "New Trendy Prints", bg: "#1b3a4b", image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600" },
                ].map((item, index) => (
                    <Col xs={24} md={index === 0 ? 24 : 12} key={item.title}>
                        <Card hoverable onClick={() => navigate(`/shop/search?q=${encodeURIComponent(item.title)}`)} style={{ borderRadius: 20, height: index === 0 ? 200 : 220, background: `linear-gradient(135deg, ${item.bg}, ${item.bg}dd)`, border: "none", overflow: "hidden", position: "relative" }} bodyStyle={{ padding: "32px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                            <div style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "100%", backgroundImage: `url(${item.image})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.3 }} />
                            <div style={{ position: "relative", zIndex: 1 }}><Title level={2} style={{ color: "#fff", margin: 0, fontWeight: 900 }}>{item.title}</Title><Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 18 }}>{item.subtitle}</Text></div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* 11. NEWSLETTER */}
            <div style={{ background: isDark ? "#1a1a2e" : "#0d1b2a", borderRadius: 24, padding: "48px 32px", marginBottom: 0, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}>
                <div><Title level={3} style={{ color: "#fff", margin: "0 0 8px", fontWeight: 800 }}>{t.home.newsletterTitle}</Title><Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 16 }}>{t.home.newsletterDesc1}<span style={{ color: "#FF006E", fontWeight: 700 }}>{t.home.newsletterDesc2}</span></Text></div>
                <Space size={12} style={{ width: "100%", maxWidth: 450 }}>
                    <Input placeholder={t.home.emailPlaceholder} size="large" style={{ borderRadius: 12, height: 50, flex: 1 }} />
                    <Button type="primary" size="large" style={{ background: "#FF006E", border: "none", borderRadius: 12, height: 50, fontWeight: 700, padding: "0 32px" }}>{t.home.signUp}</Button>
                </Space>
            </div>

            {/* Filter Drawer */}
            <FilterDrawer visible={isFilterOpen} onClose={() => setIsFilterOpen(false)} filters={activeFilters} onFilterChange={setActiveFilters} onReset={() => setActiveFilters({ priceRange: [0, 5000], brands: [], inStock: false, minRating: 0 })} isDark={isDark} />
        </ShopLayout>
    );
};