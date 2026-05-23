import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { Row, Col, Typography, Image, Tag, Button, Space, Descriptions, Divider, Spin, message, Card, Tooltip } from "antd";
import { ShoppingCartOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { IProduct } from "../../interfaces";
import { ShopLayout } from "./ShopLayout";
import { useCart } from "../../contexts/CartContext";

const { Title, Text } = Typography;

export const ProductDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<IProduct | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const { addToCart } = useCart();
    const [selectedColor, setSelectedColor] = useState<string>("");
    const [selectedSize, setSelectedSize] = useState<string>("");

    useEffect(() => {
        if (!id) return;
        (async () => {
            setIsLoading(true);
            try {
                const snap = await getDoc(doc(db, "products", id));
                if (snap.exists()) setProduct({ id: snap.id, ...snap.data() } as IProduct);
            } catch (e) { console.error(e); }
            setIsLoading(false);
        })();
    }, [id]);
        // Extract available sizes from attributes
        const availableSizes = React.useMemo(() => {
            if (!product?.attributes) return [];

            // Handle both array and object formats
            if (Array.isArray(product.attributes)) {
                const sizeAttr = product.attributes.find(
                    (a: any) => (a.key || a.label || "").toLowerCase() === "size"
                );
                if (sizeAttr) {
                    return sizeAttr.value.split(",").map((s: string) => s.trim()).filter(Boolean);
                }
            } else {
                const attrs = product.attributes as any;
                const sizeValue = attrs["size"] || attrs["Size"] || "";
                if (sizeValue && typeof sizeValue === "string") {
                    return sizeValue.split(",").map((s: string) => s.trim()).filter(Boolean);
                }
            }
            return [];
        }, [product]);

        // Extract available colors from product
        const availableColors = product?.colors || [];
    const isInStock = product?.isAvailable && (product?.stockQuantity || 0) > 0;

    const handleSearch = () => {
        if (searchQuery.trim()) {
            navigate(`/shop/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    if (isLoading) return <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={handleSearch}><div style={{ textAlign: "center", padding: 100 }}><Spin size="large" /></div></ShopLayout>;
    if (!product) return <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={handleSearch}><div style={{ textAlign: "center", padding: 100 }}><Title level={4}>Product not found</Title><Button onClick={() => navigate("/shop")}>Back to Shop</Button></div></ShopLayout>;

    return (
        <ShopLayout searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={handleSearch}>
            <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/shop")}
                style={{
                    marginBottom: 24,
                    borderRadius: 10,
                    fontWeight: 600,
                    border: "none",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
                }}
            >
                Back to Shop
            </Button>

            <Row gutter={[48, 48]}>
                <Col xs={24} md={12}>
                    <div style={{ position: "sticky", top: 100 }}>
                        <Card
                            style={{
                                borderRadius: 24,
                                overflow: "hidden",
                                border: "none",
                                boxShadow: "0 8px 32px rgba(0,0,0,0.08)"
                            }}
                            styles={{ body: { padding: 0 } }}
                        >
                            <Image
                                src={product.images?.[selectedImage] || "https://via.placeholder.com/600"}
                                width="100%"
                                style={{ borderRadius: 0, objectFit: "cover", minHeight: 400 }}
                                fallback="https://via.placeholder.com/600?text=No+Image"
                            />
                        </Card>

                        {product.images && product.images.length > 1 && (
                            <div style={{
                                display: "flex",
                                gap: 12,
                                marginTop: 20,
                                overflowX: "auto",
                                padding: "4px 0",
                                scrollbarWidth: "none"
                            }}>
                                {product.images.map((img, i) => (
                                    <div
                                        key={i}
                                        onClick={() => setSelectedImage(i)}
                                        style={{
                                            flexShrink: 0,
                                            width: 80,
                                            height: 80,
                                            borderRadius: 12,
                                            overflow: "hidden",
                                            cursor: "pointer",
                                            border: selectedImage === i ? "3px solid #FF006E" : "3px solid transparent",
                                            transition: "all 0.2s ease",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                                        }}
                                    >
                                        <img src={img} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Col>

                <Col xs={24} md={12}>
                    <div style={{ padding: "0 8px" }}>
                        <Text type="secondary" style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 }}>{product.category}</Text>
                        <Title level={1} style={{ marginTop: 8, marginBottom: 0, fontSize: 32, fontWeight: 800 }}>{product.name}</Title>
                        {product.brand && (
                            <Text type="secondary" style={{ fontSize: 14, display: "block", marginBottom: 16 }}>
                                by <Text strong style={{ color: "#FF006E" }}>{product.brand}</Text>
                            </Text>
                        )}

                        <Space style={{ marginBottom: 24 }}>
                            <div style={{
                                background: "#FFFBE6",
                                padding: "4px 12px",
                                borderRadius: 12,
                                border: "1px solid #FFE58F",
                                display: "flex",
                                alignItems: "center",
                                gap: 4
                            }}>
                                <Text style={{ color: "#faad14", fontSize: 16 }}>★</Text>
                                <Text strong style={{ fontSize: 16 }}>{product.rating}</Text>
                            </div>
                            <Text type="secondary" style={{ fontSize: 14 }}>({product.reviewCount} verified reviews)</Text>
                        </Space>

                        <div style={{
                            background: "rgba(255, 0, 110, 0.03)",
                            padding: 24,
                            borderRadius: 20,
                            marginBottom: 32,
                            border: "1px dashed rgba(255, 0, 110, 0.2)"
                        }}>
                            {product.discountPrice ? (
                                <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                                    <Title level={1} style={{ color: "#FF006E", margin: 0, fontSize: 42, fontWeight: 800 }}>${product.discountPrice.toFixed(2)}</Title>
                                    <Text delete type="secondary" style={{ fontSize: 20 }}>${product.price.toFixed(2)}</Text>
                                    <Tag color="#FF006E" style={{ borderRadius: 8, border: "none", fontWeight: 700, padding: "4px 12px", fontSize: 14 }}>
                                        Save {Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                                    </Tag>
                                </div>
                            ) : (
                                <Title level={1} style={{ color: "#FF006E", margin: 0, fontSize: 42, fontWeight: 800 }}>${product.price.toFixed(2)}</Title>
                            )}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
                            <div style={{
                                border: "1px solid #d9d9d9",
                                borderRadius: 12,
                                padding: "4px 8px",
                                display: "flex",
                                alignItems: "center",
                                gap: 16
                            }}>
                                <Button type="text" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={!isInStock} icon={<b>-</b>} />
                                <Text strong style={{ fontSize: 18, minWidth: 20, textAlign: "center" }}>{quantity}</Text>
                                <Button type="text" onClick={() => setQuantity(Math.min(product.stockQuantity || 99, quantity + 1))} disabled={!isInStock} icon={<b>+</b>} />
                            </div>
                            <Tag
                                color={isInStock ? "success" : "error"}
                                style={{
                                    borderRadius: 8,
                                    padding: "4px 12px",
                                    fontSize: 14,
                                    fontWeight: 600,
                                    margin: 0
                                }}
                            >
                                {isInStock ? `${product.stockQuantity} items in stock` : "Out of Stock"}
                            </Tag>
                        </div>

                        {/* Size Selector */}
                        {availableSizes.length > 0 && (
                            <div style={{ marginBottom: 24 }}>
                                <Title level={5} style={{ fontWeight: 700, marginBottom: 12 }}>
                                    Select Size {selectedSize && <Tag color="#FF006E" style={{ marginLeft: 8 }}>{selectedSize}</Tag>}
                                </Title>
                                <Space size={12} wrap>
                                    {availableSizes.map((size: string) => (
                                        <div
                                            key={size}
                                            onClick={() => setSelectedSize(size)}
                                            style={{
                                                minWidth: 56,
                                                height: 44,
                                                borderRadius: 12,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                cursor: "pointer",
                                                background: selectedSize === size ? "#FF006E" : "#f5f5f5",
                                                color: selectedSize === size ? "#fff" : "#333",
                                                fontWeight: selectedSize === size ? 700 : 500,
                                                border: selectedSize === size ? "2px solid #FF006E" : "2px solid #e0e0e0",
                                                transition: "all 0.2s ease",
                                                fontSize: 16,
                                                userSelect: "none",
                                            }}
                                        >
                                            {size}
                                        </div>
                                    ))}
                                </Space>
                            </div>
                        )}

                        {/* Color Selector */}
                        {availableColors.length > 0 && (
                            <div style={{ marginBottom: 24 }}>
                                <Title level={5} style={{ fontWeight: 700, marginBottom: 12 }}>
                                    Select Color {selectedColor && <Tag color="#FF006E" style={{ marginLeft: 8 }}>{selectedColor}</Tag>}
                                </Title>
                                <Space size={12} wrap>
                                    {availableColors.map((c: any, i: number) => {
                                        const colorName = typeof c === "string" ? c : (c.name || c.hex || "");
                                        const colorHex = typeof c === "string" ? c : (c.hex || "");
                                        const isSelected = selectedColor === colorHex || selectedColor === colorName;
                                        return (
                                            <Tooltip title={colorName} key={i}>
                                                <div
                                                    onClick={() => setSelectedColor(colorHex || colorName)}
                                                    style={{
                                                        width: 44,
                                                        height: 44,
                                                        borderRadius: "50%",
                                                        backgroundColor: colorHex,
                                                        cursor: "pointer",
                                                        border: isSelected ? "3px solid #FF006E" : "3px solid #e0e0e0",
                                                        boxShadow: isSelected ? "0 0 0 3px rgba(255,0,110,0.2)" : "0 2px 4px rgba(0,0,0,0.1)",
                                                        transition: "all 0.2s ease",
                                                        position: "relative",
                                                    }}
                                                >
                                                    {isSelected && (
                                                        <div style={{
                                                            position: "absolute",
                                                            top: -6, right: -6,
                                                            width: 20, height: 20,
                                                            borderRadius: "50%",
                                                            background: "#FF006E",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                        }}>
                                                            <span style={{ color: "#fff", fontSize: 12 }}>✓</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </Tooltip>
                                        );
                                    })}
                                </Space>
                            </div>
                        )}

                        <Button
                            type="primary"
                            size="large"
                            block
                            icon={<ShoppingCartOutlined style={{ fontSize: 20 }} />}
                            onClick={() => {
                                // Store selected size/color in the product before adding
                                const productWithSelection = {
                                    ...product,
                                    selectedSize: selectedSize,
                                    selectedColor: availableColors.find(
                                        (c: any) => (typeof c === "string" ? c : c.hex) === selectedColor
                                    ) || selectedColor,
                                };
                                addToCart(productWithSelection, quantity);
                                message.success(`${product.name}${selectedSize ? ` (${selectedSize})` : ""} added to cart!`);
                            }}
                            disabled={!isInStock}
                            style={{
                                background: isInStock ? "#FF006E" : "#d9d9d9",
                                border: "none",
                                height: 60,
                                borderRadius: 16,
                                fontSize: 18,
                                fontWeight: 700,
                                boxShadow: isInStock ? "0 8px 24px rgba(255, 0, 110, 0.25)" : "none",
                                marginBottom: 40
                            }}
                        >
                            {isInStock ? "Add to Cart" : "Out of Stock"}
                        </Button>

                        <Divider />

                        <div style={{ marginBottom: 32 }}>
                            <Title level={4} style={{ fontWeight: 700 }}>Description</Title>
                            <Text style={{ fontSize: 16, lineHeight: 1.8, color: "#444" }}>{product.description}</Text>
                        </div>

                        {product.specifications && Object.keys(product.specifications).length > 0 && (
                            <div style={{ marginBottom: 32 }}>
                                <Title level={4} style={{ fontWeight: 700 }}>Product Specifications</Title>
                                <Descriptions
                                    bordered
                                    size="middle"
                                    column={1}
                                    labelStyle={{ fontWeight: 600, width: "30%", background: "#fafafa" }}
                                    style={{ marginTop: 16, borderRadius: 12, overflow: "hidden" }}
                                >
                                    {Object.entries(product.specifications).map(([k, v]) => (
                                        <Descriptions.Item label={k} key={k}>{v}</Descriptions.Item>
                                    ))}
                                </Descriptions>
                            </div>
                        )}

                        {product.attributes && (Array.isArray(product.attributes) ? product.attributes.length > 0 : Object.keys(product.attributes).length > 0) && (
                            <div style={{ marginBottom: 32 }}>
                                <Title level={4} style={{ fontWeight: 700 }}>Details</Title>
                                <Descriptions
                                    bordered
                                    size="middle"
                                    column={1}
                                    labelStyle={{ fontWeight: 600, width: "30%", background: "#fafafa" }}
                                    style={{ marginTop: 16, borderRadius: 12, overflow: "hidden" }}
                                >
                                    {Array.isArray(product.attributes)
                                        ? product.attributes.map((attr) => (
                                            <Descriptions.Item label={attr.label || attr.key} key={attr.key}>
                                                {attr.value}
                                            </Descriptions.Item>
                                        ))
                                        : Object.entries(product.attributes)
                                            .filter(([key]) => key !== "size")
                                            .map(([key, value]) => (
                                                <Descriptions.Item label={key.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())} key={key}>
                                                    {String(value)}
                                                </Descriptions.Item>
                                            ))
                                    }
                                </Descriptions>
                            </div>
                        )}

                        {product.colors && product.colors.length > 0 && (
                            <div>
                                <Title level={4} style={{ fontWeight: 700 }}>Available Colors</Title>
                                <Space size={16} style={{ marginTop: 12 }}>
                                    {product.colors.map((c, i) => (
                                        <Tooltip title={c.name || c.hex} key={i}>
                                            <div
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: "50%",
                                                    backgroundColor: c.hex,
                                                    border: "3px solid #fff",
                                                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                                                }}
                                            />
                                        </Tooltip>
                                    ))}
                                </Space>
                            </div>
                        )}
                    </div>
                </Col>
            </Row>
        </ShopLayout>
    );
};
