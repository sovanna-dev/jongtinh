import React from "react";
import { useGetIdentity, useList } from "@refinedev/core";
import { Row, Col, Card, Statistic, List, Avatar, Typography, Skeleton, Progress, Tag, Space, Table, Spin } from "antd";
import {
    ShoppingOutlined,
    UserOutlined,
    OrderedListOutlined,
    CustomerServiceOutlined,
} from "@ant-design/icons";
import {
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { IOrder, IProduct, IUser, ISupportTicket, ICategory } from "../../interfaces";

const { Title, Text } = Typography;

const COLORS = ["#FF006E", "#8338EC", "#3A86FF", "#FFBE0B", "#FB5607"];

const STATUS_COLORS: Record<string, string> = {
    PENDING: "#FFBE0B",
    PROCESSING: "#3A86FF",
    SHIPPING: "#8338EC",
    DELIVERED: "#4CAF50",
    CANCELLED: "#E53935",
};

// ============================================================
// VIEWER DASHBOARD (Read-only, e-commerce style)
// ============================================================

const ViewerDashboard: React.FC = () => {
    const { query: ordersQuery } = useList<IOrder>({
        resource: "orders",
        pagination: { pageSize: 100 },
        sorters: [{ field: "createdAt", order: "desc" }],
    });

    const { query: productsQuery } = useList<IProduct>({
        resource: "products",
        pagination: { pageSize: 100 },
    });

    const ordersLoading = ordersQuery.isLoading;
    const productsLoading = productsQuery.isLoading;

    const orders = ordersQuery.data?.data || [];
    const products = productsQuery.data?.data || [];

    const totalRevenue = orders
        .filter((o: IOrder) => o.orderStatus !== "CANCELLED")
        .reduce((sum: number, o: IOrder) => sum + o.total, 0);

    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o: IOrder) => o.orderStatus === "PENDING").length;
    const activeProducts = products.filter((p: IProduct) => p.isAvailable && p.stockQuantity > 0).length;

    // Revenue data for chart (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split("T")[0];
    });

    const revenueData = last7Days.map((date) => {
        const dayOrders = orders.filter(
            (o: IOrder) =>
                new Date(o.createdAt).toISOString().split("T")[0] === date &&
                o.orderStatus !== "CANCELLED"
        );
        return {
            date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            revenue: dayOrders.reduce((sum: number, o: IOrder) => sum + o.total, 0),
            orders: dayOrders.length,
        };
    });

    // Order status distribution
    const statusData = ["PENDING", "PROCESSING", "SHIPPING", "DELIVERED", "CANCELLED"]
        .map((status) => ({
            name: status,
            value: orders.filter((o: IOrder) => o.orderStatus === status).length,
            color: STATUS_COLORS[status],
        }))
        .filter((s) => s.value > 0);

    // Top products by order count
    const productSales: Record<string, { name: string; count: number; revenue: number }> = {};
    orders.forEach((order: IOrder) => {
        order.items?.forEach((item: any) => {
            if (!productSales[item.productId]) {
                productSales[item.productId] = { name: item.productName, count: 0, revenue: 0 };
            }
            productSales[item.productId].count += item.quantity;
            productSales[item.productId].revenue += item.price * item.quantity;
        });
    });

    const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    // Low stock products
    const lowStockProducts = products
        .filter((p: IProduct) => p.isAvailable && p.stockQuantity > 0 && p.stockQuantity <= 10)
        .sort((a, b) => a.stockQuantity - b.stockQuantity)
        .slice(0, 5);

    return (
        <div style={{ padding: "24px" }}>
            <div style={{ marginBottom: 24 }}>
                <Title level={3} style={{ margin: 0 }}>
                    📊 Sales Overview
                </Title>
                <Text type="secondary">Real-time e-commerce analytics dashboard</Text>
            </div>

            {/* Stats Cards */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false}>
                        <Skeleton loading={ordersLoading} active>
                            <Statistic
                                title="Total Revenue"
                                value={totalRevenue}
                                precision={2}
                                prefix="$"
                                valueStyle={{ color: "#4CAF50" }}
                            />
                        </Skeleton>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false}>
                        <Skeleton loading={ordersLoading} active>
                            <Statistic
                                title="Total Orders"
                                value={totalOrders}
                                prefix={<OrderedListOutlined />}
                                valueStyle={{ color: "#3A86FF" }}
                            />
                        </Skeleton>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false}>
                        <Skeleton loading={ordersLoading} active>
                            <Statistic
                                title="Pending Orders"
                                value={pendingOrders}
                                prefix={<ClockCircleFilled />}
                                valueStyle={{ color: "#FFBE0B" }}
                            />
                        </Skeleton>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false}>
                        <Skeleton loading={productsLoading} active>
                            <Statistic
                                title="Active Products"
                                value={activeProducts}
                                prefix={<ShoppingOutlined />}
                                valueStyle={{ color: "#FF006E" }}
                            />
                        </Skeleton>
                    </Card>
                </Col>
            </Row>

            {/* Charts Row */}
            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24} lg={16}>
                    <Card title="💰 Revenue (Last 7 Days)" bordered={false}>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Revenue"]} />
                                <Bar dataKey="revenue" fill="#FF006E" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card title="📦 Order Status" bordered={false}>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
            </Row>

            {/* Bottom Row */}
            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24} lg={12}>
                    <Card title="🏆 Top Selling Products" bordered={false}>
                        <List
                            dataSource={topProducts}
                            locale={{ emptyText: "No sales data yet" }}
                            renderItem={(item, index) => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={
                                            <Tag color={COLORS[index]} style={{ width: 32, textAlign: "center" }}>
                                                #{index + 1}
                                            </Tag>
                                        }
                                        title={item.name}
                                        description={`${item.count} units sold`}
                                    />
                                    <Text strong>${item.revenue.toFixed(2)}</Text>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>

                <Col xs={24} lg={12}>
                    <Card
                        title="⚠️ Low Stock Alert"
                        bordered={false}
                        extra={<Tag color="volcano">{lowStockProducts.length} products</Tag>}
                    >
                        <List
                            dataSource={lowStockProducts}
                            locale={{ emptyText: "All products well stocked ✅" }}
                            renderItem={(item: any) => (
                                <List.Item>
                                    <List.Item.Meta
                                        title={item.name}
                                        description={
                                            <Text type="danger">Only {item.stockQuantity} left in stock</Text>
                                        }
                                    />
                                    <Text strong>${item.price?.toFixed(2)}</Text>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Recent Orders Table */}
            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col span={24}>
                    <Card title="📋 Recent Orders" bordered={false}>
                        <Table
                            dataSource={orders.slice(0, 10)}
                            rowKey="orderId"
                            pagination={false}
                            loading={ordersLoading}
                            size="small"
                        >
                            <Table.Column
                                dataIndex="orderId"
                                title="Order ID"
                                render={(value: string) => value?.substring(0, 8)?.toUpperCase()}
                            />
                            <Table.Column
                                dataIndex={["shippingAddress", "fullName"]}
                                title="Customer"
                            />
                            <Table.Column
                                dataIndex="total"
                                title="Amount"
                                render={(value: number) => <Text strong>${value?.toFixed(2)}</Text>}
                            />
                            <Table.Column
                                dataIndex="orderStatus"
                                title="Status"
                                render={(value: string) => <Tag color={STATUS_COLORS[value]}>{value}</Tag>}
                            />
                            <Table.Column
                                dataIndex="createdAt"
                                title="Date"
                                render={(value: number) =>
                                    new Date(value).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })
                                }
                            />
                        </Table>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

// ============================================================
// CLOCK ICON (missing from ant-design/icons)
// ============================================================
const ClockCircleFilled: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
    <span role="img" aria-label="clock" style={style}>
        🕐
    </span>
);

// ============================================================
// FULL ADMIN DASHBOARD (Original - for Super Admin & other roles)
// ============================================================

const FullAdminDashboard: React.FC = () => {
    const { query: ordersQuery } = useList<IOrder>({
        resource: "orders",
        pagination: { pageSize: 5 },
        sorters: [{ field: "createdAt", order: "desc" }],
    });

    const { query: productsQuery } = useList<IProduct>({
        resource: "products",
        pagination: { pageSize: 1 },
    });

    const { query: usersQuery } = useList<IUser>({
        resource: "users",
        pagination: { pageSize: 1 },
    });

    const { query: ticketsQuery } = useList<ISupportTicket>({
        resource: "support_tickets",
        filters: [{ field: "status", operator: "eq", value: "OPEN" }],
        pagination: { pageSize: 1 },
    });

    const { query: allOrdersQuery } = useList<IOrder>({
        resource: "orders",
        pagination: { pageSize: 100 },
    });

    const ordersLoading = ordersQuery.isLoading;
    const productsLoading = productsQuery.isLoading;
    const usersLoading = usersQuery.isLoading;
    const ticketsLoading = ticketsQuery.isLoading;

    const allOrders = allOrdersQuery.data?.data || [];
    const statusCounts = allOrders.reduce((acc: any, order: IOrder) => {
        acc[order.orderStatus] = (acc[order.orderStatus] || 0) + 1;
        return acc;
    }, {});

    const { query: categoriesQuery } = useList<ICategory>({
        resource: "categories",
        pagination: { pageSize: 10 },
    });
    const categoriesData = categoriesQuery.data?.data || [];

    const stats = [
        {
            title: "Total Orders",
            value: ordersQuery.data?.total ?? 0,
            icon: <OrderedListOutlined style={{ color: "#3f8600" }} />,
            loading: ordersLoading,
        },
        {
            title: "Active Products",
            value: productsQuery.data?.total ?? 0,
            icon: <ShoppingOutlined style={{ color: "#cf1322" }} />,
            loading: productsLoading,
        },
        {
            title: "Total Users",
            value: usersQuery.data?.total ?? 0,
            icon: <UserOutlined style={{ color: "#1890ff" }} />,
            loading: usersLoading,
        },
        {
            title: "Open Tickets",
            value: ticketsQuery.data?.total ?? 0,
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
                                <Statistic title={stat.title} value={stat.value} prefix={stat.icon} />
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
                            dataSource={ordersQuery.data?.data}
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
                            {categoriesData.map((cat: ICategory) => (
                                <Tag key={cat.id} color="blue">{cat.name}</Tag>
                            ))}
                        </div>
                    </Card>
                    <Card title="Quick Actions" bordered={false}>
                        <List
                            size="small"
                            dataSource={[
                                { title: "Add New Product", link: "/#/products/create" },
                                { title: "Manage Categories", link: "/#/categories" },
                                { title: "View Support Tickets", link: "/#/support-tickets" },
                                { title: "Send Notification", link: "/#/notifications/create" },
                                { title: "Update Banners", link: "/#/promotion-banners" },
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

// ============================================================
// MAIN DASHBOARD PAGE (Role-based routing)
// ============================================================

export const DashboardPage: React.FC = () => {
    const { data: identity, isLoading } = useGetIdentity<{ role?: string }>();

    if (isLoading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <Spin size="large" />
            </div>
        );
    }

    // Viewer role → show read-only e-commerce dashboard
    if (identity?.role === "viewer") {
        return <ViewerDashboard />;
    }

    // All other admin roles → show full admin dashboard
    return <FullAdminDashboard />;
};

export default DashboardPage;