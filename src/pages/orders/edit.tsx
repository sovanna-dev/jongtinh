import { Edit, useForm } from "@refinedev/antd";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { Form, Select, Descriptions, Table, Typography, Card, Divider, Tag, Space } from "antd";
import { IOrder, ICartItem, OrderStatus } from "../../interfaces";
import dayjs from "dayjs";
import { useLanguage } from "../../contexts/LanguageContext";


const { Text, Title } = Typography;

export const OrderEdit = () => {
    const { t, language } = useLanguage();
    const { formProps, saveButtonProps, query: queryResult, onFinish } = useForm<IOrder>();

    // In handleOnFinish:
    const handleOnFinish = async (values: any) => {
        await onFinish({
            ...values,
            updatedAt: Date.now(),
        });

        // 🆕 Send notification to customer about status update
        const orderData = queryResult?.data?.data;
        if (orderData && values.orderStatus !== orderData.orderStatus) {
            await addDoc(collection(db, "notifications"), {
                userId: orderData.userId,
                title: t.admin.orders.notifications.statusUpdated,
                message: getStatusMessage(values.orderStatus, orderData.orderId),
                timestamp: Date.now(),
                type: "order",
                isRead: false,
                destination: "order",
                destinationId: orderData.orderId,
            });
        }
    };

    // Helper function
    const getStatusMessage = (status: string, orderId: string): string => {
        const shortId = orderId?.substring(0, 8)?.toUpperCase() || orderId;
        const statusMap: Record<string, string> = {
            "PROCESSING": t.admin.orders.notifications.processing.replace("{id}", shortId),
            "SHIPPING": t.admin.orders.notifications.shipping.replace("{id}", shortId),
            "DELIVERED": t.admin.orders.notifications.delivered.replace("{id}", shortId),
            "CANCELLED": t.admin.orders.notifications.cancelled.replace("{id}", shortId),
        };

        return statusMap[status] || t.admin.orders.notifications.default.replace("{id}", shortId).replace("{status}", status);
    };

    const orderData = queryResult?.data?.data;

    return (
        <Edit saveButtonProps={saveButtonProps}>
            <Form
                {...formProps}
                layout="vertical"
                onFinish={handleOnFinish}
            >
                <Card title={t.admin.orders.status} style={{ marginBottom: 24 }}>
                    <Form.Item
                        label={t.admin.orders.status}
                        name="orderStatus"
                        rules={[{ required: true }]}
                    >
                        <Select
                            options={[
                                { label: t.order.status.PENDING, value: "PENDING" },
                                { label: t.order.status.PROCESSING, value: "PROCESSING" },
                                { label: t.order.status.SHIPPING, value: "SHIPPING" },
                                { label: t.order.status.DELIVERED, value: "DELIVERED" },
                                { label: t.order.status.CANCELLED, value: "CANCELLED" },
                            ]}
                        />
                    </Form.Item>
                </Card>

                <Card title={t.admin.orders.details} loading={queryResult?.isLoading}>
                    <Descriptions column={2} bordered>
                        <Descriptions.Item label={t.admin.orders.id}>{orderData?.orderId}</Descriptions.Item>
                        <Descriptions.Item label={t.admin.orders.date}>
                            {orderData?.createdAt ? dayjs(orderData.createdAt).locale(language === 'km' ? 'km' : 'en').format("LLL") : "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label={t.admin.orders.customer}>{orderData?.shippingAddress?.fullName}</Descriptions.Item>
                        <Descriptions.Item label={t.admin.orders.phone}>{orderData?.shippingAddress?.phoneNumber}</Descriptions.Item>
                        <Descriptions.Item label={t.admin.orders.address} span={2}>
                            {orderData?.shippingAddress?.streetAddress}, {orderData?.shippingAddress?.city}, {orderData?.shippingAddress?.province} {orderData?.shippingAddress?.postalCode}
                        </Descriptions.Item>
                        <Descriptions.Item label={t.admin.orders.payment}>{orderData?.paymentMethod}</Descriptions.Item>
                        <Descriptions.Item label={t.admin.orders.total}>
                            <Text strong>${orderData?.total?.toFixed(2)}</Text>
                        </Descriptions.Item>
                    </Descriptions>

                    <Divider orientation="left">{t.admin.orders.items}</Divider>
                    <Table
                        dataSource={orderData?.items}
                        pagination={false}
                        rowKey="productId"
                    >
                        <Table.Column
                            dataIndex="productName"
                            title={t.admin.orders.product}
                            render={(text, record: ICartItem) => (
                                <Space>
                                    <img src={record.productImage} alt={text} style={{ width: 40 }} />
                                    <Text>{text}</Text>
                                </Space>
                            )}
                        />
                        <Table.Column dataIndex="price" title={t.admin.orders.price} render={(v) => `$${v.toFixed(2)}`} />
                        <Table.Column dataIndex="quantity" title={t.admin.orders.qty} />
                        <Table.Column
                            title={t.admin.orders.subtotal}
                            render={(_, record: ICartItem) => (
                                <Text strong>${(record.price * record.quantity).toFixed(2)}</Text>
                            )}
                        />
                    </Table>
                </Card>
            </Form>
        </Edit>
    );
};
