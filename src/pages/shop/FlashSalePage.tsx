import React, { useState, useEffect, useContext } from "react";
import { Typography, Row, Col, Button, Spin, Empty, Space } from "antd";
import { useNavigate } from "react-router";
import { ArrowLeftOutlined, FireOutlined } from "@ant-design/icons";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../../firebase";
import { IProduct } from "../../interfaces";
import { ShopLayout } from "./ShopLayout";
import { ColorModeContext } from "../../contexts/color-mode";
import { ProductCard } from "../../components/shop/ProductCard";

const { Title, Text } = Typography;

export const FlashSalePage: React.FC = () => {
    const navigate = useNavigate();
    const { mode } = useContext(ColorModeContext);
    const isDark = mode === "dark";

    const [products, setProducts] = useState<IProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSaleProducts = async () => {
            try {
                // Fetch products that have a discountPrice or are tagged with 'sale'
                const q = query(
                    collection(db, "products"),
                    where("isAvailable", "==", true),
                    limit(20)
                );
                const querySnapshot = await getDocs(q);
                const allProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IProduct));

                // Filter client-side for products with discounts for this "Flash Sale" look
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

    return (
        <ShopLayout onSearch={() => {}} setSearchQuery={() => {}} searchQuery="">

            <div style={{ padding: "20px 16px" }}>
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(-1)}
                    style={{ marginBottom: 24, borderRadius: 12 }}
                >
                    Back
                </Button>

                <div style={{
                    background: "linear-gradient(135deg, #FF006E 0%, #FFBE0B 100%)",
                    borderRadius: 24,
                    padding: "40px 24px",
                    marginBottom: 32,
                    textAlign: "center",
                    color: "#fff"
                }}>
                    <Space size={12}>
                        <FireOutlined style={{ fontSize: 32 }} />
                        <Title level={1} style={{ color: "#fff", margin: 0, fontWeight: 900 }}>FLASH SALE</Title>
                    </Space>
                    <Text style={{ display: "block", color: "rgba(255,255,255,0.9)", fontSize: 18, marginTop: 8 }}>
                        Limited time offers. Up to 70% OFF!
                    </Text>
                </div>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "100px 0" }}>
                        <Spin size="large" />
                    </div>
                ) : products.length > 0 ? (
                    <Row gutter={[16, 24]}>
                        {products.map(product => (
                            <Col xs={12} sm={12} md={8} lg={6} key={product.id}>
                                <ProductCard product={product} isDark={isDark} />
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <Empty description="No flash sale items at the moment." />
                )}
            </div>
        </ShopLayout>
    );
};
