import React from "react";
import { useList } from "@refinedev/core";
import { Row, Col, Card, Table, Tag, Typography, List, Skeleton, Space } from "antd";
import {
    ShoppingOutlined,
    OrderedListOutlined,
    ClockCircleOutlined,
    FallOutlined,
    DollarOutlined,
} from "@ant-design/icons";
import {
    BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from "recharts";
import { IOrder, IProduct } from "../../interfaces";
import { useLanguage } from "../../contexts/LanguageContext";

const { Title, Text } = Typography;

const COLORS = ["#FF006E", "#8338EC", "#3A86FF", "#FFBE0B", "#FB5607"];

const STATUS_COLORS: Record<string, string> = {
    PENDING: "#FFBE0B",
    PROCESSING: "#3A86FF",
    SHIPPING: "#8338EC",
    DELIVERED: "#4CAF50",
    CANCELLED: "#E53935",
};

export const ViewerDashboard: React.FC = () => {
    const { t, language } = useLanguage();
    // Fetch all orders
    const { query: ordersQuery } = useList<IOrder>({
        resource: "orders",
        pagination: { pageSize: 100 },
        sorters: [{ field: "createdAt", order: "desc" }],
    });

    // Fetch all products
    const { query: productsQuery } = useList<IProduct>({
        resource: "products",
        pagination: { pageSize: 100 },
    });

    const ordersLoading = ordersQuery.isLoading;
    const productsLoading = productsQuery.isLoading;

    const orders = ordersQuery.data?.data || [];
    const products = productsQuery.data?.data || [];

    // Calculate stats
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
            (o: IOrder) => new Date(o.createdAt).toISOString().split("T")[0] === date && o.orderStatus !== "CANCELLED"
        );
        return {
            date: new Date(date).toLocaleDateString(language === 'km' ? 'km-KH' : 'en-US', { month: "short", day: "numeric" }),
            revenue: dayOrders.reduce((sum: number, o: IOrder) => sum + o.total, 0),
            orders: dayOrders.length,
        };
    });

    // Order status distribution
    const statusData = ["PENDING", "PROCESSING", "SHIPPING", "DELIVERED", "CANCELLED"].map(
        (status) => ({
            name: t.order.status[status as keyof typeof t.order.status] || status,
            value: orders.filter((o: IOrder) => o.orderStatus === status).length,
            color: STATUS_COLORS[status],
        })
    ).filter((s) => s.value > 0);

    // Top products by order count
    const productSales: Record<string, { name: string; count: number; revenue: number }> = {};
    orders.forEach((order: IOrder) => {
        order.items?.forEach((item: any) => {
            if (!productSales[item.productId]) {
                productSales[item.productId] = {
                    name: item.productName,
                    count: 0,
                    revenue: 0,
                };
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
                    📊 {t.analytics.title}
                </Title>
                <Text type="secondary">{t.admin.dashboard.subtitle}</Text>
            </div>

            {/* Stats Cards */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} hoverable style={{ borderRadius: 16 }}>
                        <Skeleton loading={ordersLoading} active paragraph={{ rows: 1 }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <Text type="secondary">{t.admin.dashboard.revenue}</Text>
                                <Title level={3} style={{ margin: '4px 0', color: '#4CAF50' }}>
                                    ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Title>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    <DollarOutlined /> {t.admin.dashboard.thisMonth}
                                </Text>
                            </div>
                        </Skeleton>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} hoverable style={{ borderRadius: 16 }}>
                        <Skeleton loading={ordersLoading} active paragraph={{ rows: 1 }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <Text type="secondary">{t.admin.dashboard.orders}</Text>
                                <Title level={3} style={{ margin: '4px 0', color: '#3A86FF' }}>
                                    {totalOrders.toLocaleString()}
                                </Title>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    <OrderedListOutlined /> {t.adminOrders.title}
                                </Text>
                            </div>
                        </Skeleton>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} hoverable style={{ borderRadius: 16 }}>
                        <Skeleton loading={ordersLoading} active paragraph={{ rows: 1 }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <Text type="secondary">{t.admin.dashboard.pending}</Text>
                                <Title level={3} style={{ margin: '4px 0', color: '#FFBE0B' }}>
                                    {pendingOrders.toLocaleString()}
                                </Title>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    <ClockCircleOutlined /> {t.admin.dashboard.needsAttention}
                                </Text>
                            </div>
                        </Skeleton>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} hoverable style={{ borderRadius: 16 }}>
                        <Skeleton loading={productsLoading} active paragraph={{ rows: 1 }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <Text type="secondary">{t.admin.dashboard.products}</Text>
                                <Title level={3} style={{ margin: '4px 0', color: '#FF006E' }}>
                                    {activeProducts.toLocaleString()}
                                </Title>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    <ShoppingOutlined /> {t.admin.dashboard.inCatalog}
                                </Text>
                            </div>
                        </Skeleton>
                    </Card>
                </Col>
            </Row>

            {/* Charts Row */}
            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                {/* Revenue Chart */}
                <Col xs={24} lg={16}>
                    <Card title={<Space><DollarOutlined /> {t.admin.dashboard.revenueTrend}</Space>} bordered={false} style={{ borderRadius: 16 }}>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                                <Tooltip
                                    cursor={{ fill: '#f5f5f5' }}
                                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, t.admin.dashboard.revenue]}
                                />
                                <Bar dataKey="revenue" fill="#FF006E" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>

                {/* Order Status Pie */}
                <Col xs={24} lg={8}>
                    <Card title={<Space><OrderedListOutlined /> {t.admin.dashboard.orderStatus}</Space>} bordered={false} style={{ borderRadius: 16 }}>
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
                                    stroke="none"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Legend verticalAlign="bottom" iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
            </Row>

            {/* Bottom Row */}
            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                {/* Top Products */}
                <Col xs={24} lg={12}>
                    <Card title={<Space><ShoppingOutlined /> {t.admin.dashboard.topProducts}</Space>} bordered={false} style={{ borderRadius: 16 }}>
                        <List
                            dataSource={topProducts}
                            locale={{ emptyText: t.home.noProducts }}
                            renderItem={(item: any, index: number) => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={
                                            <Tag color={COLORS[index % COLORS.length]} style={{ width: 32, textAlign: "center", borderRadius: 4 }}>
                                                #{index + 1}
                                            </Tag>
                                        }
                                        title={item.name}
                                        description={`${item.count} ${t.admin.orders.items.toLowerCase()}`}
                                    />
                                    <Text strong color="#FF006E">${item.revenue.toFixed(2)}</Text>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>

                {/* Low Stock Alert */}
                <Col xs={24} lg={12}>
                    <Card
                        title={<Space><ClockCircleOutlined /> {t.admin.dashboard.needsAttention}</Space>}
                        bordered={false}
                        style={{ borderRadius: 16 }}
                        extra={<Tag color="volcano">{lowStockProducts.length}</Tag>}
                    >
                        <List
                            dataSource={lowStockProducts}
                            locale={{ emptyText: "✅" }}
                            renderItem={(item: any) => (
                                <List.Item>
                                    <List.Item.Meta
                                        title={item.name}
                                        description={
                                            <Space>
                                                <FallOutlined style={{ color: "#E53935" }} />
                                                <Text type="danger">{t.product.inStockCount.replace('{count}', item.stockQuantity)}</Text>
                                            </Space>
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
                    <Card title={<Space><OrderedListOutlined /> {t.admin.dashboard.recentOrders}</Space>} bordered={false} style={{ borderRadius: 16 }}>
                        <Table
                            dataSource={orders.slice(0, 10)}
                            rowKey="orderId"
                            pagination={false}
                            loading={ordersLoading}
                            size="middle"
                        >
                            <Table.Column
                                dataIndex="orderId"
                                title={t.admin.orders.id}
                                render={(value: string) => <Text code>{value?.substring(0, 8)?.toUpperCase()}</Text>}
                            />
                            <Table.Column
                                dataIndex={["shippingAddress", "fullName"]}
                                title={t.admin.orders.customer}
                            />
                            <Table.Column
                                dataIndex="total"
                                title={t.admin.orders.total}
                                render={(value: number) => (
                                    <Text strong style={{ color: '#FF006E' }}>${value?.toFixed(2)}</Text>
                                )}
                            />
                            <Table.Column
                                dataIndex="orderStatus"
                                title={t.admin.orders.status}
                                render={(value: string) => (
                                    <Tag color={STATUS_COLORS[value]} style={{ borderRadius: 8 }}>
                                        {t.order.status[value as keyof typeof t.order.status] || value}
                                    </Tag>
                                )}
                            />
                            <Table.Column
                                dataIndex="createdAt"
                                title={t.admin.orders.date}
                                render={(value: number) =>
                                    new Date(value).toLocaleDateString(language === 'km' ? 'km-KH' : 'en-US', {
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
