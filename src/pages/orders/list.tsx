import {
    List,
    useTable,
    EditButton,
    ShowButton,
} from "@refinedev/antd";
import { Table, Space, Tag, Typography } from "antd";
import { IOrder, OrderStatus } from "../../interfaces";
import dayjs from "dayjs";

const { Text } = Typography;

export const OrderList = () => {
    const { tableProps } = useTable<IOrder>({
        syncWithLocation: true,
        resource: "orders",
        sorters: {
            initial: [
                {
                    field: "createdAt",
                    order: "desc",
                },
            ],
        },
    });

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case "PENDING": return "orange";
            case "PROCESSING": return "blue";
            case "SHIPPING": return "purple";
            case "DELIVERED": return "green";
            case "CANCELLED": return "red";
            default: return "default";
        }
    };

    return (
        <List title="Orders Management">
            <Table {...tableProps} rowKey="id">
                <Table.Column dataIndex="orderId" title="Order ID" width={150} ellipsis />
                <Table.Column
                    dataIndex="createdAt"
                    title="Date"
                    render={(value) => dayjs(value).format("YYYY-MM-DD HH:mm")}
                    sorter
                />
                <Table.Column
                    dataIndex={["shippingAddress", "fullName"]}
                    title="Customer"
                />
                <Table.Column
                    dataIndex="total"
                    title="Total"
                    render={(value) => <Text strong>${value?.toFixed(2)}</Text>}
                    sorter
                />
                <Table.Column
                    dataIndex="orderStatus"
                    title="Status"
                    render={(value: OrderStatus) => (
                        <Tag color={getStatusColor(value)}>{value}</Tag>
                    )}
                    filters={[
                        { text: "Pending", value: "PENDING" },
                        { text: "Processing", value: "PROCESSING" },
                        { text: "Shipping", value: "SHIPPING" },
                        { text: "Delivered", value: "DELIVERED" },
                        { text: "Cancelled", value: "CANCELLED" },
                    ]}
                />
                <Table.Column
                    title="Actions"
                    dataIndex="actions"
                    render={(_, record: IOrder) => (
                        <Space>
                            <EditButton hideText size="small" recordItemId={record.id} />
                            <ShowButton hideText size="small" recordItemId={record.id} />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
};
