import React, { useState } from "react";
import { Card, Typography, Tag, Image, Button, Space, Tooltip, message } from "antd";
import { ShoppingCartOutlined, StarFilled, HeartOutlined, HeartFilled } from "@ant-design/icons";
import { useNavigate } from "react-router";
import { IProduct } from "../../interfaces";
import { useCart } from "../../contexts/CartContext";
import { useWishlist } from "../../contexts/WishlistContext";
import { auth } from "../../firebase";
import { AuthModal } from "./AuthModal";

const { Title, Text } = Typography;

interface ProductCardProps {
    product: IProduct;
    isDark: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, isDark }) => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { isFavorite, toggleFavorite } = useWishlist();
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    const price = product.discountPrice ?? product.price;
    const isInStock = product.isAvailable && (product.stockQuantity || 0) > 0;
    const hasDiscount = !!product.discountPrice;
    const discountPercentage = hasDiscount
        ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
        : 0;

    const isFav = isFavorite(product.id);

    const handleWishlistClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const user = auth.currentUser;
        if (!user) {
            setAuthModalOpen(true);
            return;
        }
        setIsAnimating(true);
        toggleFavorite(product.id);
        setTimeout(() => setIsAnimating(false), 300);
        message.success(isFav ? "Removed from wishlist" : "Added to wishlist");
    };

    return (
        <>
            <Card
                hoverable
                onClick={() => navigate(`/shop/product/${product.id}`)}
                className="product-card"
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
                    position: "relative",
                }}
                styles={{ body: { padding: "12px 10px", flex: 1, display: "flex", flexDirection: "column" } }}
                cover={
                    <div style={{ position: "relative", overflow: "hidden", aspectRatio: "3/4" }}>
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

                        {/* Wishlist Heart */}
                        <div
                            onClick={handleWishlistClick}
                            style={{
                                position: "absolute",
                                top: 10,
                                right: 10,
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                background: isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.8)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                zIndex: 3,
                                backdropFilter: "blur(4px)",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                transition: "transform 0.2s ease",
                                transform: isAnimating ? "scale(1.3)" : "scale(1)",
                            }}
                        >
                            {isFav ? (
                                <HeartFilled style={{ color: "#E53935", fontSize: 16 }} />
                            ) : (
                                <HeartOutlined style={{ color: isDark ? "#fff" : "#666", fontSize: 16 }} />
                            )}
                        </div>

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

                    <Title level={5} style={{ marginTop: 0, marginBottom: 4, fontSize: 14, lineHeight: "1.4" }} ellipsis={{ rows: 2 }}>
                        {product.name}
                    </Title>

                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                        <StarFilled style={{ color: "#faad14", fontSize: 11 }} />
                        <Text strong style={{ fontSize: 11 }}>{product.rating}</Text>
                        <Text type="secondary" style={{ fontSize: 10 }}>({product.reviewCount})</Text>
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
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 12 }}>
                        {hasDiscount ? (
                            <>
                                <Text strong style={{ color: "#FF006E", fontSize: 16 }}>
                                    ${product.discountPrice?.toFixed(2)}
                                </Text>
                                <Text delete type="secondary" style={{ fontSize: 11 }}>
                                    ${product.price.toFixed(2)}
                                </Text>
                            </>
                        ) : (
                            <Text strong style={{ fontSize: 16 }}>
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
                            height: 36,
                            borderRadius: 10,
                            background: isInStock ? "#FF006E" : (isDark ? "#333" : "#f0f0f0"),
                            color: isInStock ? "#fff" : "#999",
                            border: "none",
                            fontWeight: 600,
                            fontSize: 13,
                            boxShadow: isInStock ? "0 4px 12px rgba(255, 0, 110, 0.25)" : "none"
                        }}
                    >
                        {isInStock ? "Add to Cart" : "Out of Stock"}
                    </Button>
                </div>
            </Card>
            <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        </>
    );
};
