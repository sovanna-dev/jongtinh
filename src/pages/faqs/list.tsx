import {
    List,
    useTable,
    EditButton,
    DeleteButton,
} from "@refinedev/antd";
import { Table, Space, Input, Tag, Button, Tooltip } from "antd";
import { SearchOutlined, LikeOutlined, DislikeOutlined } from "@ant-design/icons";
import { IFaq } from "../../interfaces";
import { useLanguage } from "../../contexts/LanguageContext";

export const FaqList = () => {
    const { t } = useLanguage();
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
        <List title={t.admin.adminFaq.title}>
            <div style={{ marginBottom: 16 }}>
                <Input
                    placeholder={t.faq.searchPlaceholder}
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
                    title={t.tickets.category}
                    render={(value) => <Tag color="blue">{value || t.faq.general}</Tag>}
                />
                <Table.Column dataIndex="question" title={t.admin.adminFaq.question} />
                <Table.Column dataIndex="answer" title={t.admin.adminFaq.answer} ellipsis />
                <Table.Column
                    title={t.admin.adminFaq.feedback}
                    render={(_, record: IFaq) => (
                        <Space size="large">
                            <Tooltip title={`${record.helpfulCount || 0} ${t.admin.adminFaq.helpful}`}>
                                <span>
                                    <LikeOutlined style={{ color: "#52c41a", marginRight: 4 }} />
                                    {record.helpfulCount || 0}
                                </span>
                            </Tooltip>
                            <Tooltip title={`${record.unhelpfulCount || 0} ${t.admin.adminFaq.notHelpful}`}>
                                <span>
                                    <DislikeOutlined style={{ color: "#ff4d4f", marginRight: 4 }} />
                                    {record.unhelpfulCount || 0}
                                </span>
                            </Tooltip>
                        </Space>
                    )}
                />
                <Table.Column dataIndex="order" title={t.admin.adminFaq.order} width={80} sorter />
                <Table.Column
                    title={t.tickets.actions}
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