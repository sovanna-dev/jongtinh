import { Show, ListButton } from "@refinedev/antd";
import { Typography, Card, Divider, List, Avatar, Form, Input, Button, message, Space } from "antd";
import { ISupportTicket, ITicketReply, IUser } from "../../interfaces";
import { useShow, useOne, useList, useCreate, useUpdate } from "@refinedev/core";
import { auth } from "../../firebase";

const { Title, Text, Paragraph } = Typography;

export const TicketShow = () => {
    const { query: queryResult } = useShow<ISupportTicket>();
    const { data, isLoading } = queryResult;
    const record = data?.data;

    const { query: userQuery } = useOne<IUser>({
        resource: "users",
        id: record?.userId || "",
        queryOptions: {
            enabled: !!record?.userId,
        },
    });
    const userData = userQuery.data;

    const { query: repliesQuery, refetch: refetchReplies } = useList<ITicketReply>({
        resource: "support_tickets",
        meta: {
            subCollection: `${record?.id}/replies`,
        },
        queryOptions: {
            enabled: !!record?.id,
        },
    });
    const repliesData = repliesQuery.data;
    const repliesLoading = repliesQuery.isLoading;

    const { mutate: createReply } = useCreate<ITicketReply>();
    const { mutate: updateTicket } = useUpdate();
    const [form] = Form.useForm();

    const onFinish = (values: { message: string }) => {
        if (!record?.id) return;

        const currentUser = auth.currentUser;
        if (!currentUser) {
            message.error("You must be logged in to reply");
            return;
        }

        createReply({
            resource: `support_tickets/${record.id}/replies`,
            values: {
                ...values,
                userId: currentUser.uid,
                isAdminReply: true,
                createdAt: Date.now(),
            },
        }, {
            onSuccess: () => {
                form.resetFields();
                message.success("Reply sent successfully");
                refetchReplies();
                if (record.status === "OPEN") {
                    updateTicket({
                        resource: "support_tickets",
                        id: record.id,
                        values: { status: "IN_PROGRESS" },
                    });
                }
            }
        });
    };

    const handleCloseTicket = () => {
        if (!record?.id) return;
        updateTicket({
            resource: "support_tickets",
            id: record.id,
            values: { status: "CLOSED" },
        }, {
            onSuccess: () => message.success("Ticket closed")
        });
    };

    return (
        <Show
            isLoading={isLoading}
            headerButtons={({ defaultButtons }) => (
                <Space>
                    <ListButton />
                    {defaultButtons}
                    {record?.status !== "CLOSED" && (
                        <Button danger onClick={handleCloseTicket}>Close Ticket</Button>
                    )}
                </Space>
            )}
        >
            <Card title="Ticket Details" bordered={false}>
                <Title level={5}>Subject</Title>
                <Paragraph>{record?.subject}</Paragraph>

                <Title level={5}>Message</Title>
                <Paragraph>{record?.message}</Paragraph>

                {record?.category && (
                    <>
                        <Title level={5}>Category</Title>
                        <Paragraph>{record?.category}</Paragraph>
                    </>
                )}

                {record?.orderId && (
                    <>
                        <Title level={5}>Related Order</Title>
                        <Paragraph>{record?.orderId}</Paragraph>
                    </>
                )}

                <Divider />

                <Title level={5}>User Information</Title>
                <Space direction="vertical">
                    <Text><strong>Name:</strong> {userData?.data?.displayName || "Loading..."}</Text>
                    <Text><strong>Email:</strong> {userData?.data?.email || "Loading..."}</Text>
                </Space>
            </Card>

            <Divider orientation="left">Conversation</Divider>

            <List
                loading={repliesLoading}
                itemLayout="horizontal"
                dataSource={repliesData?.data}
                locale={{ emptyText: "No replies yet" }}
                renderItem={(item: ITicketReply) => (
                    <List.Item>
                        <List.Item.Meta
                            avatar={<Avatar style={{ backgroundColor: item.isAdminReply ? '#87d068' : '#1677ff' }}>{item.isAdminReply ? 'A' : 'U'}</Avatar>}
                            title={<Text strong>{item.isAdminReply ? "Admin Support" : "Customer"}</Text>}
                            description={new Date(item.createdAt).toLocaleString()}
                        />
                        <div style={{ maxWidth: '80%', padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
                            {item.message}
                        </div>
                    </List.Item>
                )}
            />

            {record?.status !== "CLOSED" && (
                <Card style={{ marginTop: 24 }}>
                    <Form form={form} layout="vertical" onFinish={onFinish}>
                        <Form.Item name="message" label="Reply to Ticket" rules={[{ required: true }]}>
                            <Input.TextArea rows={4} placeholder="Type your reply here..." />
                        </Form.Item>
                        <Button type="primary" htmlType="submit">Send Reply</Button>
                    </Form>
                </Card>
            )}
        </Show>
    );
};