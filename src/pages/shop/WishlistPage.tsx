import React, { useState, useEffect } from "react";
import { Row, Col, Typography, Empty, Spin, Button, Breadcrumb } from "antd";
import { useNavigate } from "react-router";
import { HomeOutlined, HeartOutlined } from "@ant-design/icons";
import { collection, query, where, getDocs, documentId } from "firebase/firestore";
import { db } from "../../firebase";
import { IProduct } from "../../interfaces";
import { ShopLayout } from "./ShopLayout";
import { ProductCard } from "../../components/shop/ProductCard";
import { useWishlist } from "../../contexts/WishlistContext";
import { ColorModeContext } from "../../contexts/color-mode";

const { Title, Text } = Typography;

export const WishlistPage: React.FC = () => {
    const navigate = useNavigate();
    const { favorites, loading: wishlistLoading } = useWishlist();
    const { mode } = React.useContext(ColorModeContext);
    const isDark = mode === "dark";

    const [products, setProducts] = useState<IProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchWishlistProducts = async () => {
            if (favorites.size === 0) {
                setProducts([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                // Firestore "in" query limited to 30 items
                const favoriteIds = Array.from(favorites).slice(0, 30);
                const q = query(
                    collection(db, "products"),
                    where(documentId(), "in", favoriteIds)
                );
                const snapshot = await getDocs(q);
                const items = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as IProduct[];
                setProducts(items);
            } catch (error) {
                console.error("Error fetching wishlist products:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWishlistProducts();
    }, [favorites]);

    return (
        <ShopLayout
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearch={() => navigate(`/shop/search?q=${encodeURIComponent(searchQuery)}`)}
        >
            <div style={{ marginBottom: 24 }}>
                <Breadcrumb items={[
                    { title: <><HomeOutlined /> <span>Home</span></>, onClick: () => navigate("/shop"), className: "cursor-pointer" },
                    { title: "My Wishlist" }
                ]} />
            </div>

            <div style={{ marginBottom: 40 }}>
                <Title level={2} style={{ margin: 0, fontWeight: 800 }}>
                    My Wishlist <HeartOutlined style={{ color: "#FF006E" }} />
                </Title>
                <Text type="secondary">
                    {favorites.size} items saved to your favorites
                </Text>
            </div>

            {loading || wishlistLoading ? (
                <div style={{ textAlign: "center", padding: "100px 0" }}>
                    <Spin size="large" tip="Loading your favorites..." />
                </div>
            ) : products.length > 0 ? (
                <Row gutter={[16, 32]}>
                    {products.map((product) => (
                        <Col xs={12} sm={12} md={8} lg={6} key={product.id}>
                            <ProductCard product={product} isDark={isDark} />
                        </Col>
                    ))}
                </Row>
            ) : (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        <Space direction="vertical">
                            <Text strong>Your wishlist is empty</Text>
                            <Text type="secondary">Save items you like to see them here later!</Text>
                        </Space>
                    }
                    style={{ padding: "100px 0" }}
                >
                    <Button
                        type="primary"
                        size="large"
                        onClick={() => navigate("/shop")}
                        style={{ background: "#FF006E", border: "none", borderRadius: 12, height: 48, padding: "0 32px" }}
                    >
                        Go Shopping
                    </Button>
                </Empty>
            )}

            <style>{`
                .cursor-pointer { cursor: pointer; }
                .cursor-pointer:hover { color: #FF006E !important; }
            `}</style>
        </ShopLayout>
    );
};
