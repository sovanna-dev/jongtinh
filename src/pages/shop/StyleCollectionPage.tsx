import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Row, Col, Typography, Spin, Button, Space, Empty, Image, Dropdown, Breadcrumb } from "antd";
import { InstagramOutlined, DownOutlined, ControlOutlined, RightOutlined, ShareAltOutlined } from "@ant-design/icons";
import { ShopLayout } from "./ShopLayout";
import { ProductCard } from "../../components/shop/ProductCard";
import { FilterDrawer } from "../../components/shop/FilterDrawer";
import { useProducts } from "../../hooks/useProducts";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { IStyle } from "../../interfaces";
import { message, Tooltip } from "antd";
import { useLanguage } from "../../contexts/LanguageContext";

const { Title, Text, Paragraph } = Typography;

const GalleryItem: React.FC<{ img: string; buyNowText: string }> = ({ img, buyNowText }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{ position: "relative", aspectRatio: "1/1", overflow: "hidden", cursor: "pointer" }}
        >
            <Image
                src={img}
                preview={false}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.6s cubic-bezier(0.33, 1, 0.68, 1)",
                    transform: hovered ? "scale(1.08)" : "scale(1)"
                }}
            />
            <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                background: "rgba(0,0,0,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: hovered ? 1 : 0,
                transition: "opacity 0.4s ease",
                pointerEvents: "none"
            }}>
                <div style={{ textAlign: "center", transform: hovered ? "translateY(0)" : "translateY(10px)", transition: "transform 0.4s ease" }}>
                    <InstagramOutlined style={{ fontSize: 24, color: "#fff", display: "block", margin: "0 auto 12px", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }} />
                    <div style={{
                        background: "#000",
                        color: "#fff",
                        padding: "8px 20px",
                        fontSize: 10,
                        fontWeight: 900,
                        letterSpacing: 2,
                        display: "inline-block",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.3)"
                    }}>
                        {buyNowText}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const StyleCollectionPage: React.FC = () => {
    const { t } = useLanguage();
    const { style } = useParams<{ style: string }>();
    const navigate = useNavigate();
    const styleKey = (style || "acubi").toLowerCase();

    const [styleMeta, setStyleMeta] = useState<IStyle | null>(null);
    const [loadingStyle, setLoadingStyle] = useState(true);

    useEffect(() => {
        const fetchStyle = async () => {
            setLoadingStyle(true);
            try {
                const docRef = doc(db, "styles", styleKey);
                const snap = await getDoc(docRef);

                if (snap.exists()) {
                    setStyleMeta({ id: snap.id, ...snap.data() } as IStyle);
                } else {
                    const q = query(collection(db, "styles"), where("slug", "==", styleKey));
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        const styleDoc = querySnapshot.docs[0];
                        setStyleMeta({ id: styleDoc.id, ...styleDoc.data() } as IStyle);
                    }
                }
            } catch (error) {
                console.error("Error fetching style:", error);
            } finally {
                setLoadingStyle(false);
            }
        };
        fetchStyle();
    }, [styleKey]);

    const [searchQuery, setSearchQuery] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [sortBy, setSortBy] = useState("createdAt");
    const [activeFilters, setActiveFilters] = useState({
        priceRange: [0, 5000],
        brands: [] as string[],
        inStock: false,
        minRating: 0,
    });

    const {
        products,
        loading: productsLoading,
        loadMore,
        loadingMore,
        hasMore
    } = useProducts({
        searchQuery: styleMeta?.name || styleKey,
        sortBy: sortBy,
        pageSize: 12,
        filters: activeFilters,
    });

    const handleShare = () => {
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({
                title: `${styleMeta?.name} Style Collection | JongTinh`,
                text: `Explore the ${styleMeta?.name} trend on JongTinh. Curated lifestyle and premium picks.`,
                url: url,
            }).catch(() => {
                navigator.clipboard.writeText(url);
                message.success(t.style.linkCopied);
            });
        } else {
            navigator.clipboard.writeText(url);
            message.success(t.style.linkCopied);
        }
    };

    if (loadingStyle) return <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}><div style={{ textAlign: "center", padding: "120px 0" }}><Spin size="large" /></div></ShopLayout>;

    if (!styleMeta) return <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {}}><Empty description={t.style.notFound} style={{ padding: "100px 0" }}><Button type="primary" onClick={() => navigate("/shop")}>{t.product.backToShop}</Button></Empty></ShopLayout>;

    return (
        <ShopLayout
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearch={() => searchQuery.trim() && navigate(`/shop/search?q=${encodeURIComponent(searchQuery.trim())}`)}
        >
            {/* ═══════ HERO BANNER ═══════ */}
            {styleMeta.bannerImage && (
                <div className="style-hero-banner" style={{
                    position: "relative",
                    width: "100%",
                    borderRadius: 24,
                    overflow: "hidden",
                    marginBottom: 48,
                    background: styleMeta.color || "#f0f0f0"
                }}>
                    <Image
                        src={styleMeta.bannerImage}
                        preview={false}
                        className="style-hero-image"
                        style={{ width: "100%", objectFit: "cover" }}
                    />
                    <div style={{
                        position: "absolute",
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 60%)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                    }} className="style-hero-content">
                        <Title level={1} className="style-hero-title" style={{ color: "#fff", margin: 0, fontWeight: 900, letterSpacing: -2 }}>
                            {styleMeta.title || styleMeta.name}
                        </Title>
                        <Paragraph className="style-hero-desc" style={{ color: "rgba(255,255,255,0.9)", fontSize: 18, maxWidth: 700, margin: "16px 0 0" }}>
                            {styleMeta.description}
                        </Paragraph>
                    </div>
                </div>
            )}

            {/* ═══════ BREADCRUMBS & TITLE ═══════ */}
            <div className="style-header-row" style={{ padding: "0 8px", marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <Breadcrumb
                        className="style-breadcrumb"
                        separator={<RightOutlined style={{ fontSize: 10, color: "#ccc" }} />}
                        items={[
                            { title: <span onClick={() => navigate("/shop")} style={{ cursor: "pointer", color: "#888" }}>{t.style.homepage}</span> },
                            { title: <span style={{ fontWeight: 600 }}>{t.style.title.replace("{name}", styleMeta.name)}</span> },
                        ]}
                        style={{ marginBottom: 12 }}
                    />
                    <Title level={1} className="style-main-title" style={{ margin: 0, fontWeight: 800, fontSize: 42, letterSpacing: -1 }}>
                        {t.style.title.replace("{name}", styleMeta.name)}
                    </Title>
                </div>
                <Tooltip title={t.style.shareCollection}>
                    <Button
                        icon={<ShareAltOutlined />}
                        onClick={handleShare}
                        className="style-share-btn"
                        style={{ borderRadius: "50%", width: 45, height: 45, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #eee", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
                    />
                </Tooltip>
            </div>

            {/* ═══════ LIFESTYLE GALLERY (Image 1 Style) ═══════ */}
            {styleMeta.gallery && styleMeta.gallery.length > 0 && (
                <div style={{ marginBottom: 80 }}>
                    <div style={{ marginBottom: 24, padding: "0 8px" }}>
                        <Text style={{ fontWeight: 700, fontSize: 13, color: "#999", letterSpacing: 1.5 }}>
                            {t.style.styledBy} <span style={{ color: "#111" }}>#{styleMeta.slug?.toUpperCase() || styleMeta.name.toUpperCase()}</span>
                        </Text>
                    </div>

                    <div className="lifestyle-grid" style={{
                        display: "grid",
                        gap: "2px",
                        marginBottom: 32
                    }}>
                        {styleMeta.gallery.map((img, idx) => (
                            <GalleryItem key={idx} img={img} buyNowText={t.product.buyNow} />
                        ))}
                    </div>

                    <div style={{ textAlign: "center" }}>
                        <Button style={{ borderRadius: 0, border: "1px solid #111", height: 40, padding: "0 32px", fontWeight: 600, fontSize: 12 }}>
                            {t.style.loadMore}
                        </Button>
                    </div>
                </div>
            )}

            {/* ═══════ PRODUCT GRID CONTROLS (Image 2 Style) ═══════ */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 40,
                padding: "0 8px",
            }}>
                <Dropdown menu={{ items: [
                    { key: "createdAt", label: t.home.newest },
                    { key: "priceLowHigh", label: t.home.priceLow }
                ], onClick: ({ key }) => setSortBy(key) }} trigger={["click"]}>
                    <Button type="text" style={{ padding: 0, fontWeight: 600, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
                        {sortBy === "createdAt" ? t.home.newest : t.home.priceLow} <DownOutlined style={{ fontSize: 12 }} />
                    </Button>
                </Dropdown>

                <Button
                    type="text"
                    icon={<ControlOutlined />}
                    onClick={() => setIsFilterOpen(true)}
                    style={{ fontWeight: 600, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}
                >
                    {t.style.showFilters}
                </Button>
            </div>

            {productsLoading && !loadingMore ? (
                <div style={{ textAlign: "center", padding: "120px 0" }}><Spin size="large" /></div>
            ) : products.length > 0 ? (
                <Row gutter={[16, 32]}>
                    {products.map((product) => (
                        <Col xs={12} sm={12} md={8} lg={6} key={product.id}>
                            <ProductCard product={product} isDark={false} />
                        </Col>
                    ))}
                </Row>
            ) : (
                <div style={{ textAlign: "center", padding: "100px 48px", background: "#f9f9f9", borderRadius: 20 }}>
                    <Empty description={<Title level={4} style={{ fontWeight: 700 }}>{t.style.noItems}</Title>} />
                </div>
            )}

            <FilterDrawer
                visible={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                filters={activeFilters}
                onFilterChange={setActiveFilters}
                onReset={() => setActiveFilters({
                    priceRange: [0, 5000],
                    brands: [],
                    inStock: false,
                    minRating: 0,
                })}
                isDark={false}
            />

            {/* Infinite Scroll Load More */}
            {hasMore && (
                <div style={{ textAlign: "center", marginTop: 48 }}>
                    <Button
                        loading={loadingMore}
                        onClick={loadMore}
                        style={{ borderRadius: 8, height: 48, padding: "0 40px", fontWeight: 700, border: "2px solid #111" }}
                    >
                        {t.style.loadMoreProducts}
                    </Button>
                </div>
            )}

            <style>{`
                .style-hero-banner, .style-hero-image { height: 450px; }
                .style-hero-content { padding: 60px 48px; }
                .style-hero-title { font-size: 56px !important; }
                .lifestyle-grid { grid-template-columns: repeat(5, 1fr); }

                @media (max-width: 992px) {
                    .lifestyle-grid { grid-template-columns: repeat(3, 1fr); }
                }

                @media (max-width: 768px) {
                    .style-hero-banner, .style-hero-image { height: 320px; }
                    .style-hero-content { padding: 32px 24px; }
                    .style-hero-title { font-size: 32px !important; }
                    .style-hero-desc { font-size: 14px !important; margin-top: 8px !important; }
                    .style-main-title { font-size: 28px !important; }
                    .style-header-row { flex-direction: column; align-items: flex-start !important; gap: 16px; }
                    .style-share-btn { width: 40px !important; height: 40px !important; }
                    .lifestyle-grid { grid-template-columns: repeat(2, 1fr); }
                }
            `}</style>
        </ShopLayout>
    );
};
