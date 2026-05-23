import React, { useState, useEffect, useContext, useRef } from "react";
import { Typography, Row, Col, Button, Spin, Empty, Space, Card, Tag, Badge } from "antd";
import { useNavigate } from "react-router";
import { ArrowLeftOutlined, FireOutlined, LeftOutlined, RightOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../../firebase";
import { IProduct } from "../../interfaces";
import { ShopLayout } from "./ShopLayout";
import { ColorModeContext } from "../../contexts/color-mode";
import { ProductCard } from "../../components/shop/ProductCard";
import { useLanguage } from "../../contexts/LanguageContext";

const { Title, Text } = Typography;

export const FlashSalePage: React.FC = () => {
    const navigate = useNavigate();
    const { mode } = useContext(ColorModeContext);
    const { t } = useLanguage();
    const isDark = mode === "dark";

    const [products, setProducts] = useState<IProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const autoScrollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    const [timeLeft, setTimeLeft] = useState({
        hours: 12, minutes: 45, seconds: 30
    });

    useEffect(() => {
        const fetchSaleProducts = async () => {
            try {
                const q = query(
                    collection(db, "products"),
                    where("isAvailable", "==", true),
                    limit(20)
                );
                const querySnapshot = await getDocs(q);
                const allProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IProduct));
                const saleProducts = allProducts.filter(p => !!p.discountPrice);
                setProducts(saleProducts);
            } catch (error) {
                console.error("Error fetching sale products:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSaleProducts();
    }, []);

    // Countdown timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
                if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
                if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
                return { hours: 0, minutes: 0, seconds: 0 };
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Auto-scroll carousel
    useEffect(() => {
        if (products.length === 0 || !scrollRef.current) return;

        const startAutoScroll = () => {
            autoScrollInterval.current = setInterval(() => {
                if (scrollRef.current) {
                    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

                    // If reached the end, scroll back to start
                    if (scrollLeft + clientWidth >= scrollWidth - 10) {
                        scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
                    } else {
                        scrollRef.current.scrollBy({ left: 320, behavior: "smooth" });
                    }
                }
            }, 3000); // Scroll every 3 seconds
        };

        startAutoScroll();

        return () => {
            if (autoScrollInterval.current) {
                clearInterval(autoScrollInterval.current);
            }
        };
    }, [products]);

    const scrollCarousel = (direction: "left" | "right") => {
        // Pause auto-scroll temporarily when user manually scrolls
        if (autoScrollInterval.current) {
            clearInterval(autoScrollInterval.current);
            // Resume after 5 seconds
            autoScrollInterval.current = setInterval(() => {
                if (scrollRef.current) {
                    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
                    if (scrollLeft + clientWidth >= scrollWidth - 10) {
                        scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
                    } else {
                        scrollRef.current.scrollBy({ left: 320, behavior: "smooth" });
                    }
                }
            }, 3000);
        }

        if (scrollRef.current) {
            const scrollAmount = 320;
            scrollRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth"
            });
        }
    };

    const formatTime = (num: number) => String(num).padStart(2, "0");

    return (
        <ShopLayout onSearch={() => {}} setSearchQuery={() => {}} searchQuery="">

            <div style={{ padding: "20px 16px" }}>
                {/* Back Button */}
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(-1)}
                    style={{ marginBottom: 24, borderRadius: 12, fontWeight: 600 }}
                >
                    {t.product.backToShop}
                </Button>

                {/* Hero Banner */}
                <div style={{
                    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                    borderRadius: 24,
                    padding: "40px 32px",
                    marginBottom: 32,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    color: "#fff",
                    position: "relative",
                    overflow: "hidden",
                    border: isDark ? "1px solid #333" : "none",
                }}>
                    {/* Decorative blobs */}
                    <div style={{
                        position: "absolute", top: -30, right: -20,
                        width: 150, height: 150, borderRadius: "50%",
                        background: "rgba(255, 0, 110, 0.2)",
                    }} />
                    <div style={{
                        position: "absolute", bottom: -40, left: -30,
                        width: 200, height: 200, borderRadius: "50%",
                        background: "rgba(255, 190, 11, 0.15)",
                    }} />

                    <div style={{ position: "relative", zIndex: 1 }}>
                        <div style={{ marginBottom: 16 }}>
                            <Tag color="#FF006E" style={{
                                fontSize: 14, fontWeight: 800, padding: "6px 20px",
                                borderRadius: 20, border: "none", letterSpacing: 2,
                            }}>
                                <ThunderboltOutlined /> {t.flashSale.limitedTime}
                            </Tag>
                        </div>

                        <Title level={1} style={{ color: "#fff", margin: "0 0 12px", fontWeight: 900, fontSize: 48 }}>
                            {t.flashSale.title}
                        </Title>
                        <Text style={{ display: "block", color: "rgba(255,255,255,0.85)", fontSize: 18, marginBottom: 24 }}>
                            {t.flashSale.subtitle.replace("{percent}", "70%")}
                        </Text>

                        {/* Countdown Timer */}
                        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 24 }}>
                            {[
                                { label: t.flashSale.hours, value: timeLeft.hours },
                                { label: t.flashSale.mins, value: timeLeft.minutes },
                                { label: t.flashSale.secs, value: timeLeft.seconds },
                            ].map((item) => (
                                <div key={item.label} style={{
                                    background: "rgba(255,255,255,0.1)",
                                    borderRadius: 12,
                                    padding: "12px 16px",
                                    minWidth: 70,
                                    backdropFilter: "blur(10px)",
                                    border: "1px solid rgba(255,255,255,0.2)",
                                }}>
                                    <Text style={{
                                        display: "block", color: "#fff",
                                        fontSize: 28, fontWeight: 900, lineHeight: 1,
                                    }}>
                                        {formatTime(item.value)}
                                    </Text>
                                    <Text style={{
                                        color: "rgba(255,255,255,0.6)",
                                        fontSize: 11, textTransform: "uppercase", letterSpacing: 1,
                                    }}>
                                        {item.label}
                                    </Text>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Product Carousel Section */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: "100px 0" }}>
                        <Spin size="large" />
                    </div>
                ) : products.length > 0 ? (
                    <div>
                        {/* Section Header with Arrows */}
                        <div style={{
                            display: "flex", justifyContent: "space-between",
                            alignItems: "center", marginBottom: 20,
                        }}>
                            <Space size={12}>
                                <FireOutlined style={{ color: "#FF006E", fontSize: 24 }} />
                                <div>
                                    <Title level={3} style={{ margin: 0, fontWeight: 800 }}>
                                        {t.flashSale.hotDeals}
                                    </Title>
                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                        {t.flashSale.scrollHint}
                                    </Text>
                                </div>
                            </Space>
                            <Space>
                                <Button
                                    shape="circle"
                                    icon={<LeftOutlined />}
                                    onClick={() => scrollCarousel("left")}
                                    style={{ border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                                />
                                <Button
                                    shape="circle"
                                    icon={<RightOutlined />}
                                    onClick={() => scrollCarousel("right")}
                                    style={{ border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                                />
                            </Space>
                        </div>

                        {/* Auto-Scrolling Carousel */}
                        <div
                            ref={scrollRef}
                            className="flash-carousel"
                            style={{
                                display: "flex",
                                gap: 16,
                                overflowX: "auto",
                                paddingBottom: 16,
                                scrollbarWidth: "none",
                                msOverflowStyle: "none",
                                WebkitOverflowScrolling: "touch",
                                scrollBehavior: "smooth",
                            }}
                        >
                            {products.map((product) => {
                                const discountPercent = product.discountPrice
                                    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
                                    : 0;

                                return (
                                    <div
                                        key={product.id}
                                        style={{
                                            minWidth: 280,
                                            maxWidth: 280,
                                            flexShrink: 0,
                                            cursor: "pointer",
                                        }}
                                        onClick={() => navigate(`/shop/product/${product.id}`)}
                                    >
                                        <Card
                                            hoverable
                                            style={{
                                                borderRadius: 16,
                                                overflow: "hidden",
                                                border: isDark ? "1px solid #333" : "1px solid #f0f0f0",
                                                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                                height: "100%",
                                            }}
                                            cover={
                                                <div style={{ position: "relative", height: 280, overflow: "hidden" }}>
                                                    <img
                                                        src={product.images?.[0] || "https://via.placeholder.com/300"}
                                                        alt={product.name}
                                                        style={{
                                                            width: "100%",
                                                            height: "100%",
                                                            objectFit: "cover",
                                                            transition: "transform 0.5s ease",
                                                        }}
                                                    />
                                                    {discountPercent > 0 && (
                                                        <div style={{
                                                            position: "absolute", top: 12, left: 12,
                                                            background: "#FF006E", color: "#fff",
                                                            padding: "6px 14px", borderRadius: 8,
                                                            fontWeight: 800, fontSize: 14,
                                                            boxShadow: "0 4px 12px rgba(255,0,110,0.3)",
                                                        }}>
                                                            -{discountPercent}%
                                                        </div>
                                                    )}
                                                    {product.stockQuantity < 20 && product.stockQuantity > 0 && (
                                                        <div style={{
                                                            position: "absolute", top: 12, right: 12,
                                                            background: "rgba(0,0,0,0.7)", color: "#FFBE0B",
                                                            padding: "6px 12px", borderRadius: 8,
                                                            fontSize: 11, fontWeight: 700,
                                                        }}>
                                                            {t.flashSale.onlyLeft.replace("{count}", String(product.stockQuantity))}
                                                        </div>
                                                    )}
                                                </div>
                                            }
                                            bodyStyle={{ padding: 16 }}
                                        >
                                            <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                                {product.category}
                                            </Text>
                                            <Title level={5} style={{ margin: "4px 0 8px", fontSize: 15 }} ellipsis={{ rows: 2 }}>
                                                {product.name}
                                            </Title>
                                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                                                <Text style={{ color: "#faad14", fontSize: 12 }}>★</Text>
                                                <Text strong style={{ fontSize: 12 }}>{product.rating}</Text>
                                                <Text type="secondary" style={{ fontSize: 12 }}>({product.reviewCount})</Text>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                                                <Text strong style={{ color: "#FF006E", fontSize: 22 }}>
                                                    ${product.discountPrice?.toFixed(2)}
                                                </Text>
                                                <Text delete type="secondary" style={{ fontSize: 14 }}>
                                                    ${product.price?.toFixed(2)}
                                                </Text>
                                            </div>
                                            {product.stockQuantity > 0 && (
                                                <div style={{ marginTop: 12 }}>
                                                    <div style={{
                                                        height: 4, background: isDark ? "#333" : "#f0f0f0",
                                                        borderRadius: 2, overflow: "hidden",
                                                    }}>
                                                        <div style={{
                                                            height: "100%",
                                                            width: `${Math.max(5, Math.min(100, (product.stockQuantity / 100) * 100))}%`,
                                                            background: "linear-gradient(90deg, #FF006E, #FFBE0B)",
                                                            borderRadius: 2,
                                                        }} />
                                                    </div>
                                                    <Text type="secondary" style={{ fontSize: 10, marginTop: 4, display: "block" }}>
                                                        {t.flashSale.available.replace("{count}", String(product.stockQuantity))}
                                                    </Text>
                                                </div>
                                            )}
                                        </Card>
                                    </div>
                                );
                            })}
                        </div>

                        <style>{`
                            .flash-carousel::-webkit-scrollbar {
                                display: none;
                            }
                        `}</style>
                    </div>
                ) : (
                    <Empty description={t.flashSale.empty} style={{ padding: "80px 0" }}>
                        <Button type="primary" onClick={() => navigate("/shop")} style={{ background: "#FF006E", border: "none" }}>
                            {t.home.viewAllProducts}
                        </Button>
                    </Empty>
                )}

                {/* Bottom CTA */}
                {products.length > 0 && (
                    <div style={{ textAlign: "center", marginTop: 48, marginBottom: 32 }}>
                        <Button
                            size="large"
                            onClick={() => navigate("/shop")}
                            style={{
                                background: "#FF006E", border: "none", borderRadius: 14,
                                height: 56, fontWeight: 700, fontSize: 18,
                                padding: "0 48px", boxShadow: "0 8px 24px rgba(255, 0, 110, 0.3)",
                            }}
                        >
                            {t.flashSale.viewAll}
                        </Button>
                    </div>
                )}
            </div>
        </ShopLayout>
    );
};