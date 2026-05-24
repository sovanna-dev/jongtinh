import React from "react";
import { useGetIdentity, useList } from "@refinedev/core";
import { Row, Col, Card, Statistic, List, Typography, Skeleton, Tag, Space, Table, Spin, Avatar, Badge, Tooltip } from "antd";
import {
    ShoppingOutlined, UserOutlined, OrderedListOutlined, CustomerServiceOutlined,
    DollarOutlined, RiseOutlined, FallOutlined, ArrowUpOutlined, ArrowDownOutlined,
    PlusOutlined, EditOutlined, SendOutlined, PictureOutlined, AppstoreOutlined,
    ClockCircleOutlined, CheckCircleOutlined, SyncOutlined, CloseCircleOutlined,
    ThunderboltOutlined,
} from "@ant-design/icons";
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, Legend,
} from "recharts";
import { IOrder, IProduct, IUser, ISupportTicket, ICategory } from "../../interfaces";

const { Title, Text } = Typography;

// Color Constants
const COLORS = {
    primary: "#FF006E",
    purple: "#8338EC",
    blue: "#3A86FF",
    yellow: "#FFBE0B",
    orange: "#FB5607",
    green: "#4CAF50",
    red: "#E53935",
    teal: "#00B4D8",
};

const STATUS_COLORS: Record<string, string> = {
    PENDING: COLORS.yellow,
    PROCESSING: COLORS.blue,
    SHIPPING: COLORS.purple,
    DELIVERED: COLORS.green,
    CANCELLED: COLORS.red,
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
    PENDING: <ClockCircleOutlined />,
    PROCESSING: <SyncOutlined spin />,
    SHIPPING: <SendOutlined />,
    DELIVERED: <CheckCircleOutlined />,
    CANCELLED: <CloseCircleOutlined />,
};

const PIE_COLORS = [COLORS.primary, COLORS.blue, COLORS.purple, COLORS.green, COLORS.red];

// ============================================================
// MODERN PRO DASHBOARD
// ============================================================

const ModernDashboard: React.FC = () => {
    const { data: identity } = useGetIdentity<{ name: string; role?: string }>();

    // --- Data Fetching ---
    const { query: ordersQuery } = useList<IOrder>({
        resource: "orders",
        pagination: { pageSize: 10 },
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
        pagination: { pageSize: 200 },
        sorters: [{ field: "createdAt", order: "desc" }],
    });

    const { query: categoriesQuery } = useList<ICategory>({
        resource: "categories",
        pagination: { pageSize: 20 },
    });

    // --- Derived Data ---
    const orders = ordersQuery.data?.data || [];
    const allOrders = allOrdersQuery.data?.data || [];
    const categories = categoriesQuery.data?.data || [];
    const isLoading = ordersQuery.isLoading;

    // Revenue
    const totalRevenue = allOrders
        .filter(o => o.orderStatus !== "CANCELLED")
        .reduce((sum, o) => sum + (o.total || 0), 0);

    const thisMonthRevenue = allOrders
        .filter(o => {
            const d = new Date(o.createdAt);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && o.orderStatus !== "CANCELLED";
        })
        .reduce((sum, o) => sum + (o.total || 0), 0);

    // Status counts
    const statusCounts = allOrders.reduce((acc: Record<string, number>, order: IOrder) => {
        acc[order.orderStatus] = (acc[order.orderStatus] || 0) + 1;
        return acc;
    }, {});

    const statusData = Object.entries(statusCounts).map(([name, value]) => ({
        name: name.charAt(0) + name.slice(1).toLowerCase(),
        value,
    }));

    // Revenue trend (last 14 days)
    const last14Days = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        return d;
    });

    const revenueTrend = last14Days.map(date => {
        const dayStr = date.toISOString().split("T")[0];
        const dayOrders = allOrders.filter(
            o => new Date(o.createdAt).toISOString().split("T")[0] === dayStr && o.orderStatus !== "CANCELLED"
        );
        return {
            date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            revenue: dayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
            orders: dayOrders.length,
        };
    });

    // Top products
    const productSales: Record<string, { name: string; units: number; revenue: number }> = {};
    allOrders.forEach(order => {
        order.items?.forEach(item => {
            if (!productSales[item.productId]) {
                productSales[item.productId] = { name: item.productName, units: 0, revenue: 0 };
            }
            productSales[item.productId].units += item.quantity || 0;
            productSales[item.productId].revenue += (item.price || 0) * (item.quantity || 0);
        });
    });

    const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 6);

    // --- KPI Cards ---
    const kpiCards = [
        {
            title: "Total Revenue",
            value: totalRevenue,
            prefix: "$",
            icon: <DollarOutlined />,
            color: COLORS.green,
            bgColor: "#F0FFF4",
            subText: `This month: $${thisMonthRevenue.toFixed(0)}`,
        },
        {
            title: "Total Orders",
            value: ordersQuery.data?.total ?? 0,
            prefix: "",
            icon: <OrderedListOutlined />,
            color: COLORS.blue,
            bgColor: "#F0F5FF",
            subText: `${statusCounts["PENDING"] || 0} pending`,
        },
        {
            title: "Active Products",
            value: productsQuery.data?.total ?? 0,
            prefix: "",
            icon: <ShoppingOutlined />,
            color: COLORS.primary,
            bgColor: "#FFF0F6",
            subText: "In catalog",
        },
        {
            title: "Open Tickets",
            value: ticketsQuery.data?.total ?? 0,
            prefix: "",
            icon: <CustomerServiceOutlined />,
            color: COLORS.yellow,
            bgColor: "#FFFBE6",
            subText: "Needs attention",
        },
    ];

    // Quick Actions
    const quickActions = [
        { title: "Add Product", icon: <PlusOutlined />, link: "/#/admin/products/create", color: COLORS.primary },
        { title: "Manage Orders", icon: <EditOutlined />, link: "/#/admin/orders", color: COLORS.blue },
        { title: "Send Notification", icon: <SendOutlined />, link: "/#/admin/notifications/create", color: COLORS.purple },
        { title: "Update Banners", icon: <PictureOutlined />, link: "/#/admin/promotion-banners", color: COLORS.orange },
        { title: "Categories", icon: <AppstoreOutlined />, link: "/#/admin/categories", color: COLORS.teal },
    ];

    // --- JSX ---
    return (
        <div style={{ padding: "28px 32px", maxWidth: 1500, margin: "0 auto" }}>
            {/* Header */}
            <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                marginBottom: 32, flexWrap: "wrap", gap: 16,
            }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 800, fontSize: 28 }}>
                        👋 Good {getGreeting()}, {identity?.name || "Admin"}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 15 }}>
                        Here's what's happening with your store today.
                    </Text>
                </div>
                <div style={{ textAlign: "right" }}>
                    <Text strong style={{ fontSize: 16, display: "block" }}>
                        {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </Text>
                    <Text type="secondary">
                        {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                </div>
            </div>

            {/* KPI Cards */}
            <Row gutter={[20, 20]}>
                {kpiCards.map((kpi, i) => (
                    <Col xs={24} sm={12} lg={6} key={i}>
                        <Card
                            hoverable
                            style={{
                                borderRadius: 20,
                                border: "none",
                                boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                                height: "100%",
                                transition: "all 0.3s ease",
                            }}
                            bodyStyle={{ padding: 24 }}
                        >
                            <Skeleton loading={isLoading} active paragraph={{ rows: 2 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                                            {kpi.title}
                                        </Text>
                                        <div style={{ marginTop: 8, marginBottom: 4 }}>
                                            <Text strong style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>
                                                {kpi.prefix}{typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}
                                            </Text>
                                        </div>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            {kpi.subText}
                                        </Text>
                                    </div>
                                    <div style={{
                                        width: 52, height: 52, borderRadius: 16,
                                        background: kpi.bgColor,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 24, color: kpi.color,
                                    }}>
                                        {kpi.icon}
                                    </div>
                                </div>
                            </Skeleton>
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Charts Row */}
            <Row gutter={[20, 20]} style={{ marginTop: 24 }}>
                {/* Revenue Area Chart */}
                <Col xs={24} lg={16}>
                    <Card
                        title={
                            <Space>
                                <DollarOutlined style={{ color: COLORS.green }} />
                                <Text strong style={{ fontSize: 16 }}>Revenue Trend</Text>
                                <Tag color="green">Last 14 Days</Tag>
                            </Space>
                        }
                        style={{ borderRadius: 20, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}
                        bodyStyle={{ padding: "24px 16px 8px" }}
                    >
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={revenueTrend}>
                                <defs>
                                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                                <ReTooltip
                                    contentStyle={{
                                        borderRadius: 12, border: "none",
                                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                    }}
                                   formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Revenue"]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke={COLORS.primary}
                                    strokeWidth={3}
                                    fill="url(#revenueGradient)"
                                    dot={{ r: 4, fill: COLORS.primary, strokeWidth: 2, stroke: "#fff" }}
                                    activeDot={{ r: 6, fill: COLORS.primary }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>

                {/* Order Status Donut */}
                <Col xs={24} lg={8}>
                    <Card
                        title={
                            <Space>
                                <OrderedListOutlined style={{ color: COLORS.blue }} />
                                <Text strong style={{ fontSize: 16 }}>Order Status</Text>
                            </Space>
                        }
                        style={{ borderRadius: 20, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", height: "100%" }}
                        bodyStyle={{ padding: "16px" }}
                    >
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={100}
                                    paddingAngle={3}
                                    dataKey="value"
                                    strokeWidth={0}
                                >
                                    {statusData.map((_, i) => (
                                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <ReTooltip
                                    contentStyle={{
                                        borderRadius: 12, border: "none",
                                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", marginTop: 8 }}>
                            {statusData.map((s, i) => (
                                <Space key={s.name} size={4}>
                                    <div style={{
                                        width: 10, height: 10, borderRadius: "50%",
                                        background: PIE_COLORS[i],
                                    }} />
                                    <Text style={{ fontSize: 12 }}>{s.name}</Text>
                                    <Text strong style={{ fontSize: 12 }}>{s.value}</Text>
                                </Space>
                            ))}
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* Bottom Row: Top Products + Recent Orders */}
            <Row gutter={[20, 20]} style={{ marginTop: 24 }}>
                {/* Top Products */}
                <Col xs={24} lg={12}>
                    <Card
                        title={
                            <Space>
                                <RiseOutlined style={{ color: COLORS.primary }} />
                                <Text strong style={{ fontSize: 16 }}>Top Products</Text>
                            </Space>
                        }
                        style={{ borderRadius: 20, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}
                        bodyStyle={{ padding: "16px 8px" }}
                    >
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    width={120}
                                    tickFormatter={(v) => v?.length > 18 ? v.substring(0, 16) + "..." : v}
                                />
                                <ReTooltip
                                    contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
                                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Revenue"]}
                                />
                                <Bar dataKey="revenue" fill={COLORS.primary} radius={[0, 6, 6, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>

                {/* Recent Orders */}
                <Col xs={24} lg={12}>
                    <Card
                        title={
                            <Space>
                                <OrderedListOutlined style={{ color: COLORS.purple }} />
                                <Text strong style={{ fontSize: 16 }}>Recent Orders</Text>
                            </Space>
                        }
                        extra={<a href="/#/admin/orders" style={{ fontSize: 13 }}>View All →</a>}
                        style={{ borderRadius: 20, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}
                        bodyStyle={{ padding: "8px 16px" }}
                    >
                        <List
                            loading={ordersQuery.isLoading}
                            dataSource={orders.slice(0, 6)}
                            split={true}
                            renderItem={(order: IOrder) => (
                                <List.Item style={{ padding: "12px 0", cursor: "pointer" }}>
                                    <List.Item.Meta
                                        avatar={
                                            <Avatar
                                                shape="square"
                                                size={40}
                                                style={{
                                                    borderRadius: 10,
                                                    background: `${STATUS_COLORS[order.orderStatus]}20`,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <Text style={{ color: STATUS_COLORS[order.orderStatus], fontSize: 16 }}>
                                                    {STATUS_ICONS[order.orderStatus]}
                                                </Text>
                                            </Avatar>
                                        }
                                        title={
                                            <Space>
                                                <Text strong style={{ fontSize: 14 }}>
                                                    #{order.orderId?.substring(0, 8)?.toUpperCase()}
                                                </Text>
                                                <Tag
                                                    color={STATUS_COLORS[order.orderStatus]}
                                                    style={{ borderRadius: 10, fontSize: 11 }}
                                                >
                                                    {order.orderStatus}
                                                </Tag>
                                            </Space>
                                        }
                                        description={
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {order.shippingAddress?.fullName} · {new Date(order.createdAt).toLocaleDateString()}
                                            </Text>
                                        }
                                    />
                                    <Text strong style={{ fontSize: 14, color: COLORS.primary }}>
                                        ${order.total?.toFixed(2)}
                                    </Text>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Quick Actions + Categories */}
            <Row gutter={[20, 20]} style={{ marginTop: 24 }}>
                {/* Quick Actions */}
                <Col xs={24} lg={14}>
                    <Card
                        title={
                            <Space>
                                <ThunderboltOutlined style={{ color: COLORS.yellow }} />
                                <Text strong style={{ fontSize: 16 }}>Quick Actions</Text>
                            </Space>
                        }
                        style={{ borderRadius: 20, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}
                        bodyStyle={{ padding: "16px 20px" }}
                    >
                        <Row gutter={[12, 12]}>
                            {quickActions.map((action) => (
                                <Col xs={12} sm={8} md={6} key={action.title}>
                                    <a href={action.link}>
                                        <Card
                                            hoverable
                                            size="small"
                                            style={{
                                                textAlign: "center",
                                                borderRadius: 16,
                                                border: `1px solid ${action.color}20`,
                                                background: `${action.color}08`,
                                                transition: "all 0.3s ease",
                                            }}
                                            bodyStyle={{ padding: "20px 12px" }}
                                        >
                                            <div style={{
                                                width: 44, height: 44, borderRadius: 14,
                                                background: `${action.color}20`,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                margin: "0 auto 10px",
                                                fontSize: 20, color: action.color,
                                            }}>
                                                {action.icon}
                                            </div>
                                            <Text strong style={{ fontSize: 13, color: "#333" }}>
                                                {action.title}
                                            </Text>
                                        </Card>
                                    </a>
                                </Col>
                            ))}
                        </Row>
                    </Card>
                </Col>

                {/* Categories */}
                                {/* Categories */}
                                <Col xs={24} lg={10}>
                                    <Card
                                        title={
                                            <Space>
                                                <AppstoreOutlined style={{ color: COLORS.teal }} />
                                                <Text strong style={{ fontSize: 16 }}>Categories</Text>
                                            </Space>
                                        }
                                        extra={<a href="/#/admin/categories" style={{ fontSize: 13 }}>Manage →</a>}
                                        style={{ borderRadius: 20, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}
                                        bodyStyle={{ padding: "16px 20px" }}
                                    >
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                                            {categories.map((cat) => (
                                                <div
                                                    key={cat.id}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 10,
                                                        padding: "10px 16px",
                                                        borderRadius: 16,
                                                        background: "#FFF0F6",
                                                        border: "1px solid #FF006E20",
                                                        transition: "all 0.3s ease",
                                                        cursor: "pointer",
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = "translateY(-2px)";
                                                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(255,0,110,0.15)";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = "translateY(0)";
                                                        e.currentTarget.style.boxShadow = "none";
                                                    }}
                                                >
                                                    {/* Category Icon */}
                                                    {cat.icon && (
                                                        <img
                                                            src={cat.icon}
                                                            alt={cat.name}
                                                            style={{
                                                                width: 32,
                                                                height: 32,
                                                                borderRadius: 10,
                                                                objectFit: "cover",
                                                                background: "#fff",
                                                                padding: 2,
                                                            }}
                                                            onError={(e) => {
                                                                // Hide broken image, show fallback
                                                                (e.target as HTMLImageElement).style.display = "none";
                                                            }}
                                                        />
                                                    )}
                                                    <div>
                                                        <Text strong style={{ fontSize: 13, color: "#FF006E", display: "block" }}>
                                                            {cat.name}
                                                        </Text>
                                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                                            {cat.productCount || 0} products
                                                        </Text>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                </Col>
            </Row>
        </div>
    );
};

// Helper: Greeting based on time
function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "Morning";
    if (hour < 17) return "Afternoon";
    return "Evening";
}

// ============================================================
// VIEWER DASHBOARD (Read-only)
// ============================================================

const ViewerDashboard: React.FC = () => {
    // ... keep your existing ViewerDashboard code here ...
    return <ModernDashboard />; // Or use the same modern dashboard for viewers
};

// ============================================================
// MAIN EXPORT
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

    // Viewer gets the modern dashboard too (but without edit actions)
    if (identity?.role === "viewer") {
        return <ViewerDashboard />;
    }

    return <ModernDashboard />;
};

export default DashboardPage;