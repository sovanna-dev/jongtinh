import React from "react";
import { useApiUrl, useCustom } from "@refinedev/core";
import { Row, Col, Card, Statistic, List, Avatar, Typography, Skeleton, Progress, Tag } from "antd";
import {
    ShoppingOutlined,
    UserOutlined,
    OrderedListOutlined,
    CustomerServiceOutlined
} from "@ant-design/icons";
import { useList } from "@refinedev/core";
import { IOrder, IProduct, IUser, ISupportTicket, ICategory } from "../../interfaces";

const { Title, Text } = Typography;

export const DashboardPage: React.FC = () => {
    const { query: ordersQuery } = useList<IOrder>({
        resource: "orders",
        pagination: { pageSize: 5 },
        sorters: [{ field: "createdAt", order: "desc" }]
    });
    const ordersData = ordersQuery.data;
    const ordersLoading = ordersQuery.isLoading;

    const { query: productsQuery } = useList<IProduct>({
        resource: "products",
        pagination: { pageSize: 1 }
    });
    const productsData = productsQuery.data;
    const productsLoading = productsQuery.isLoading;

    const { query: usersQuery } = useList<IUser>({
        resource: "users",
        pagination: { pageSize: 1 }
    });
    const usersData = usersQuery.data;
    const usersLoading = usersQuery.isLoading;

    const { query: ticketsQuery } = useList<ISupportTicket>({
        resource: "support_tickets",
        filters: [{ field: "status", operator: "eq", value: "OPEN" }],
        pagination: { pageSize: 1 }
    });
    const ticketsData = ticketsQuery.data;
    const ticketsLoading = ticketsQuery.isLoading;

    // Fetch orders for status breakdown
    const { query: allOrdersQuery } = useList<IOrder>({
        resource: "orders",
        pagination: { pageSize: 100 }, // Fetch recent to approximate distribution
    });
    const allOrders = allOrdersQuery.data?.data || [];
    const statusCounts = allOrders.reduce((acc: any, order) => {
        acc[order.orderStatus] = (acc[order.orderStatus] || 0) + 1;
        return acc;
    }, {});

    // Fetch categories
    const { query: categoriesQuery } = useList<ICategory>({
        resource: "categories",
        pagination: { pageSize: 10 },
    });
    const categoriesData = categoriesQuery.data?.data || [];

    const stats = [
        {
            title: "Total Orders",
            value: ordersData?.total ?? 0,
            icon: <OrderedListOutlined style={{ color: "#3f8600" }} />,
            loading: ordersLoading,
        },
        {
            title: "Active Products",
            value: productsData?.total ?? 0,
            icon: <ShoppingOutlined style={{ color: "#cf1322" }} />,
            loading: productsLoading,
        },
        {
            title: "Total Users",
            value: usersData?.total ?? 0,
            icon: <UserOutlined style={{ color: "#1890ff" }} />,
            loading: usersLoading,
        },
        {
            title: "Open Tickets",
            value: ticketsData?.total ?? 0,
            icon: <CustomerServiceOutlined style={{ color: "#faad14" }} />,
            loading: ticketsLoading,
        },
    ];

    return (
        <div style={{ padding: "24px" }}>
            <Title level={2}>Dashboard Overview</Title>

            <Row gutter={[16, 16]}>
                {stats.map((stat, index) => (
                    <Col xs={24} sm={12} lg={6} key={index}>
                        <Card bordered={false}>
                            <Skeleton loading={stat.loading} active avatar>
                                <Statistic
                                    title={stat.title}
                                    value={stat.value}
                                    prefix={stat.icon}
                                />
                            </Skeleton>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: "32px" }}>
                <Col xs={24} lg={16}>
                    <Card title="Recent Orders" bordered={false}>
                        <List
                            loading={ordersLoading}
                            dataSource={ordersData?.data}
                            renderItem={(item: IOrder) => (
                                <List.Item
                                    actions={[<Text key="total" strong>${item.total.toFixed(2)}</Text>]}
                                >
                                    <List.Item.Meta
                                        title={`Order #${item.orderId.substring(0, 8)}`}
                                        description={`${item.shippingAddress.fullName} - ${new Date(item.createdAt).toLocaleDateString()}`}
                                    />
                                    <Text type="secondary">{item.orderStatus}</Text>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card title="Order Status Distribution" bordered={false} style={{ marginBottom: "16px" }}>
                        <div style={{ padding: "8px 0" }}>
                            <Text>Pending</Text>
                            <Progress percent={Math.round((statusCounts["PENDING"] || 0) / (allOrders.length || 1) * 100)} status="active" strokeColor="#faad14" />
                            <Text>Processing/Shipping</Text>
                            <Progress percent={Math.round(((statusCounts["PROCESSING"] || 0) + (statusCounts["SHIPPING"] || 0)) / (allOrders.length || 1) * 100)} status="active" strokeColor="#1890ff" />
                            <Text>Delivered</Text>
                            <Progress percent={Math.round((statusCounts["DELIVERED"] || 0) / (allOrders.length || 1) * 100)} status="active" strokeColor="#52c41a" />
                        </div>
                    </Card>
                    <Card title="Categories" bordered={false} style={{ marginBottom: "16px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                            {categoriesData.map((cat) => (
                                <Tag key={cat.id} color="blue">{cat.name}</Tag>
                            ))}
                        </div>
                    </Card>
                    <Card title="Quick Actions" bordered={false}>
                        <List
                            size="small"
                            dataSource={[
                                { title: "Add New Product", link: "/products/create" },
                                { title: "Manage Categories", link: "/categories" },
                                { title: "View Support Tickets", link: "/support-tickets" },
                                { title: "Send Notification", link: "/notifications/create" },
                                { title: "Update Banners", link: "/promotion-banners" },
                            ]}
                            renderItem={(item) => (
                                <List.Item>
                                    <a href={item.link}>{item.title}</a>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};
