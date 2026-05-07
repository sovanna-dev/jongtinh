import {
    List,
    useTable,
    TextField,
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
                    field: "createdAt",
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
                        if (value === "PROMO") color = "green";
                        if (value === "ORDER") color = "orange";
                        return <Tag color={color}>{value}</Tag>;
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
                    dataIndex="createdAt"
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
