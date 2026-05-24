import { Show, ListButton } from "@refinedev/antd";
import { Typography, Card, Divider, List, Avatar, Form, Input, Button, message, Space } from "antd";
import { ISupportTicket, ITicketReply, IUser } from "../../interfaces";
import { useShow, useOne, useList, useCreate, useUpdate } from "@refinedev/core";
import { collection, addDoc } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { useLanguage } from "../../contexts/LanguageContext";

const { Title, Text, Paragraph } = Typography;

export const TicketShow = () => {
    const { t, language } = useLanguage();
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
               autoReplyMessage = t.tickets.autoReplies.order;
           } else if (lowerSubject.includes("refund") || lowerMessage.includes("refund")) {
               autoReplyMessage = t.tickets.autoReplies.refund;
           } else if (lowerSubject.includes("delivery") || lowerMessage.includes("shipping")) {
               autoReplyMessage = t.tickets.autoReplies.delivery;
           }

           if (autoReplyMessage) {
               createReply({
                   resource: `support_tickets/${ticketId}/replies`,
                   values: {
                       message: `${t.tickets.autoReplies.botPrefix}${autoReplyMessage}`,
                       userId: currentUser.uid,  // ← Use current user's ID, not "system-bot"
                       isAdminReply: true,
                       createdAt: Date.now() + 1000,
                   },
               }, {
                   onSuccess: async () => {
                       // 🆕 Send notification to customer
                       if (record) {
                           try {
                               await addDoc(collection(db, "notifications"), {
                                   userId: record.userId,
                                   title: t.tickets.notifications.autoReplyTitle,
                                   message: t.tickets.notifications.autoReplyMessage.replace("{subject}", subject),
                                   timestamp: Date.now(),
                                   type: "support",
                                   isRead: false,
                                   destination: "ticket",
                                   destinationId: record.id,
                               });
                           } catch (e) {
                               console.error("Error sending notification:", e);
                           }
                       }
                       refetchReplies();
                   }
               });
           }
       };

    const onFinish = (values: { message: string }) => {
        if (!record?.id) return;

        const currentUser = auth.currentUser;
        if (!currentUser) {
            message.error(t.tickets.messages.loginToReply);
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
            onSuccess: async () => {
                form.resetFields();
                message.success(t.tickets.messages.replySent);
                refetchReplies();

                // 🆕 Send notification to customer
                try {
                    await addDoc(collection(db, "notifications"), {
                        userId: record.userId,
                        title: t.tickets.notifications.adminReplyTitle,
                        message: t.tickets.notifications.adminReplyMessage.replace("{subject}", record.subject),
                        timestamp: Date.now(),
                        type: "support",
                        isRead: false,
                        destination: "ticket",
                        destinationId: record.id,
                    });
                } catch (e) {
                    console.error("Error sending notification:", e);
                }

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
            message.info(t.tickets.messages.botTriggered);
        }
    };

    const handleCloseTicket = () => {
        if (!record?.id) return;
        updateTicket({
            resource: "support_tickets",
            id: record.id,
            values: { status: "CLOSED" },
        }, {
            onSuccess: () => message.success(t.tickets.messages.ticketClosed)
        });
    };

    return (
        <Show
            isLoading={isLoading}
            title={t.tickets.ticketDetails}
            headerButtons={({ defaultButtons }) => (
                <Space>
                    <ListButton />
                    {defaultButtons}
                    {record?.status !== "CLOSED" && (
                        <>
                            <Button onClick={triggerBot}>{t.tickets.runBot}</Button>
                            <Button danger onClick={handleCloseTicket}>{t.tickets.closeTicket}</Button>
                        </>
                    )}
                </Space>
            )}
        >
            <Card title={t.tickets.ticketDetails} bordered={false}>
                <Title level={5}>{t.tickets.subject}</Title>
                <Paragraph>{record?.subject}</Paragraph>

                <Title level={5}>{t.tickets.message}</Title>
                <Paragraph>{record?.message}</Paragraph>

                {record?.category && (
                    <>
                        <Title level={5}>{t.tickets.category}</Title>
                        <Paragraph>{record?.category}</Paragraph>
                    </>
                )}

                {record?.orderId && (
                    <>
                        <Title level={5}>{t.tickets.relatedOrder}</Title>
                        <Paragraph>{record?.orderId}</Paragraph>
                    </>
                )}

                <Divider />

                <Title level={5}>{t.tickets.userInfo}</Title>
                <Space direction="vertical">
                    <Text><strong>{t.tickets.name}:</strong> {userData?.data?.displayName || "Loading..."}</Text>
                    <Text><strong>{t.tickets.email}:</strong> {userData?.data?.email || "Loading..."}</Text>
                </Space>
            </Card>

            <Divider orientation="left">{t.tickets.conversation}</Divider>

            <List
                loading={repliesLoading}
                itemLayout="horizontal"
                dataSource={repliesData?.data}
                locale={{ emptyText: t.tickets.noReplies }}
                renderItem={(item: ITicketReply) => (
                    <List.Item>
                        <List.Item.Meta
                            avatar={<Avatar style={{ backgroundColor: item.isAdminReply ? '#87d068' : '#1677ff' }}>{item.isAdminReply ? 'A' : 'U'}</Avatar>}
                            title={<Text strong>{item.isAdminReply ? t.tickets.adminSupport : t.tickets.customer}</Text>}
                            description={new Date(item.createdAt).toLocaleString(language === 'km' ? 'km-KH' : 'en-US')}
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
                        <Form.Item name="message" label={t.tickets.replyToTicket} rules={[{ required: true }]}>
                            <Input.TextArea rows={4} placeholder={t.tickets.typeReply} />
                        </Form.Item>
                        <Button type="primary" htmlType="submit">{t.tickets.sendReply}</Button>
                    </Form>
                </Card>
            )}
        </Show>
    );
};