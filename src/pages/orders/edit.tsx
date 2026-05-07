import { Edit, useForm } from "@refinedev/antd";
import { Form, Select, Descriptions, Table, Typography, Card, Divider, Tag, Space } from "antd";
import { IOrder, ICartItem, OrderStatus } from "../../interfaces";
import dayjs from "dayjs";

const { Text, Title } = Typography;

export const OrderEdit = () => {
    const { formProps, saveButtonProps, query: queryResult, onFinish } = useForm<IOrder>();

    const handleOnFinish = (values: any) => {
        onFinish({
            ...values,
            updatedAt: Date.now(),
        });
    };

    const orderData = queryResult?.data?.data;

    return (
        <Edit saveButtonProps={saveButtonProps}>
            <Form
                {...formProps}
                layout="vertical"
                onFinish={handleOnFinish}
            >
                <Card title="Order Status" style={{ marginBottom: 24 }}>
                    <Form.Item
                        label="Status"
                        name="orderStatus"
                        rules={[{ required: true }]}
                    >
                        <Select
                            options={[
                                { label: "Pending", value: "PENDING" },
                                { label: "Processing", value: "PROCESSING" },
                                { label: "Shipping", value: "SHIPPING" },
                                { label: "Delivered", value: "DELIVERED" },
                                { label: "Cancelled", value: "CANCELLED" },
                            ]}
                        />
                    </Form.Item>
                </Card>

                <Card title="Order Details" loading={queryResult?.isLoading}>
                    <Descriptions column={2} bordered>
                        <Descriptions.Item label="Order ID">{orderData?.orderId}</Descriptions.Item>
                        <Descriptions.Item label="Date">
                            {orderData?.createdAt ? dayjs(orderData.createdAt).format("LLL") : "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Customer">{orderData?.shippingAddress?.fullName}</Descriptions.Item>
                        <Descriptions.Item label="Phone">{orderData?.shippingAddress?.phoneNumber}</Descriptions.Item>
                        <Descriptions.Item label="Address" span={2}>
                            {orderData?.shippingAddress?.streetAddress}, {orderData?.shippingAddress?.city}, {orderData?.shippingAddress?.province} {orderData?.shippingAddress?.postalCode}
                        </Descriptions.Item>
                        <Descriptions.Item label="Payment Method">{orderData?.paymentMethod}</Descriptions.Item>
                        <Descriptions.Item label="Total Amount">
                            <Text strong>${orderData?.total?.toFixed(2)}</Text>
                        </Descriptions.Item>
                    </Descriptions>

                    <Divider orientation="left">Items</Divider>
                    <Table
                        dataSource={orderData?.items}
                        pagination={false}
                        rowKey="productId"
                    >
                        <Table.Column
                            dataIndex="productName"
                            title="Product"
                            render={(text, record: ICartItem) => (
                                <Space>
                                    <img src={record.productImage} alt={text} style={{ width: 40 }} />
                                    <Text>{text}</Text>
                                </Space>
                            )}
                        />
                        <Table.Column dataIndex="price" title="Price" render={(v) => `$${v.toFixed(2)}`} />
                        <Table.Column dataIndex="quantity" title="Qty" />
                        <Table.Column
                            title="Total"
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
