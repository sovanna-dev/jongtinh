import {
    List,
    useTable,
    EditButton,
    DeleteButton,
} from "@refinedev/antd";
import { Table, Space, Tag, Image, Typography, Select, Button, Tooltip } from "antd";
import { useMany } from "@refinedev/core";
import { useSelect } from "@refinedev/antd";
import { IProduct, ICategory } from "../../interfaces";
import { useLanguage } from "../../contexts/LanguageContext";

const { Text } = Typography;

export const ProductList = () => {
    const { t } = useLanguage();
    const { tableProps } = useTable<IProduct>({
        syncWithLocation: true,
        resource: "products",
    });

    const { query: categoriesQuery } = useMany<ICategory>({
        resource: "categories",
        ids: tableProps?.dataSource?.map((item) => item?.category).filter(Boolean) ?? [],
        queryOptions: {
            enabled: !!tableProps?.dataSource,
        },
    });

    const { selectProps: categorySelectProps } = useSelect<ICategory>({
        resource: "categories",
        optionLabel: "name",
    });

    const categoriesData = categoriesQuery?.data;
    const categoriesLoading = categoriesQuery?.isLoading;

    return (
        <List title={t.admin.dashboard.products}>
            <Table {...tableProps} rowKey="id">
                <Table.Column dataIndex="id" title="ID" width={100} ellipsis />
                <Table.Column
                    dataIndex="images"
                    title={t.product.details}
                    render={(value: string[]) => (
                        <Image
                            width={50}
                            src={value?.[0]}
                            fallback="https://via.placeholder.com/50?text=No+Img"
                        />
                    )}
                />
                <Table.Column dataIndex="name" title={t.admin.product.name} />
                <Table.Column
                    dataIndex="brand"
                    title={t.admin.product.brand}
                    render={(value: string) => (
                        <Tag color={value === "JongTinh" ? "#FF006E" : "blue"}>
                            {value || "JongTinh"}
                        </Tag>
                    )}
                />
                <Table.Column
                    dataIndex="category"
                    title={t.admin.product.category}
                    render={(value) => {
                        if (categoriesLoading) return "Loading...";
                        const category = categoriesData?.data.find((item: any) => item.id === value);
                        return <Tag color="blue">{category?.name || "No Category"}</Tag>;
                    }}
                    filterDropdown={({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
                        <div style={{ padding: 8 }}>
                            <Select
                                {...(categorySelectProps as any)}
                                style={{ width: 200, display: "block", marginBottom: 8 }}
                                placeholder={t.admin.product.validation.categoryRequired}
                                allowClear
                                value={selectedKeys[0] as string}
                                onChange={(value: string) => {
                                    setSelectedKeys(value ? [value] : []);
                                    confirm();
                                }}
                            />
                            <Button
                                size="small"
                                onClick={() => {
                                    clearFilters?.();
                                    confirm();
                                }}
                                style={{ width: "100%" }}
                            >
                                {t.home.reset}
                            </Button>
                        </div>
                    )}
                />
                <Table.Column
                    dataIndex="price"
                    title={t.admin.product.price}
                    render={(value) => (
                        <Text strong>${value?.toFixed(2)}</Text>
                    )}
                    sorter
                />
                <Table.Column
                    dataIndex="stockQuantity"
                    title={t.admin.product.stock}
                    render={(value) => (
                        <Tag color={value > 10 ? "green" : "volcano"}>
                            {value} {t.product.quantity}
                        </Tag>
                    )}
                    sorter
                />
                <Table.Column
                    dataIndex="isAvailable"
                    title={t.admin.product.available}
                    render={(value) => (
                        <Tag color={value ? "cyan" : "red"}>
                            {value ? t.faq.yes : t.faq.no}
                        </Tag>
                    )}
                />
                <Table.Column
                    dataIndex="isFeatured"
                    title={t.admin.product.featured}
                    render={(value) => (
                        <Tag color={value ? "gold" : "default"}>
                            {value ? t.admin.product.featured : t.faq.no}
                        </Tag>
                    )}
                />
                <Table.Column
                    title={t.admin.product.attributes}
                    render={(_, record: IProduct) => {
                        // Handle potential legacy data where attributes/specifications might be objects
                        const attributes = Array.isArray(record.attributes)
                            ? record.attributes
                            : Object.entries(record.attributes || {}).map(([key, value]) => ({
                                key,
                                label: key,
                                value: String(value),
                                displayType: "TEXT" as const
                            }));

                        const specifications = record.specifications || {};
                        const colors = record.colors || [];

                        const attrEntries = attributes.map(attr => [attr.label || attr.key, attr.value]);
                        const specEntries = Object.entries(specifications);

                        const allEntries = [...attrEntries, ...specEntries];

                        if (allEntries.length === 0 && colors.length === 0) return "-";

                        return (
                            <Space size={4} wrap>
                                {colors.map((color, index) => (
                                    <Tooltip title={color.name || color.hex} key={`color-${index}`}>
                                        <div
                                            style={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: "50%",
                                                backgroundColor: color.hex,
                                                border: "1px solid #d9d9d9",
                                            }}
                                        />
                                    </Tooltip>
                                ))}
                                {allEntries.slice(0, 3).map(([key, val], index) => (
                                    <Tag key={`attr-${index}`} color="purple" style={{ fontSize: 10, margin: 0 }}>
                                        {key}: {val}
                                    </Tag>
                                ))}
                                {allEntries.length > 3 && (
                                    <Tag key="attr-more" color="default" style={{ fontSize: 10, margin: 0 }}>
                                        +{allEntries.length - 3}
                                    </Tag>
                                )}
                            </Space>
                        );
                    }}
                />
                <Table.Column
                    title={t.adminOrders.actions}
                    dataIndex="actions"
                    render={(_, record: IProduct) => (
                        <Space>
                            <EditButton hideText size="small" recordItemId={record.id} />
                            <DeleteButton hideText size="small" recordItemId={record.id} />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
};