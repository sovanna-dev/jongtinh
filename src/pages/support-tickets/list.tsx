import { List, useTable, TextField, TagField, ShowButton } from "@refinedev/antd";
import { Table, Space, Tag, Select } from "antd";
import { ISupportTicket } from "../../interfaces";
import { useGetIdentity } from "@refinedev/core";
import { useLanguage } from "../../contexts/LanguageContext";

export const TicketList = () => {
    const { t, language } = useLanguage();
    const { data: identity } = useGetIdentity<{ id: string; role: string }>();
    const isAdmin = identity?.role && identity.role !== "viewer" && identity.role !== "customer";

    const { tableProps, setFilters } = useTable<ISupportTicket>({
        sorters: {
            initial: [{ field: "createdAt", order: "desc" }],
        },
        // 🔥 Customers can only see their own tickets
        filters: {
            permanent: isAdmin ? [] : [
                { field: "userId", operator: "eq", value: identity?.id || "" },
            ],
        },
        queryOptions: {
            enabled: !!identity?.id, // Don't query until we have user identity
        },
    });

    return (
        <List title={t.tickets.title}>
            <Space style={{ marginBottom: 16 }}>
                <Select
                    placeholder={t.tickets.filterStatus}
                    style={{ width: 200 }}
                    allowClear
                    onChange={(value) => {
                        setFilters([{ field: "status", operator: "eq", value }], "replace");
                    }}
                    options={[
                        { label: t.tickets.status.OPEN, value: "OPEN" },
                        { label: t.tickets.status.IN_PROGRESS, value: "IN_PROGRESS" },
                        { label: t.tickets.status.RESOLVED, value: "RESOLVED" },
                        { label: t.tickets.status.CLOSED, value: "CLOSED" },
                    ]}
                />
                <Select
                    placeholder={t.tickets.filterPriority}
                    style={{ width: 200 }}
                    allowClear
                    onChange={(value) => {
                        setFilters([{ field: "priority", operator: "eq", value }], "replace");
                    }}
                    options={[
                        { label: t.tickets.priority.LOW, value: "LOW" },
                        { label: t.tickets.priority.MEDIUM, value: "MEDIUM" },
                        { label: t.tickets.priority.HIGH, value: "HIGH" },
                    ]}
                />
            </Space>
            <Table {...tableProps} rowKey="id">
                <Table.Column dataIndex="id" title="ID" render={(value) => <TextField value={value?.substring(0, 8)} />} />
                <Table.Column dataIndex="subject" title={t.tickets.subject} />
                <Table.Column
                    dataIndex="status"
                    title={t.tickets.status.title || "Status"}
                    render={(value: keyof typeof t.tickets.status) => {
                        let color = "blue";
                        if (value === "OPEN") color = "green";
                        if (value === "CLOSED") color = "default";
                        if (value === "IN_PROGRESS") color = "orange";
                        return <Tag color={color}>{t.tickets.status[value] || value}</Tag>;
                    }}
                />
                <Table.Column
                    dataIndex="priority"
                    title={t.tickets.priority.title || "Priority"}
                    render={(value: keyof typeof t.tickets.priority) => {
                        let color = "blue";
                        if (value === "HIGH") color = "red";
                        if (value === "MEDIUM") color = "orange";
                        return <Tag color={color}>{t.tickets.priority[value] || value}</Tag>;
                    }}
                />
                <Table.Column dataIndex="createdAt" title={t.tickets.createdAt} render={(value) => new Date(value).toLocaleString(language === 'km' ? 'km-KH' : 'en-US')} />
                <Table.Column
                    title={t.tickets.actions}
                    dataIndex="actions"
                    render={(_, record: ISupportTicket) => (
                        <Space>
                            <ShowButton hideText size="small" recordItemId={record.id} />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
};