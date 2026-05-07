import {
    List,
    useTable,
    EditButton,
    DeleteButton,
    ShowButton,
    getDefaultFilter,
} from "@refinedev/antd";
import { Table, Space, Tag, Image, Typography, Select } from "antd";
import { useMany, useSelect } from "@refinedev/core";
import { IProduct, ICategory } from "../../interfaces";

const { Text } = Typography;

export const ProductList = () => {
    const { tableProps, filters } = useTable<IProduct>({
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
    }) as any;

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
                <Table.Column dataIndex="name" title="Name" filterIcon />
                <Table.Column
                    dataIndex="category"
                    title="Category"
                    render={(value) => {
                        if (categoriesLoading) return "Loading...";
                        const category = categoriesData?.data.find((item: any) => item.id === value);
                        return <Tag color="blue">{category?.name || "No Category"}</Tag>;
                    }}
                    filterDropdown={(props) => (
                        <div style={{ padding: 8 }}>
                            <Select
                                {...categorySelectProps}
                                style={{ width: 200 }}
                                placeholder="Select Category"
                                {...props}
                            />
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
