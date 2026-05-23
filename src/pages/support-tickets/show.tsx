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

    const repliesResult = useList<ITicketReply>({
        resource: "support_tickets",
        meta: {
            subCollection: `${record?.id}/replies`,
        },
        queryOptions: {
            enabled: !!record?.id,
        },
    });
    const repliesData = repliesResult.result;
    const repliesLoading = repliesResult.query.isLoading;
    const refetchReplies = repliesResult.query.refetch;

    const { mutate: createReply } = useCreate<ITicketReply>();
    const { mutate: updateTicket } = useUpdate();
    const [form] = Form.useForm();

       const handleAutoReply = (ticketId: string, subject: string, messageText: string) => {
           const currentUser = auth.currentUser;
           if (!currentUser) return;

           const lowerSubject = subject.toLowerCase();
           const lowerMessage = messageText.toLowerCase();
           let autoReplyMessage = "";

           if (lowerSubject.includes("order") || lowerMessage.includes("order")) {
               autoReplyMessage = "Hello! If you're inquiring about an order, please ensure you've provided the order ID. You can track your order status in the 'Orders' section of your profile.";
           } else if (lowerSubject.includes("refund") || lowerMessage.includes("refund")) {
               autoReplyMessage = "We've received your refund request. Our team typically reviews these within 2-3 business days. Please keep an eye on your email for updates.";
           } else if (lowerSubject.includes("delivery") || lowerMessage.includes("shipping")) {
               autoReplyMessage = "Shipping times vary by location, but most orders arrive within 3-5 business days. You'll receive a notification once your package is on its way!";
           }

           if (autoReplyMessage) {
               createReply({
                   resource: `support_tickets/${ticketId}/replies`,
                   values: {
                       message: `[Auto-Reply Bot]: ${autoReplyMessage}`,
                       userId: currentUser.uid,  // ← Use current user's ID, not "system-bot"
                       isAdminReply: true,
                       createdAt: Date.now() + 1000,
                   },
               }, {
                   onSuccess: () => {
                       refetchReplies();
                   }
               });
           }
       };

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
                    }, {
                        onSuccess: () => {
                            // Check if this is the first reply and from admin to trigger bot if needed
                            // (Actually, the bot should probably trigger on ticket creation,
                            // but here we can add a manual trigger or simulate it)
                        }
                    });
                }
            }
        });
    };

    const triggerBot = () => {
        if (record) {
            handleAutoReply(record.id, record.subject, record.message);
            message.info("Bot analysis triggered");
        }
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
                        <>
                            <Button onClick={triggerBot}>Run Bot Assistant</Button>
                            <Button danger onClick={handleCloseTicket}>Close Ticket</Button>
                        </>
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