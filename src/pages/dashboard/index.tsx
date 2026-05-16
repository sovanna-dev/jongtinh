import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import { Row, Col, Card, Statistic, List, Typography, Skeleton, Progress, Tag } from "antd";
import {
    ShoppingOutlined,
    UserOutlined,
    OrderedListOutlined,
    CustomerServiceOutlined
} from "@ant-design/icons";
import { useList } from "@refinedev/core";
import {
    collection,
    query,
    where,
    getCountFromServer
} from "firebase/firestore";
import { db } from "../../firebase";
import { IOrder, IProduct, IUser, ISupportTicket, ICategory } from "../../interfaces";

const { Title, Text } = Typography;

interface StatusCounts {
    PENDING: number;
    PROCESSING: number;
    SHIPPING: number;
    DELIVERED: number;
    CANCELLED: number;
    total: number;
}

// Fetches accurate per-status counts using Firestore count queries.
// getCountFromServer does NOT read documents — it only returns a count,
// so this is cheap regardless of how many orders exist.
const fetchStatusCounts = async (): Promise<StatusCounts> => {
    const statuses = ["PENDING", "PROCESSING", "SHIPPING", "DELIVERED", "CANCELLED"] as const;
    const colRef = collection(db, "orders");

    const results = await Promise.all(
        statuses.map((status) =>
            getCountFromServer(query(colRef, where("orderStatus", "==", status)))
        )
    );

    const counts = Object.fromEntries(
        statuses.map((status, i) => [status, results[i].data().count])
    ) as Omit<StatusCounts, "total">;

    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

    return { ...counts, total };
};

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

    // Accurate order status distribution via Firestore count queries
    const [statusCounts, setStatusCounts] = useState<StatusCounts | null>(null);
    const [statusLoading, setStatusLoading] = useState(true);

    useEffect(() => {
        setStatusLoading(true);
        fetchStatusCounts()
            .then(setStatusCounts)
            .finally(() => setStatusLoading(false));
    }, []);

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

    const pct = (n: number) =>
        statusCounts?.total ? Math.round((n / statusCounts.total) * 100) : 0;

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
                                    actions={[<Text key="total" strong>${item.total?.toFixed(2) ?? "—"}</Text>]}
                                >
                                    <List.Item.Meta
                                        title={`Order #${item.orderId?.substring(0, 8) ?? item.id?.substring(0, 8) ?? "—"}`}
                                        description={`${item.shippingAddress?.fullName ?? "Unknown"} - ${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}`}
                                    />
                                    <Text type="secondary">{item.orderStatus}</Text>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card title="Order Status Distribution" bordered={false} style={{ marginBottom: "16px" }}>
                        <Skeleton loading={statusLoading} active paragraph={{ rows: 3 }}>
                            <div style={{ padding: "8px 0" }}>
                                <Text>Pending</Text>
                                <Progress
                                    percent={pct(statusCounts?.PENDING ?? 0)}
                                    status="active"
                                    strokeColor="#faad14"
                                />
                                <Text>Processing / Shipping</Text>
                                <Progress
                                    percent={pct((statusCounts?.PROCESSING ?? 0) + (statusCounts?.SHIPPING ?? 0))}
                                    status="active"
                                    strokeColor="#1890ff"
                                />
                                <Text>Delivered</Text>
                                <Progress
                                    percent={pct(statusCounts?.DELIVERED ?? 0)}
                                    status="active"
                                    strokeColor="#52c41a"
                                />
                            </div>
                        </Skeleton>
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
                                    <Link to={item.link}>{item.title}</Link>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};