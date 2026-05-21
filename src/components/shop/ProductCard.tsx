import React from "react";
import { Card, Typography, Tag, Image, Button, Space, Tooltip } from "antd";
import { ShoppingCartOutlined, StarFilled } from "@ant-design/icons";
import { useNavigate } from "react-router";
import { IProduct } from "../../interfaces";
import { useCart } from "../../contexts/CartContext";

const { Title, Text } = Typography;

interface ProductCardProps {
    product: IProduct;
    isDark: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, isDark }) => {
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const price = product.discountPrice ?? product.price;
    const isInStock = product.isAvailable && (product.stockQuantity || 0) > 0;
    const hasDiscount = !!product.discountPrice;
    const discountPercentage = hasDiscount
        ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
        : 0;

    return (
        <Card
            hoverable
            onClick={() => navigate(`/shop/product/${product.id}`)}
            style={{
                borderRadius: 20,
                overflow: "hidden",
                border: "none",
                boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.06)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                background: isDark ? "#1f1f1f" : "#fff",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
            }}
            styles={{ body: { padding: 16, flex: 1, display: "flex", flexDirection: "column" } }}
            cover={
                <div style={{ position: "relative", height: 240, overflow: "hidden" }}>
                    <Image
                        src={product.images?.[0] || "https://via.placeholder.com/300"}
                        alt={product.name}
                        height="100%"
                        width="100%"
                        style={{ objectFit: "cover", transition: "transform 0.5s ease" }}
                        className="product-card-image"
                        fallback="https://via.placeholder.com/300?text=No+Image"
                        preview={false}
                    />

                    {/* Overlays */}
                    {!isInStock && (
                        <div style={{
                            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                            background: "rgba(0,0,0,0.45)", display: "flex",
                            alignItems: "center", justifyContent: "center", zIndex: 2,
                            backdropFilter: "blur(2px)"
                        }}>
                            <Tag color="default" style={{ padding: "6px 16px", borderRadius: 20, fontWeight: 700, border: "none" }}>
                                OUT OF STOCK
                            </Tag>
                        </div>
                    )}

                    {hasDiscount && (
                        <Tag color="#FF006E" style={{
                            position: "absolute", top: 12, left: 12, margin: 0,
                            borderRadius: 8, fontWeight: 700, border: "none",
                            boxShadow: "0 2px 8px rgba(255, 0, 110, 0.3)"
                        }}>
                            -{discountPercentage}%
                        </Tag>
                    )}

                    {/* Quick Badges for Attributes like 'New' or 'Hot' could go here */}
                </div>
            }
        >
            <div style={{ flex: 1 }}>
                <Space style={{ marginBottom: 4 }}>
                    <Text strong style={{ color: "#FF006E", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        {product.brand || "JongTinh"}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 10 }}>•</Text>
                    <Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase", fontWeight: 600, letterSpacing: 0.5 }}>
                        {product.category}
                    </Text>
                </Space>

                <Title level={5} style={{ marginTop: 0, marginBottom: 8, fontSize: 15, lineHeight: "1.4" }} ellipsis={{ rows: 2 }}>
                    {product.name}
                </Title>

                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                    <StarFilled style={{ color: "#faad14", fontSize: 13 }} />
                    <Text strong style={{ fontSize: 13 }}>{product.rating}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>({product.reviewCount})</Text>
                </div>

                {/* Display dynamic attributes preview (e.g., colors) */}
                {product.colors && product.colors.length > 0 && (
                    <Space size={4} style={{ marginBottom: 12 }}>
                        {product.colors.slice(0, 4).map((color, idx) => (
                            <Tooltip title={color.name || color.hex} key={idx}>
                                <div style={{
                                    width: 14, height: 14, borderRadius: "50%",
                                    backgroundColor: color.hex, border: "1px solid rgba(0,0,0,0.1)"
                                }} />
                            </Tooltip>
                        ))}
                        {product.colors.length > 4 && <Text style={{ fontSize: 10, color: "#999" }}>+{product.colors.length - 4}</Text>}
                    </Space>
                )}
            </div>

            <div style={{ marginTop: "auto" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 16 }}>
                    {hasDiscount ? (
                        <>
                            <Text strong style={{ color: "#FF006E", fontSize: 20 }}>
                                ${product.discountPrice?.toFixed(2)}
                            </Text>
                            <Text delete type="secondary" style={{ fontSize: 13 }}>
                                ${product.price.toFixed(2)}
                            </Text>
                        </>
                    ) : (
                        <Text strong style={{ fontSize: 20 }}>
                            ${product.price.toFixed(2)}
                        </Text>
                    )}
                </div>

                <Button
                    block
                    type="primary"
                    icon={<ShoppingCartOutlined />}
                    onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                    }}
                    disabled={!isInStock}
                    style={{
                        height: 42,
                        borderRadius: 12,
                        background: isInStock ? "#FF006E" : (isDark ? "#333" : "#f0f0f0"),
                        color: isInStock ? "#fff" : "#999",
                        border: "none",
                        fontWeight: 600,
                        boxShadow: isInStock ? "0 4px 12px rgba(255, 0, 110, 0.25)" : "none"
                    }}
                >
                    {isInStock ? "Add to Cart" : "Out of Stock"}
                </Button>
            </div>
        </Card>
    );
};
