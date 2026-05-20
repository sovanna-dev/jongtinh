import { List, useTable, EditButton, DeleteButton } from "@refinedev/antd";
import { Table, Space, Avatar, Tag } from "antd";
import { ICategory } from "../../interfaces";

export const CategoryList = () => {
    const { tableProps } = useTable<ICategory>({
        syncWithLocation: true,
        resource: "categories",
    });

    return (
        <List>
            <Table {...tableProps} rowKey="id">
                <Table.Column dataIndex="id" title="ID" />
                <Table.Column
                    dataIndex="icon"
                    title="Icon"
                    render={(value) => <Avatar src={value} shape="square" />}
                />
                <Table.Column dataIndex="name" title="Name" />
                <Table.Column
                    dataIndex="subCategories"
                    title="Subcategories"
                    render={(value: { id: string; name: string }[]) => {
                        if (!value || value.length === 0) return "-";
                        return (
                            <Space size={4} wrap>
                                {value.map((sub) => (
                                    <Tag key={sub.id} color="#FF006E" style={{ borderRadius: 12 }}>
                                        {sub.name}
                                    </Tag>
                                ))}
                            </Space>
                        );
                    }}
                />
                <Table.Column dataIndex="productCount" title="Product Count" />
                <Table.Column
                    title="Actions"
                    dataIndex="actions"
                    render={(_, record: ICategory) => (
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
