import React, { useState, useEffect, useContext } from "react";
import { Row, Col, Typography, Space, Button, message, Spin, Breadcrumb, Empty } from "antd";
import { HomeOutlined, SearchOutlined } from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import { IProduct } from "../../interfaces";
import { ShopLayout } from "./ShopLayout";
import { ProductCard } from "../../components/shop/ProductCard";
import { ColorModeContext } from "../../contexts/color-mode";
import { useLanguage } from "../../contexts/LanguageContext";

const { Title, Text } = Typography;

export const SearchResultsPage: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { mode } = useContext(ColorModeContext);
    const isDark = mode === "dark";
    const [searchParams] = useSearchParams();
    const queryTerm = searchParams.get("q") || "";

    const [searchQuery, setSearchQuery] = useState(queryTerm);
    const [products, setProducts] = useState<IProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setSearchQuery(queryTerm);
        fetchSearchResults(queryTerm);
    }, [queryTerm]);

    const fetchSearchResults = async (term: string) => {
        setIsLoading(true);
        try {
            // Fetch all products to perform sophisticated multi-field relevance scoring
            const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);

            const allProducts = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            })) as IProduct[];

            if (!term) {
                setProducts(allProducts);
            } else {
                const lowerTerm = term.toLowerCase().trim();

                // RELEVANCE SCORING ALGORITHM
                const scoredProducts = allProducts.map(p => {
                    let score = 0;
                    const nameLower = p.name.toLowerCase();
                    const catLower = p.category?.toLowerCase() || "";
                    const brandLower = p.brand?.toLowerCase() || "";
                    const descLower = p.description?.toLowerCase() || "";

                    // 1. Tag Match (Highest Priority)
                    if (p.filterTags?.some(tag => tag.toLowerCase() === lowerTerm)) score += 100;

                    // 2. Exact Name Match
                    if (nameLower === lowerTerm) score += 80;

                    // 3. Name Starts With Term
                    else if (nameLower.startsWith(lowerTerm)) score += 50;

                    // 4. Name Contains Term
                    else if (nameLower.includes(lowerTerm)) score += 30;

                    // 5. Category or Brand Exact Match
                    if (catLower === lowerTerm || brandLower === lowerTerm) score += 40;

                    // 6. Description Match (Lowest Priority)
                    if (descLower.includes(lowerTerm)) score += 10;

                    return { product: p, score };
                })
                .filter(item => item.score > 0) // Remove non-matches
                .sort((a, b) => b.score - a.score); // Sort by highest score

                setProducts(scoredProducts.map(item => item.product));
            }
        } catch (error) {
            console.error("Failed to fetch search results:", error);
            message.error(t.search.failed);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigate(`/shop/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={handleSearch}>
            <div style={{ marginBottom: 24 }}>
                <Breadcrumb
                    items={[
                        { title: <><HomeOutlined /> <span>{t.footer.home}</span></>, onClick: () => navigate("/shop"), className: "cursor-pointer" },
                        { title: t.search.title },
                    ]}
                />
            </div>

            <div style={{ marginBottom: 32 }}>
                <Title level={2}>
                    <SearchOutlined style={{ marginRight: 12, color: "#FF006E" }} />
                    {queryTerm ? t.search.resultsFor.replace("{query}", queryTerm) : t.home.allProducts}
                </Title>
                <Text type="secondary">{t.search.productsFound.replace("{count}", products.length.toString())}</Text>
            </div>

            {isLoading ? (
                <div style={{ textAlign: "center", padding: "100px 0" }}>
                    <Spin size="large" tip={t.search.searching} />
                </div>
            ) : products.length > 0 ? (
                <Row gutter={[12, 32]}>
                    {products.map((product) => (
                        <Col xs={12} sm={12} md={8} lg={6} key={product.id}>
                            <ProductCard product={product} isDark={isDark} />
                        </Col>
                    ))}
                </Row>
            ) : (
                <div style={{ padding: "80px 0" }}>
                    <Empty
                        description={
                            <span>
                                {t.search.noResults.replace("{query}", queryTerm)}
                            </span>
                        }
                    >
                        <Button type="primary" onClick={() => navigate("/shop")} style={{ background: "#FF006E", border: "none", borderRadius: 10 }}>
                            {t.product.backToShop}
                        </Button>
                    </Empty>
                </div>
            )}
        </ShopLayout>
    );
};
