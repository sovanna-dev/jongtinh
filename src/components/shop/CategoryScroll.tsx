import React from "react";
import { Button } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { ICategory } from "../../interfaces";
import { CategoryChip } from "./CategoryChip";

interface CategoryScrollProps {
    categories: ICategory[];
    selectedCategory: string | null;
    onSelectCategory: (categoryId: string | null) => void;
    isDark: boolean;
}

export const CategoryScroll: React.FC<CategoryScrollProps> = ({
    categories, selectedCategory, onSelectCategory, isDark,
}) => {
    const scroll = (direction: "left" | "right") => {
        const container = document.getElementById("category-scroll");
        if (container) {
            container.scrollBy({ left: direction === "left" ? -200 : 200, behavior: "smooth" });
        }
    };

    return (
        <div style={{
            marginBottom: 32, display: "flex", alignItems: "center", gap: 8,
            background: isDark ? "#1a1a1a" : "#fff",
            padding: "12px 8px", borderRadius: "30px",
            border: isDark ? "1px solid #333" : "1px solid #eee",
            boxShadow: isDark ? "0 4px 15px rgba(0,0,0,0.3)" : "0 4px 15px rgba(0,0,0,0.03)",
        }}>
            <Button
                icon={<LeftOutlined />}
                shape="circle"
                size="small"
                onClick={() => scroll("left")}
                style={{ flexShrink: 0, border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", zIndex: 2 }}
            />

            <div id="category-scroll" style={{
                flex: 1, overflowX: "auto", overflowY: "hidden", whiteSpace: "nowrap",
                scrollbarWidth: "none", msOverflowStyle: "none",
                display: "flex", gap: 8, padding: "4px 0", cursor: "grab", scrollBehavior: "smooth",
            }}>
                <CategoryChip cat={null} isSelected={selectedCategory === null} onClick={() => onSelectCategory(null)} isDark={isDark} />
                {categories.map((cat) => (
                    <CategoryChip key={cat.id} cat={cat} isSelected={selectedCategory === cat.id} onClick={() => onSelectCategory(cat.id)} isDark={isDark} />
                ))}
            </div>

            <Button
                icon={<RightOutlined />}
                shape="circle"
                size="small"
                onClick={() => scroll("right")}
                style={{ flexShrink: 0, border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", zIndex: 2 }}
            />
        </div>
    );
};