import {
    List,
    useTable,
    EditButton,
    ShowButton,
} from "@refinedev/antd";
import { Table, Space, Tag, Typography } from "antd";
import { IOrder, OrderStatus } from "../../interfaces";
import { useLanguage } from "../../contexts/LanguageContext";

const { Text } = Typography;

export const OrderList = () => {
    const { t, language } = useLanguage();
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
        <List title={t.adminOrders.title}>
            <Table {...tableProps} rowKey="id">
                <Table.Column dataIndex="orderId" title={t.adminOrders.orderId} width={150} ellipsis />
                <Table.Column
                    dataIndex="createdAt"
                    title={t.adminOrders.date}
                    render={(value) => new Date(value).toLocaleString(language === 'km' ? 'km-KH' : 'en-US')}
                    sorter
                />
                <Table.Column
                    dataIndex={["shippingAddress", "fullName"]}
                    title={t.adminOrders.customer}
                />
                <Table.Column
                    dataIndex="total"
                    title={t.adminOrders.total}
                    render={(value) => <Text strong>${value?.toFixed(2)}</Text>}
                    sorter
                />
                <Table.Column
                    dataIndex="orderStatus"
                    title={t.adminOrders.status}
                    render={(value: OrderStatus) => (
                        <Tag color={getStatusColor(value)}>{t.order.status[value] || value}</Tag>
                    )}
                    filters={[
                        { text: t.adminOrders.filter.pending, value: "PENDING" },
                        { text: t.adminOrders.filter.processing, value: "PROCESSING" },
                        { text: t.adminOrders.filter.shipping, value: "SHIPPING" },
                        { text: t.adminOrders.filter.delivered, value: "DELIVERED" },
                        { text: t.adminOrders.filter.cancelled, value: "CANCELLED" },
                    ]}
                />
                <Table.Column
                    title={t.adminOrders.actions}
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
