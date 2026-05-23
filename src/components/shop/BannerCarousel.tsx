import React from "react";
import { Carousel, Typography } from "antd";
import { IPromotionBanner } from "../../interfaces";
import logo from "../../images/logo.webp";
import { useLanguage } from "../../contexts/LanguageContext";

const { Title, Text } = Typography;

interface BannerCarouselProps {
    banners: IPromotionBanner[];
    onBannerClick: (banner: IPromotionBanner) => void;
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({ banners, onBannerClick }) => {
    const { t } = useLanguage();
    if (banners.length === 0) {
        return (
            <div style={{
                background: "linear-gradient(135deg, #FF006E 0%, #8338EC 100%)",
                borderRadius: 20, padding: "64px 32px", marginBottom: 32, color: "#fff",
                textAlign: "center", position: "relative", overflow: "hidden",
            }}>
                <div style={{ position: "absolute", top: -40, right: -40, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />
                <div style={{ position: "absolute", bottom: -30, left: -30, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                    <img src={logo} alt="SmartShop Logo" style={{ width: 100, height: 100, marginBottom: 16, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))" }} />
                    <Title level={1} style={{ color: "#fff", marginBottom: 8, fontSize: 48, fontWeight: 800 }}>JongTinh</Title>
                    <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 20, maxWidth: 600, display: "inline-block" }}>
                        {t.home.subtitle}
                    </Text>
                </div>
            </div>
        );
    }

    return (
        <Carousel
            key={banners.length}
            autoplay
            autoplaySpeed={4000}
            dots={true}
            effect="fade"
            style={{ marginBottom: 32, borderRadius: 20, overflow: "hidden" }}
        >
            {banners.map((banner, index) => (
                <div key={banner.id}>
                    <div
                        onClick={() => onBannerClick(banner)}
                        style={{
                            position: "relative",
                            width: "100%",
                            height: 400,
                            cursor: banner.actionUrl ? "pointer" : "default",
                            overflow: "hidden",
                        }}
                    >
                        {banner.imageUrl ? (
                            <img
                                src={banner.imageUrl}
                                alt={banner.title}
                                style={{
                                    width: "100%", height: "100%", objectFit: "cover",
                                    position: "absolute", top: 0, left: 0,
                                }}
                            />
                        ) : (
                            <div style={{
                                width: "100%", height: "100%",
                                background: banner.backgroundColor || "linear-gradient(135deg, #FF006E 0%, #8338EC 100%)",
                                position: "absolute", top: 0, left: 0,
                            }} />
                        )}
                        <div style={{
                            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                            background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.1) 100%)",
                        }} />
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "40px 32px", color: "#fff", zIndex: 2 }}>
                            <Title level={1} style={{ color: "#fff", marginBottom: 8, fontSize: 36, fontWeight: 700, textShadow: "0 2px 8px rgba(0,0,0,0.4)", lineHeight: 1.2 }}>
                                {banner.title}
                            </Title>
                            {banner.subtitle && (
                                <Text style={{ color: "rgba(255,255,255,0.95)", fontSize: 18, textShadow: "0 1px 4px rgba(0,0,0,0.3)", display: "block" }}>
                                    {banner.subtitle}
                                </Text>
                            )}
                            {banner.actionUrl && (
                                <div style={{ marginTop: 12 }}>
                                    <span style={{ color: "#fff", fontSize: 14, fontWeight: 600, background: "rgba(255,255,255,0.2)", padding: "8px 20px", borderRadius: 20, backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.3)" }}>
                                        {t.home.shopNow || "Shop Now"} →
                                    </span>
                                </div>
                            )}
                        </div>
                        <div style={{ position: "absolute", top: 16, right: 16, zIndex: 3, background: "rgba(0,0,0,0.5)", borderRadius: 12, padding: "4px 12px", backdropFilter: "blur(10px)" }}>
                            <Text style={{ color: "#fff", fontSize: 12 }}>{index + 1} / {banners.length}</Text>
                        </div>
                    </div>
                </div>
            ))}
        </Carousel>
    );
};