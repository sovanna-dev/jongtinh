import { List, useTable, TextField, TagField, ShowButton } from "@refinedev/antd";
import { Table, Space, Tag, Select } from "antd";
import { ISupportTicket } from "../../interfaces";
import { useGetIdentity } from "@refinedev/core";

export const TicketList = () => {
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
        <List>
            <Space style={{ marginBottom: 16 }}>
                <Select
                    placeholder="Filter by Status"
                    style={{ width: 200 }}
                    allowClear
                    onChange={(value) => {
                        setFilters([{ field: "status", operator: "eq", value }], "replace");
                    }}
                    options={[
                        { label: "Open", value: "OPEN" },
                        { label: "In Progress", value: "IN_PROGRESS" },
                        { label: "Resolved", value: "RESOLVED" },
                        { label: "Closed", value: "CLOSED" },
                    ]}
                />
                <Select
                    placeholder="Filter by Priority"
                    style={{ width: 200 }}
                    allowClear
                    onChange={(value) => {
                        setFilters([{ field: "priority", operator: "eq", value }], "replace");
                    }}
                    options={[
                        { label: "Low", value: "LOW" },
                        { label: "Medium", value: "MEDIUM" },
                        { label: "High", value: "HIGH" },
                    ]}
                />
            </Space>
            <Table {...tableProps} rowKey="id">
                <Table.Column dataIndex="id" title="ID" render={(value) => <TextField value={value?.substring(0, 8)} />} />
                <Table.Column dataIndex="subject" title="Subject" />
                <Table.Column
                    dataIndex="status"
                    title="Status"
                    render={(value) => {
                        let color = "blue";
                        if (value === "OPEN") color = "green";
                        if (value === "CLOSED") color = "default";
                        if (value === "IN_PROGRESS") color = "orange";
                        return <Tag color={color}>{value}</Tag>;
                    }}
                />
                <Table.Column
                    dataIndex="priority"
                    title="Priority"
                    render={(value) => {
                        let color = "blue";
                        if (value === "HIGH") color = "red";
                        if (value === "MEDIUM") color = "orange";
                        return <Tag color={color}>{value}</Tag>;
                    }}
                />
                <Table.Column dataIndex="createdAt" title="Created At" render={(value) => new Date(value).toLocaleString()} />
                <Table.Column
                    title="Actions"
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