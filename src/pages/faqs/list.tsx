import {
    List,
    useTable,
    EditButton,
    DeleteButton,
} from "@refinedev/antd";
import { Table, Space } from "antd";

interface IFaq {
    id: string;
    question: string;
    answer: string;
    order: number;
}

export const FaqList = () => {
    const { tableProps } = useTable<IFaq>({
        syncWithLocation: true,
        resource: "faqs",
    });

    return (
        <List>
            <Table {...tableProps} rowKey="id">
                <Table.Column dataIndex="id" title="ID" width={100} ellipsis />
                <Table.Column dataIndex="question" title="Question" />
                <Table.Column dataIndex="answer" title="Answer" ellipsis />
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