import React, { useState, useEffect, useRef } from "react";
import { Row, Col, Card, Typography, Tag, Image, Space, Button, message, Spin, Carousel } from "antd";
import { ShoppingCartOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
import { collection, getDocs, query, where, orderBy, limit, startAfter, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import Lottie from "lottie-react";
import { db } from "../../firebase";
import { IProduct, ICategory, IPromotionBanner } from "../../interfaces";
import { ShopLayout } from "./ShopLayout";
import { useCart } from "../../contexts/CartContext";
import logo from "../../images/logo.webp";

// Map category names to Lottie animation files
const categoryAnimations: Record<string, string> = {
    "Electronics": "iphone.json",
    "Beauty": "beauty.json",
    "Food": "fruits.json",
    "Groceries": "fruit_basket.json",
    "Fashion": "cosmetic.json",
    "Lifestyle": "onboarding_shopping.json",
};

const { Title, Text } = Typography;

export const ShopHomePage: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [products, setProducts] = useState<IProduct[]>([]);
    const [categories, setCategories] = useState<ICategory[]>([]);
    const [banners, setBanners] = useState<IPromotionBanner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 12;
    const { addToCart } = useCart();
    const categoryCarouselRef = useRef<any>(null);

    // Fetch banners
    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const q = query(
                    collection(db, "promotion_banners"),
                    where("isActive", "==", true),
                    orderBy("createdAt", "desc"),
                    limit(5)
                );
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as IPromotionBanner[];
                setBanners(data);
            } catch (error) {
                console.error("Failed to fetch banners:", error);
            }
        };
        fetchBanners();
    }, []);

    // Fetch products
    const fetchProducts = async (isNextPage = false) => {
        if (isNextPage) {
            setIsLoadingMore(true);
        } else {
            setIsLoading(true);
            setLastDoc(null);
        }

        try {
            const constraints: any[] = [
                orderBy("createdAt", "desc"),
                limit(PAGE_SIZE)
            ];

            if (selectedCategory) {
                constraints.unshift(where("category", "==", selectedCategory));
            }

            if (isNextPage && lastDoc) {
                constraints.push(startAfter(lastDoc));
            }

            const q = query(collection(db, "products"), ...constraints);
            const snapshot = await getDocs(q);

            const newProducts = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            })) as IProduct[];

            if (isNextPage) {
                setProducts(prev => [...prev, ...newProducts]);
            } else {
                setProducts(newProducts);
            }

            setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
            setHasMore(snapshot.docs.length === PAGE_SIZE);
        } catch (error) {
            console.error("Failed to fetch products:", error);
            message.error("Failed to load products");
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [selectedCategory]);

    // Fetch categories
    useEffect(() => {
        (async () => {
            try {
                const q = query(collection(db, "categories"), orderBy("name"));
                const snapshot = await getDocs(q);
                setCategories(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ICategory[]);
            } catch (error) { console.error(error); }
        })();
    }, []);

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigate(`/shop/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const CategoryItem: React.FC<{ cat: ICategory | null }> = ({ cat }) => {
        const isSelected = selectedCategory === (cat?.id || null);
        const [animationData, setAnimationData] = useState<any>(null);

        useEffect(() => {
            if (cat && categoryAnimations[cat.name]) {
                fetch(`./animations/${categoryAnimations[cat.name]}`)
                    .then(res => res.json())
                    .then(data => setAnimationData(data))
                    .catch(err => console.error("Lottie load error:", err));
            }
        }, [cat]);

        return (
            <div
                onClick={() => setSelectedCategory(cat?.id || null)}
                style={{
                    padding: "10px 24px",
                    borderRadius: "25px",
                    cursor: "pointer",
                    background: isSelected ? "#FF006E" : "rgba(255, 255, 255, 0.8)",
                    color: isSelected ? "#fff" : "#555",
                    fontWeight: 600,
                    boxShadow: isSelected ? "0 4px 12px rgba(255, 0, 110, 0.3)" : "0 2px 8px rgba(0,0,0,0.05)",
                    transition: "all 0.3s ease",
                    border: "1px solid",
                    borderColor: isSelected ? "#FF006E" : "rgba(0,0,0,0.05)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    whiteSpace: "nowrap"
                }}
            >
                {cat ? (
                    <>
                        {animationData ? (
                            <div style={{ width: 28, height: 28 }}>
                                <Lottie
                                    animationData={animationData}
                                    loop={true}
                                    style={{ width: "100%", height: "100%" }}
                                />
                            </div>
                        ) : cat.icon ? (
                            <Image
                                src={cat.icon}
                                width={20}
                                preview={false}
                                style={{ filter: isSelected ? "brightness(0) invert(1)" : "none" }}
                            />
                        ) : null}
                        {cat.name}
                    </>
                ) : (
                    "All Products"
                )}
            </div>
        );
    };

    return (
        <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={handleSearch}>
           {/* ═══════ BANNER CAROUSEL ═══════ */}
           {banners.length > 0 ? (
               <Carousel
                   key={banners.length}
                   autoplay
                   autoplaySpeed={4000}
                   dots={true}
                   effect="fade"
                   style={{ marginBottom: 32, borderRadius: 20, overflow: "hidden" }}
               >
                   {banners.map((banner) => (
                       <div key={banner.id}>
                           <div
                               onClick={() => {
                                   if (banner.actionUrl?.startsWith("category/")) {
                                       setSelectedCategory(banner.actionUrl.replace("category/", ""));
                                   }
                               }}
                               style={{
                                   position: "relative",
                                   width: "100%",
                                   height: 400,
                                   cursor: banner.actionUrl ? "pointer" : "default",
                                   overflow: "hidden",
                               }}
                           >
                               {/* Background Image */}
                               {banner.imageUrl ? (
                                   <img
                                       src={banner.imageUrl}
                                       alt={banner.title}
                                       style={{
                                           width: "100%",
                                           height: "100%",
                                           objectFit: "cover",
                                           position: "absolute",
                                           top: 0,
                                           left: 0,
                                       }}
                                   />
                               ) : (
                                   <div
                                       style={{
                                           width: "100%",
                                           height: "100%",
                                           background: banner.backgroundColor || "linear-gradient(135deg, #FF006E 0%, #8338EC 100%)",
                                           position: "absolute",
                                           top: 0,
                                           left: 0,
                                       }}
                                   />
                               )}

                               {/* Dark Overlay */}
                               <div
                                   style={{
                                       position: "absolute",
                                       top: 0,
                                       left: 0,
                                       right: 0,
                                       bottom: 0,
                                       background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.1) 100%)",
                                   }}
                               />

                               {/* Text Overlay */}
                               <div
                                   style={{
                                       position: "absolute",
                                       bottom: 0,
                                       left: 0,
                                       right: 0,
                                       padding: "40px 32px",
                                       color: "#fff",
                                       zIndex: 2,
                                   }}
                               >
                                   <Title
                                       level={1}
                                       style={{
                                           color: "#fff",
                                           marginBottom: 8,
                                           fontSize: 36,
                                           fontWeight: 700,
                                           textShadow: "0 2px 8px rgba(0,0,0,0.4)",
                                           lineHeight: 1.2,
                                       }}
                                   >
                                       {banner.title}
                                   </Title>
                                   {banner.subtitle && (
                                       <Text
                                           style={{
                                               color: "rgba(255,255,255,0.95)",
                                               fontSize: 18,
                                               textShadow: "0 1px 4px rgba(0,0,0,0.3)",
                                               display: "block",
                                           }}
                                       >
                                           {banner.subtitle}
                                       </Text>
                                   )}
                                   {banner.actionUrl && (
                                       <div style={{ marginTop: 12 }}>
                                           <span
                                               style={{
                                                   color: "#fff",
                                                   fontSize: 14,
                                                   fontWeight: 600,
                                                   background: "rgba(255,255,255,0.2)",
                                                   padding: "8px 20px",
                                                   borderRadius: 20,
                                                   backdropFilter: "blur(10px)",
                                                   border: "1px solid rgba(255,255,255,0.3)",
                                               }}
                                           >
                                               Shop Now →
                                           </span>
                                       </div>
                                   )}
                               </div>

                               {/* Dots indicator at bottom-right */}
                               <div
                                   style={{
                                       position: "absolute",
                                       top: 16,
                                       right: 16,
                                       zIndex: 3,
                                       background: "rgba(0,0,0,0.5)",
                                       borderRadius: 12,
                                       padding: "4px 12px",
                                       backdropFilter: "blur(10px)",
                                   }}
                               >
                                   <Text style={{ color: "#fff", fontSize: 12 }}>
                                       {banners.indexOf(banner) + 1} / {banners.length}
                                   </Text>
                               </div>
                           </div>
                       </div>
                   ))}
               </Carousel>
           ) : (
               /* Fallback static banner */
               <div style={{
                   background: "linear-gradient(135deg, #FF006E 0%, #8338EC 100%)",
                   borderRadius: 20,
                   padding: "64px 32px",
                   marginBottom: 32,
                   color: "#fff",
                   textAlign: "center",
                   position: "relative",
                   overflow: "hidden",
               }}>
                   <div style={{ position: "absolute", top: -40, right: -40, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
                   <div style={{ position: "absolute", bottom: -30, left: -30, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />

                   <div style={{ position: "relative", zIndex: 1 }}>
                       <img
                           src={logo}
                           alt="SmartShop Logo"
                           style={{
                               width: 100,
                               height: 100,
                               marginBottom: 16,
                               filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))"
                           }}
                       />
                       <Title level={1} style={{ color: "#fff", marginBottom: 8, fontSize: 48, fontWeight: 800 }}>JongTinh</Title>
                       <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 20, maxWidth: 600, display: "inline-block" }}>
                           Discover amazing products at the best prices in Cambodia 🇰🇭
                       </Text>
                   </div>
               </div>
           )}

            {/* Categories Carousel */}
            <div style={{
                marginBottom: 32,
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(255, 255, 255, 0.5)",
                padding: "12px",
                borderRadius: "30px",
                boxShadow: "0 4px 15px rgba(0,0,0,0.03)"
            }}>
                <Button
                    icon={<LeftOutlined />}
                    shape="circle"
                    size="large"
                    onClick={() => categoryCarouselRef.current?.prev()}
                    style={{
                        flexShrink: 0,
                        border: "none",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                />

                <div style={{ flex: 1, overflow: "hidden" }}>
                    <Carousel
                        ref={categoryCarouselRef}
                        dots={false}
                        infinite={false}
                        variableWidth={true}
                        slidesToScroll={3}
                        swipeToSlide={true}
                        draggable={true}
                    >
                        <div style={{ padding: "0 6px" }}>
                            <CategoryItem cat={null} />
                        </div>
                        {categories.map((cat) => (
                            <div key={cat.id} style={{ padding: "0 6px" }}>
                                <CategoryItem cat={cat} />
                            </div>
                        ))}
                    </Carousel>
                </div>

                <Button
                    icon={<RightOutlined />}
                    shape="circle"
                    size="large"
                    onClick={() => categoryCarouselRef.current?.next()}
                    style={{
                        flexShrink: 0,
                        border: "none",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                />
            </div>

            {/* Loading */}
            {isLoading && <div style={{ textAlign: "center", padding: 48 }}><Spin size="large" /></div>}

            {/* Products Grid */}
            {!isLoading && (
                <>
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
                                                    style={{ objectFit: "cover", transition: "transform 0.5s ease" }}
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
                                                {product.discountPrice && (
                                                    <Tag color="#FF006E" style={{
                                                        position: "absolute",
                                                        top: 12,
                                                        left: 12,
                                                        margin: 0,
                                                        borderRadius: 8,
                                                        fontWeight: 700,
                                                        border: "none"
                                                    }}>
                                                        SAVE {Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                                                    </Tag>
                                                )}
                                            </div>
                                        }
                                    >
                                        <div style={{ flex: 1 }}>
                                            <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>{product.category}</Text>
                                            <Title level={5} style={{ marginTop: 4, marginBottom: 8, fontSize: 16 }} ellipsis={{ rows: 2 }}>{product.name}</Title>
                                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
                                                <Text style={{ color: "#faad14", fontSize: 12 }}>★</Text>
                                                <Text strong style={{ fontSize: 12 }}>{product.rating}</Text>
                                                <Text type="secondary" style={{ fontSize: 12 }}>({product.reviewCount})</Text>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: "auto" }}>
                                            <div style={{ marginBottom: 16 }}>
                                                {product.discountPrice ? (
                                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                                        <Text delete type="secondary" style={{ fontSize: 12 }}>${product.price.toFixed(2)}</Text>
                                                        <Text strong style={{ color: "#FF006E", fontSize: 20 }}>${product.discountPrice.toFixed(2)}</Text>
                                                    </div>
                                                ) : (
                                                    <Text strong style={{ fontSize: 20 }}>${product.price.toFixed(2)}</Text>
                                                )}
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
                                                    fontWeight: 600,
                                                    boxShadow: isInStock ? "0 4px 12px rgba(255, 0, 110, 0.2)" : "none"
                                                }}
                                            >
                                                {isInStock ? "Add to Cart" : "Out of Stock"}
                                            </Button>
                                        </div>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>

                    {hasMore && (
                        <div style={{ textAlign: "center", marginTop: 40, marginBottom: 40 }}>
                            <Button
                                size="large"
                                onClick={() => fetchProducts(true)}
                                loading={isLoadingMore}
                                style={{ borderRadius: 10, minWidth: 200, fontWeight: 600 }}
                            >
                                Load More Products
                            </Button>
                        </div>
                    )}
                </>
            )}
            {products.length === 0 && !isLoading && <div style={{ textAlign: "center", padding: 48 }}><Text type="secondary" style={{ fontSize: 18 }}>No products found</Text></div>}
        </ShopLayout>
    );
};
