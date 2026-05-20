import {
    List,
    useTable,
    EditButton,
    DeleteButton,
} from "@refinedev/antd";
import { Table, Space, Tag, Image, Typography, Select, Button } from "antd";
import { useMany } from "@refinedev/core";
import { useSelect } from "@refinedev/antd";
import { IProduct, ICategory } from "../../interfaces";

const { Text } = Typography;

export const ProductList = () => {
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
        <List>
            <Table {...tableProps} rowKey="id">
                <Table.Column dataIndex="id" title="ID" width={100} ellipsis />
                <Table.Column
                    dataIndex="images"
                    title="Image"
                    render={(value: string[]) => (
                        <Image
                            width={50}
                            src={value?.[0]}
                            fallback="https://via.placeholder.com/50?text=No+Img"
                        />
                    )}
                />
                <Table.Column dataIndex="name" title="Name" />
                <Table.Column
                    dataIndex="category"
                    title="Category"
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
                                placeholder="Select Category"
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
                                Reset
                            </Button>
                        </div>
                    )}
                />
                <Table.Column
                    dataIndex="price"
                    title="Price"
                    render={(value) => (
                        <Text strong>${value?.toFixed(2)}</Text>
                    )}
                    sorter
                />
                <Table.Column
                    dataIndex="stockQuantity"
                    title="Stock"
                    render={(value) => (
                        <Tag color={value > 10 ? "green" : "volcano"}>
                            {value} units
                        </Tag>
                    )}
                    sorter
                />
                <Table.Column
                    dataIndex="isAvailable"
                    title="Available"
                    render={(value) => (
                        <Tag color={value ? "cyan" : "red"}>
                            {value ? "Yes" : "No"}
                        </Tag>
                    )}
                />
                <Table.Column
                    dataIndex="attributes"
                    title="Attributes"
                    render={(value: Record<string, string>) => {
                        if (!value || Object.keys(value).length === 0) return "-";
                        return (
                            <Space size={4} wrap>
                                {Object.entries(value).slice(0, 2).map(([key, val]) => (
                                    <Tag key={key} color="purple" style={{ fontSize: 11 }}>
                                        {key}: {val}
                                    </Tag>
                                ))}
                                {Object.keys(value).length > 2 && (
                                    <Tag color="default" style={{ fontSize: 11 }}>
                                        +{Object.keys(value).length - 2} more
                                    </Tag>
                                )}
                            </Space>
                        );
                    }}
                />
                <Table.Column
                    title="Actions"
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