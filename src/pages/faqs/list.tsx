import {
    List,
    useTable,
    EditButton,
    DeleteButton,
} from "@refinedev/antd";
import { Table, Space, Input, Tag, Button, Tooltip } from "antd";
import { SearchOutlined, LikeOutlined, DislikeOutlined } from "@ant-design/icons";
import { IFaq } from "../../interfaces";

export const FaqList = () => {
    const { tableProps, searchFormProps } = useTable<IFaq>({
        syncWithLocation: true,
        resource: "faqs",
        onSearch: (values: any) => {
            return [
                {
                    field: "question",
                    operator: "contains",
                    value: values.q,
                },
            ];
        },
    });

    return (
        <List>
            <div style={{ marginBottom: 16 }}>
                <Input
                    placeholder="Search FAQs..."
                    prefix={<SearchOutlined />}
                    onChange={(e) => {
                        searchFormProps.onFinish?.({ q: e.target.value });
                    }}
                    style={{ width: 300 }}
                    allowClear
                />
            </div>
            <Table {...tableProps} rowKey="id">
                <Table.Column dataIndex="id" title="ID" width={100} ellipsis />
                <Table.Column
                    dataIndex="category"
                    title="Category"
                    render={(value) => <Tag color="blue">{value || "General"}</Tag>}
                />
                <Table.Column dataIndex="question" title="Question" />
                <Table.Column dataIndex="answer" title="Answer" ellipsis />
                <Table.Column
                    title="Feedback"
                    render={(_, record: IFaq) => (
                        <Space size="large">
                            <Tooltip title={`${record.helpfulCount || 0} found this helpful`}>
                                <span>
                                    <LikeOutlined style={{ color: "#52c41a", marginRight: 4 }} />
                                    {record.helpfulCount || 0}
                                </span>
                            </Tooltip>
                            <Tooltip title={`${record.unhelpfulCount || 0} found this not helpful`}>
                                <span>
                                    <DislikeOutlined style={{ color: "#ff4d4f", marginRight: 4 }} />
                                    {record.unhelpfulCount || 0}
                                </span>
                            </Tooltip>
                        </Space>
                    )}
                />
                <Table.Column dataIndex="order" title="Order" width={80} sorter />
                <Table.Column
                    title="Actions"
                    dataIndex="actions"
                    render={(_, record: IFaq) => (
                        <Space>
                            <EditButton hideText size="small" recordItemId={record.id} />
                            <DeleteButton hideText size="small" recordItemId={record.id} />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
};