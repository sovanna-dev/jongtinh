import React, { useState, useEffect } from "react";
import { Drawer, Space, Button, Checkbox, Divider, Slider, Typography, Tag, Skeleton } from "antd";
import { FilterOutlined, ReloadOutlined } from "@ant-design/icons";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

const { Title, Text } = Typography;

interface FilterDrawerProps {
    visible: boolean;
    onClose: () => void;
    filters: any;
    onFilterChange: (filters: any) => void;
    onReset: () => void;
    isDark: boolean;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
    visible, onClose, filters, onFilterChange, onReset, isDark
}) => {
    const [availableBrands, setAvailableBrands] = useState<string[]>([]);
    const [loadingBrands, setLoadingBrands] = useState(false);

    useEffect(() => {
        const fetchBrands = async () => {
            if (!visible) return; // Only fetch when drawer opens

            setLoadingBrands(true);
            try {
                const querySnapshot = await getDocs(collection(db, "products"));
                const brandsSet = new Set<string>();

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.brand) {
                        brandsSet.add(data.brand);
                    }
                });

                // Ensure "JongTinh" is included if it's our default
                if (brandsSet.size === 0) {
                    brandsSet.add("JongTinh");
                }

                const sortedBrands = Array.from(brandsSet).sort();
                setAvailableBrands(sortedBrands);
            } catch (error) {
                console.error("Error fetching brands:", error);
            } finally {
                setLoadingBrands(false);
            }
        };

        fetchBrands();
    }, [visible]);

    return (
        <Drawer
            title={
                <Space>
                    <FilterOutlined />
                    <span>Filter Products</span>
                </Space>
            }
            placement="right"
            onClose={onClose}
            open={visible}
            width={320}
            extra={
                <Button type="text" icon={<ReloadOutlined />} onClick={onReset}>
                    Reset
                </Button>
            }
            styles={{
                header: { borderBottom: isDark ? "1px solid #333" : "1px solid #f0f0f0" },
                body: { background: isDark ? "#141414" : "#fff" }
            }}
        >
            <Space direction="vertical" size={24} style={{ width: "100%" }}>
                {/* Price Range */}
                <div>
                    <Title level={5}>Price Range</Title>
                    <Slider
                        range
                        defaultValue={[0, 2000]}
                        max={5000}
                        tipFormatter={(value) => `$${value}`}
                        onChangeComplete={(val) => onFilterChange({ ...filters, priceRange: val })}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <Text type="secondary">$0</Text>
                        <Text type="secondary">$5000+</Text>
                    </div>
                </div>

                <Divider style={{ margin: "4px 0" }} />

                {/* Dynamic Attributes: Brands */}
                <div>
                    <Title level={5}>Brands</Title>
                    {loadingBrands ? (
                        <Skeleton active paragraph={{ rows: 3 }} title={false} />
                    ) : (
                        <Checkbox.Group
                            options={availableBrands}
                            value={filters.brands}
                            onChange={(val) => onFilterChange({ ...filters, brands: val })}
                            style={{ display: "flex", flexDirection: "column", gap: 8 }}
                        />
                    )}
                </div>

                {/* Availability */}
                <div>
                    <Title level={5}>Availability</Title>
                    <Checkbox
                        onChange={(e) => onFilterChange({ ...filters, inStock: e.target.checked })}
                    >
                        In Stock Only
                    </Checkbox>
                </div>

                {/* Ratings */}
                <div>
                    <Title level={5}>Minimum Rating</Title>
                    <Space wrap>
                        {[4, 3, 2].map(star => (
                            <Tag.CheckableTag
                                key={star}
                                checked={filters.minRating === star}
                                onChange={() => onFilterChange({ ...filters, minRating: star })}
                                style={{ borderRadius: 12, padding: "4px 12px" }}
                            >
                                {star}★ & Up
                            </Tag.CheckableTag>
                        ))}
                    </Space>
                </div>
            </Space>

            <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                padding: "16px 24px", background: isDark ? "#1f1f1f" : "#fff",
                borderTop: isDark ? "1px solid #333" : "1px solid #f0f0f0"
            }}>
                <Button type="primary" block size="large" onClick={onClose} style={{ borderRadius: 12, height: 48, background: "#FF006E", border: "none" }}>
                    Show Results
                </Button>
            </div>
        </Drawer>
    );
};
