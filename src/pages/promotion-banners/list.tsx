import {
    List,
    useTable,
    EditButton,
    DeleteButton,
    DateField,
} from "@refinedev/antd";
import { Table, Space, Tag, Image } from "antd";
import { IPromotionBanner } from "../../interfaces";

export const BannerList = () => {
    const { tableProps } = useTable<IPromotionBanner>({
        syncWithLocation: true,
        resource: "promotion_banners",
    });

    return (
        <List>
            <Table {...tableProps} rowKey="id">
                <Table.Column dataIndex="id" title="ID" />
                <Table.Column
                    dataIndex="imageUrl"
                    title="Banner"
                    render={(value) => (
                        <Image
                            width={100}
                            src={value}
                            fallback="https://via.placeholder.com/100x50?text=No+Image"
                        />
                    )}
                />
                <Table.Column dataIndex="title" title="Title" />
                <Table.Column dataIndex="subtitle" title="Subtitle" />
                <Table.Column
                    dataIndex="backgroundColor"
                    title="Color"
                    render={(value) => (
                        <Tag color={value}>{value}</Tag>
                    )}
                />
                <Table.Column
                    dataIndex="isActive"
                    title="Status"
                    render={(value) => (
                        <Tag color={value ? "green" : "red"}>
                            {value ? "Active" : "Inactive"}
                        </Tag>
                    )}
                />
                <Table.Column
                    title="Actions"
                    dataIndex="actions"
                    render={(_, record: IPromotionBanner) => (
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
