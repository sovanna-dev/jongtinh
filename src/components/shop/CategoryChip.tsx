import React, { useState, useEffect } from "react";
import { Image } from "antd";
import Lottie from "lottie-react";
import { ICategory } from "../../interfaces";

// Map category names to Lottie animation files
const categoryAnimations: Record<string, string> = {
    "Electronics": "iphone.json",
    "Beauty": "beauty.json",
    "Food": "fruits.json",
    "Groceries": "fruit_basket.json",
    "Fashion": "cosmetic.json",
    "Lifestyle": "onboarding_shopping.json",
};

interface CategoryChipProps {
    cat: ICategory | null;
    isSelected: boolean;
    onClick: () => void;
}

export const CategoryChip: React.FC<CategoryChipProps> = ({ cat, isSelected, onClick }) => {
    const [animationData, setAnimationData] = useState<any>(null);

    useEffect(() => {
        if (cat && categoryAnimations[cat.name]) {
            fetch(`./animations/${categoryAnimations[cat.name]}`)
                .then(res => res.json())
                .then(data => setAnimationData(data))
                .catch(() => {});
        }
    }, [cat]);

    return (
        <div
            onClick={onClick}
            style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 24px", borderRadius: "25px", cursor: "pointer",
                background: isSelected ? "#FF006E" : "rgba(255, 255, 255, 0.8)",
                color: isSelected ? "#fff" : "#555",
                fontWeight: 600,
                boxShadow: isSelected ? "0 4px 12px rgba(255, 0, 110, 0.3)" : "0 2px 8px rgba(0,0,0,0.05)",
                transition: "all 0.3s ease",
                border: "1px solid",
                borderColor: isSelected ? "#FF006E" : "rgba(0,0,0,0.05)",
                whiteSpace: "nowrap", flexShrink: 0, userSelect: "none",
            }}
        >
            {cat ? (
                <>
                    {animationData ? (
                        <div style={{ width: 24, height: 24 }}>
                            <Lottie animationData={animationData} loop={true} style={{ width: "100%", height: "100%" }} />
                        </div>
                    ) : cat.icon ? (
                        <Image src={cat.icon} width={20} preview={false}
                            style={{ filter: isSelected ? "brightness(0) invert(1)" : "none" }} />
                    ) : null}
                    {cat.name}
                </>
            ) : (
                "All Products"
            )}
        </div>
    );
};