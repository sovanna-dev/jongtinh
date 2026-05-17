import React, { useState, useEffect } from "react";
import { Row, Col, Card, Typography, Tag, Image, Button, message, Spin } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
import { collection, getDocs, query, where, orderBy, limit, startAfter, onSnapshot, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { IProduct, ICategory, IPromotionBanner, INotification } from "../../interfaces";
import { ShopLayout } from "./ShopLayout";
import { useCart } from "../../contexts/CartContext";
import { ColorModeContext } from "../../contexts/color-mode";
import { BannerCarousel } from "../../components/shop/BannerCarousel";
import { CategoryScroll } from "../../components/shop/CategoryScroll";
import { NotificationBanner } from "../../components/shop/NotificationBanner";

const { Title, Text } = Typography;
const PAGE_SIZE = 12;

export const ShopHomePage: React.FC = () => {
    const navigate = useNavigate();
    const { mode } = React.useContext(ColorModeContext);
    const isDark = mode === "dark";
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [products, setProducts] = useState<IProduct[]>([]);
    const [categories, setCategories] = useState<ICategory[]>([]);
    const [banners, setBanners] = useState<IPromotionBanner[]>([]);
    const [notifications, setNotifications] = useState<INotification[]>([]);
    const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const { addToCart } = useCart();

    // Fetch banners
    useEffect(() => {
        (async () => {
            try {
                const q = query(collection(db, "promotion_banners"), where("isActive", "==", true), orderBy("createdAt", "desc"), limit(5));
                const snapshot = await getDocs(q);
                setBanners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as IPromotionBanner[]);
            } catch (error) { console.error("Banners:", error); }
        })();
    }, []);

    // Fetch notifications
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;
        const q = query(collection(db, "notifications"), where("userId", "in", [user.uid, "all"]), orderBy("timestamp", "desc"), limit(5));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as INotification)));
        });
        return () => unsubscribe();
    }, []);

    // Fetch products
    const fetchProducts = async (isNextPage = false) => {
        if (isNextPage) setIsLoadingMore(true);
        else { setIsLoading(true); setLastDoc(null); }
        try {
            const constraints: any[] = [orderBy("createdAt", "desc"), limit(PAGE_SIZE)];
            if (selectedCategory) constraints.unshift(where("category", "==", selectedCategory));
            if (isNextPage && lastDoc) constraints.push(startAfter(lastDoc));
            const snapshot = await getDocs(query(collection(db, "products"), ...constraints));
            const newProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as IProduct[];
            if (isNextPage) setProducts(prev => [...prev, ...newProducts]);
            else setProducts(newProducts);
            setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
            setHasMore(snapshot.docs.length === PAGE_SIZE);
        } catch (error) { message.error("Failed to load products"); }
        finally { setIsLoading(false); setIsLoadingMore(false); }
    };

    useEffect(() => { fetchProducts(); }, [selectedCategory]);

    // Fetch categories
    useEffect(() => {
        (async () => {
            try {
                const q = query(collection(db, "categories"), orderBy("name"));
                const snapshot = await getDocs(q);
                setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ICategory[]);
            } catch (error) { console.error(error); }
        })();
    }, []);

    return (
        <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={() => {
            if (searchQuery.trim()) navigate(`/shop/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }}>
            {/* Banner Carousel */}
            <BannerCarousel banners={banners} onBannerClick={(banner) => {
                if (banner.actionUrl?.startsWith("category/")) {
                    setSelectedCategory(banner.actionUrl.replace("category/", ""));
                }
            }} />

            {/* Category Scroll */}
            <CategoryScroll categories={categories} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} isDark={isDark} />

            {/* Notification Banner */}
            <NotificationBanner notifications={notifications} dismissedIds={dismissedNotifications} onDismiss={(id) => setDismissedNotifications(prev => [...prev, id])} isDark={isDark} />

            {/* Products */}
            {isLoading && <div style={{ textAlign: "center", padding: 48 }}><Spin size="large" /></div>}
            {!isLoading && (
                <>
                    <Row gutter={[24, 24]}>
                        {products.map((product) => {
                            const price = product.discountPrice ?? product.price;
                            const isInStock = product.isAvailable && (product.stockQuantity || 0) > 0;
                            return (
                                <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                                    <Card hoverable onClick={() => navigate(`/shop/product/${product.id}`)}
                                        style={{ borderRadius: 20, overflow: "hidden", border: "none", boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.08)", height: "100%", display: "flex", flexDirection: "column", background: isDark ? "#1f1f1f" : "#fff" }}
                                        bodyStyle={{ padding: 16, flex: 1, display: "flex", flexDirection: "column" }}
                                        cover={
                                            <div style={{ position: "relative", height: 220, overflow: "hidden" }}>
                                                <Image src={product.images?.[0] || "https://via.placeholder.com/300"} alt={product.name} height="100%" width="100%" style={{ objectFit: "cover" }} fallback="https://via.placeholder.com/300?text=No+Image" preview={false} />
                                                {!isInStock && <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}><Tag color="default" style={{ padding: "4px 12px", borderRadius: 12, fontWeight: 700 }}>OUT OF STOCK</Tag></div>}
                                                {product.discountPrice && <Tag color="#FF006E" style={{ position: "absolute", top: 12, left: 12, margin: 0, borderRadius: 8, fontWeight: 700, border: "none" }}>SAVE {Math.round(((product.price - product.discountPrice) / product.price) * 100)}%</Tag>}
                                            </div>
                                        }>
                                        <div style={{ flex: 1 }}>
                                            <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>{product.category}</Text>
                                            <Title level={5} style={{ marginTop: 4, marginBottom: 8, fontSize: 16 }} ellipsis={{ rows: 2 }}>{product.name}</Title>
                                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 12 }}><Text style={{ color: "#faad14", fontSize: 12 }}>★</Text><Text strong style={{ fontSize: 12 }}>{product.rating}</Text><Text type="secondary" style={{ fontSize: 12 }}>({product.reviewCount})</Text></div>
                                        </div>
                                        <div style={{ marginTop: "auto" }}>
                                            <div style={{ marginBottom: 16 }}>
                                                {product.discountPrice ? <><Text delete type="secondary" style={{ fontSize: 12 }}>${product.price.toFixed(2)}</Text><Text strong style={{ color: "#FF006E", fontSize: 20 }}>${product.discountPrice.toFixed(2)}</Text></> : <Text strong style={{ fontSize: 20 }}>${product.price.toFixed(2)}</Text>}
                                            </div>
                                            <Button block type="primary" icon={<ShoppingCartOutlined />} onClick={(e) => { e.stopPropagation(); addToCart(product); message.success(`${product.name} added!`); }} disabled={!isInStock} style={{ height: 40, borderRadius: 12, background: isInStock ? "#FF006E" : "#d9d9d9", border: "none", fontWeight: 600, boxShadow: isInStock ? "0 4px 12px rgba(255, 0, 110, 0.2)" : "none" }}>{isInStock ? "Add to Cart" : "Out of Stock"}</Button>
                                        </div>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                    {hasMore && <div style={{ textAlign: "center", marginTop: 40, marginBottom: 40 }}><Button size="large" onClick={() => fetchProducts(true)} loading={isLoadingMore} style={{ borderRadius: 10, minWidth: 200, fontWeight: 600 }}>Load More Products</Button></div>}
                </>
            )}
            {products.length === 0 && !isLoading && <div style={{ textAlign: "center", padding: 48 }}><Text type="secondary" style={{ fontSize: 18 }}>No products found</Text></div>}
        </ShopLayout>
    );
};