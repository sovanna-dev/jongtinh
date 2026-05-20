import React from "react";
import { Modal, Row, Col, Card, Statistic, Typography, Space, Divider } from "antd";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useList } from "@refinedev/core";
import { IOrder } from "../../interfaces";

const { Title, Text } = Typography;

const COLORS = ["#FF006E", "#8338EC", "#3A86FF", "#FFBE0B", "#FB5607"];

interface LiveChartPopupProps {
    visible: boolean;
    onClose: () => void;
    isDark?: boolean;
}

export const LiveChartPopup: React.FC<LiveChartPopupProps> = ({ visible, onClose, isDark }) => {
    const { query: ordersQuery } = useList<IOrder>({
        resource: "orders",
        pagination: { pageSize: 50 },
        sorters: [{ field: "createdAt", order: "desc" }],
    });

    const orders = ordersQuery.data?.data || [];
    const totalRevenue = orders.filter(o => o.orderStatus !== "CANCELLED").reduce((sum, o) => sum + o.total, 0);

    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split("T")[0];
    });

    const revenueData = last7Days.map(date => ({
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        revenue: orders.filter(o => new Date(o.createdAt).toISOString().split("T")[0] === date && o.orderStatus !== "CANCELLED").reduce((sum, o) => sum + o.total, 0),
    }));

    const statusData = [
        { name: "Pending", value: orders.filter(o => o.orderStatus === "PENDING").length },
        { name: "Processing", value: orders.filter(o => o.orderStatus === "PROCESSING").length },
        { name: "Shipping", value: orders.filter(o => o.orderStatus === "SHIPPING").length },
        { name: "Delivered", value: orders.filter(o => o.orderStatus === "DELIVERED").length },
    ].filter(s => s.value > 0);

    return (
        <Modal
            title={
                <Space>
                    {/* Animated Chart Bars */}
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="14" width="3" height="6" rx="0.5" fill="#FF006E">
                            <animate attributeName="height" values="6;12;6" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="y" values="14;8;14" dur="2s" repeatCount="indefinite" />
                        </rect>
                        <rect x="8" y="10" width="3" height="10" rx="0.5" fill="#8338EC">
                            <animate attributeName="height" values="10;4;10" dur="2.2s" repeatCount="indefinite" />
                            <animate attributeName="y" values="10;16;10" dur="2.2s" repeatCount="indefinite" />
                        </rect>
                        <rect x="13" y="6" width="3" height="14" rx="0.5" fill="#3A86FF">
                            <animate attributeName="height" values="14;8;14" dur="1.8s" repeatCount="indefinite" />
                            <animate attributeName="y" values="6;12;6" dur="1.8s" repeatCount="indefinite" />
                        </rect>
                        <rect x="18" y="2" width="3" height="18" rx="0.5" fill="#FFBE0B">
                            <animate attributeName="height" values="18;10;18" dur="2.5s" repeatCount="indefinite" />
                            <animate attributeName="y" values="2;10;2" dur="2.5s" repeatCount="indefinite" />
                        </rect>
                    </svg>
                    <Title level={4} style={{ margin: 0 }}>Live Analytics</Title>
                </Space>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={800}
            centered
            styles={{ content: { borderRadius: 20, background: isDark ? "#1f1f1f" : "#fff", padding: 24 } }}
        >
            <Row gutter={[16, 16]}>
                <Col span={12}>
                    <Card bordered={false} style={{ background: isDark ? "#262626" : "#f5f5f5", borderRadius: 16 }}>
                        <Statistic title="Live Revenue" value={totalRevenue} precision={2} prefix="$" valueStyle={{ color: "#4CAF50" }} />
                    </Card>
                </Col>
                <Col span={12}>
                    <Card bordered={false} style={{ background: isDark ? "#262626" : "#f5f5f5", borderRadius: 16 }}>
                        <Statistic title="Total Orders" value={orders.length} valueStyle={{ color: "#3A86FF" }} />
                    </Card>
                </Col>
                <Col span={24}>
                    <Divider orientation="left">Revenue (7 Days)</Divider>
                    <div style={{ height: 250 }}>
                        <ResponsiveContainer>
                            <BarChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#333" : "#eee"} />
                                <XAxis dataKey="date" stroke={isDark ? "#888" : "#666"} />
                                <YAxis stroke={isDark ? "#888" : "#666"} />
                                <Tooltip contentStyle={{ background: isDark ? "#1f1f1f" : "#fff", border: "none", borderRadius: 8 }} />
                                <Bar dataKey="revenue" fill="#FF006E" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Col>
                <Col span={24}>
                    <Divider orientation="left">Order Status</Divider>
                    <div style={{ height: 200, display: 'flex', justifyContent: 'center' }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Col>
            </Row>
            <div style={{ textAlign: 'center', marginTop: 12 }}>
                <Text type="secondary">Real-time data from JongTinh Platform</Text>
            </div>
        </Modal>
    );
};