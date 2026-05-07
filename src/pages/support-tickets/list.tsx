import { List, useTable, TextField, TagField, ShowButton } from "@refinedev/antd";
import { Table, Space, Tag } from "antd";
import { ISupportTicket } from "../../interfaces";

export const TicketList = () => {
    const { tableProps } = useTable<ISupportTicket>();

    return (
        <List>
            <Table {...tableProps} rowKey="id">
                <Table.Column
                    dataIndex="id"
                    title="ID"
                    render={(value) => <TextField value={value.substring(0, 8)} />}
                />
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
                <Table.Column
                    dataIndex="createdAt"
                    title="Created At"
                    render={(value) => new Date(value).toLocaleString()}
                />
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
