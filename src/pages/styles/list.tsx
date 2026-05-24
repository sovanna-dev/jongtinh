import { List, useTable, EditButton, DeleteButton, CreateButton } from "@refinedev/antd";
import { Table, Space, Image, Tag, Typography } from "antd";
import { IStyle } from "../../interfaces";

const { Text } = Typography;

export const StyleList = () => {
    const { tableProps } = useTable<IStyle>({
        syncWithLocation: true,
        resource: "styles",
        sorters: {
            initial: [
                {
                    field: "order",
                    order: "asc",
                },
            ],
        },
    });

    return (
        <List headerButtons={<CreateButton />}>
            <Table {...tableProps} rowKey="id">
                <Table.Column
                    dataIndex="order"
                    title="Order"
                    width={80}
                    sorter
                />
                <Table.Column
                    dataIndex="image"
                    title="Preview Image"
                    render={(value) => (
                        <Image
                            src={value}
                            width={50}
                            height={70}
                            style={{ objectFit: "cover", borderRadius: 8 }}
                        />
                    )}
                />
                <Table.Column
                    dataIndex="bannerImage"
                    title="Banner"
                    render={(value) => (
                        <Image
                            src={value}
                            width={80}
                            height={50}
                            style={{ objectFit: "cover", borderRadius: 8 }}
                            fallback="https://via.placeholder.com/80x50"
                        />
                    )}
                />
                <Table.Column
                    dataIndex="name"
                    title="Style Name"
                    render={(value, record: IStyle) => (
                        <Space direction="vertical" size={0}>
                            <Text strong style={{ color: record.color }}>{value}</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>{record.label}</Text>
                        </Space>
                    )}
                />
                <Table.Column
                    dataIndex="gallery"
                    title="Gallery"
                    render={(value: string[]) => (
                        <Text>{value?.length || 0} images</Text>
                    )}
                />
                <Table.Column
                    dataIndex="color"
                    title="Theme Color"
                    render={(value) => (
                        <Tag color={value} style={{ border: "none", fontWeight: "bold" }}>
                            {value}
                        </Tag>
                    )}
                />
                <Table.Column
                    dataIndex="isActive"
                    title="Status"
                    render={(value) => (
                        <Tag color={value ? "green" : "red"}>
                            {value ? "ACTIVE" : "INACTIVE"}
                        </Tag>
                    )}
                />
                <Table.Column
                    title="Actions"
                    dataIndex="actions"
                    render={(_, record: IStyle) => (
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
