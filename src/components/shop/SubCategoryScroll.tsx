import React from "react";
import { Tag, Space } from "antd";
import { ISubCategory } from "../../interfaces";

interface SubCategoryScrollProps {
    subCategories: ISubCategory[];
    selectedSubCategory: string | null;
    onSelectSubCategory: (id: string | null) => void;
    isDark: boolean;
}

export const SubCategoryScroll: React.FC<SubCategoryScrollProps> = ({
    subCategories,
    selectedSubCategory,
    onSelectSubCategory,
    isDark
}) => {
    if (!subCategories || subCategories.length === 0) return null;

    return (
        <div style={{
            marginBottom: 24,
            overflowX: "auto",
            whiteSpace: "nowrap",
            padding: "8px 4px",
            scrollbarWidth: "none",
        }}>
            <Space size={8}>
                <Tag.CheckableTag
                    checked={selectedSubCategory === null}
                    onChange={() => onSelectSubCategory(null)}
                    style={{
                        padding: "6px 16px",
                        borderRadius: 16,
                        fontSize: 13,
                        border: "1px solid",
                        borderColor: selectedSubCategory === null ? "#FF006E" : (isDark ? "#333" : "#d9d9d9"),
                        background: selectedSubCategory === null ? "#FF006E" : "transparent",
                    }}
                >
                    All
                </Tag.CheckableTag>
                {subCategories.map((sub) => (
                    <Tag.CheckableTag
                        key={sub.id}
                        checked={selectedSubCategory === sub.id}
                        onChange={(checked) => onSelectSubCategory(checked ? sub.id : null)}
                        style={{
                            padding: "6px 16px",
                            borderRadius: 16,
                            fontSize: 13,
                            border: "1px solid",
                            borderColor: selectedSubCategory === sub.id ? "#FF006E" : (isDark ? "#333" : "#d9d9d9"),
                            background: selectedSubCategory === sub.id ? "#FF006E" : "transparent",
                        }}
                    >
                        {sub.name}
                    </Tag.CheckableTag>
                ))}
            </Space>
        </div>
    );
};
