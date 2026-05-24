import {
    List,
    useTable,
    DateField,
    DeleteButton,
} from "@refinedev/antd";
import { Table, Space, Tag } from "antd";
import { INotification } from "../../interfaces";

export const NotificationList = () => {
    const { tableProps } = useTable<INotification>({
        syncWithLocation: true,
        sorters: {
            initial: [
                {
                    field: "timestamp",  // ✅ Changed from "createdAt"
                    order: "desc",
                },
            ],
        },
    });

    return (
        <List>
            <Table {...tableProps} rowKey="id">
                <Table.Column
                    dataIndex="type"
                    title="Type"
                    render={(value) => {
                        let color = "blue";
                        if (value === "promo") color = "green";
                        if (value === "order") color = "orange";
                        if (value === "general") color = "blue";
                        return <Tag color={color}>{value?.toUpperCase()}</Tag>;
                    }}
                />
                <Table.Column dataIndex="title" title="Title" />
                <Table.Column dataIndex="message" title="Message" ellipsis />
                <Table.Column
                    dataIndex="userId"
                    title="Target"
                    render={(value) => (
                        <Tag color={value === "all" ? "gold" : "geekblue"}>
                            {value === "all" ? "Broadcast" : "Specific User"}
                        </Tag>
                    )}
                />
                <Table.Column
                    dataIndex="targetEmail"
                    title="Target Email"
                    render={(value) => value ? <Tag>{value}</Tag> : <Tag color="default">N/A</Tag>}
                />
                <Table.Column
                    dataIndex="timestamp"
                    title="Sent At"
                    render={(value) => <DateField value={value} format="LLL" />}
                />
                <Table.Column
                    title="Actions"
                    dataIndex="actions"
                    render={(_, record: INotification) => (
                        <Space>
                            <DeleteButton hideText size="small" recordItemId={record.id} />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
};