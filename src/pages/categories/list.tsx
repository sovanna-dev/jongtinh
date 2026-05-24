import { List, useTable, EditButton, DeleteButton } from "@refinedev/antd";
import { Table, Space, Avatar, Tag } from "antd";
import { ICategory } from "../../interfaces";
import { useLanguage } from "../../contexts/LanguageContext";

export const CategoryList = () => {
    const { t } = useLanguage();
    const { tableProps } = useTable<ICategory>({
        syncWithLocation: true,
        resource: "categories",
    });

    return (
        <List title={t.admin.dashboard.categories}>
            <Table {...tableProps} rowKey="id">
                <Table.Column dataIndex="id" title="ID" />
                <Table.Column
                    dataIndex="icon"
                    title={t.admin.category.icon}
                    render={(value) => <Avatar src={value} shape="square" />}
                />
                <Table.Column dataIndex="name" title={t.admin.category.name} />
                <Table.Column
                    dataIndex="subCategories"
                    title={t.admin.category.subcategories}
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
                <Table.Column dataIndex="productCount" title={t.admin.category.productCount} />
                <Table.Column
                    title={t.adminOrders.actions}
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
