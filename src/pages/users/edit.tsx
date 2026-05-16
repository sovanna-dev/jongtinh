import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Switch, Avatar, Typography, Tag, Select } from "antd";
import { IUser } from "../../interfaces";
import { UserOutlined } from "@ant-design/icons";
import { auth } from "../../firebase";

const { Title, Text } = Typography;

export const UserEdit = () => {
    const { formProps, saveButtonProps, query: queryResult } = useForm<IUser>();

    const userData = queryResult?.data?.data;
    const isEditingSelf = userData?.id === auth.currentUser?.uid;

    return (
        <Edit saveButtonProps={saveButtonProps} title="Edit User Permissions">
            <Form {...formProps} layout="vertical">
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Avatar
                        size={120}
                        src={userData?.photoUrl || userData?.profileImage}
                        icon={<UserOutlined />}
                        style={{ marginBottom: 16, border: '4px solid #f0f0f0' }}
                    />
                    <Title level={4} style={{ marginBottom: 4 }}>{userData?.displayName}</Title>
                    <div style={{ marginBottom: 16 }}>
                        <Tag color={userData?.isAdmin ? "red" : "blue"}>
                            {userData?.isAdmin ? "Administrator" : "Standard User"}
                        </Tag>
                    </div>
                    <Text type="secondary">{userData?.email}</Text>
                    {isEditingSelf && (
                        <div style={{ marginTop: 8 }}>
                            <Text type="warning" italic>(You are editing your own profile)</Text>
                        </div>
                    )}
                </div>

                <Form.Item label="Full Name" name="displayName">
                    <Input disabled />
                </Form.Item>

                <Form.Item label="Email" name="email">
                    <Input disabled />
                </Form.Item>

                <Form.Item
                    label="Administrator Access"
                    name="isAdmin"
                    valuePropName="checked"
                    extra={isEditingSelf
                        ? "You cannot revoke your own admin status for security reasons."
                        : "Granting admin access allows this user to log in to this dashboard."}
                >
                    <Switch
                        checkedChildren="Admin"
                        unCheckedChildren="User"
                        disabled={isEditingSelf}
                    />
                </Form.Item>

                {/* NEW: Role Selection */}
                <Form.Item
                    label="Admin Role"
                    name="role"
                    rules={[{ required: true }]}
                    extra="Determines which sections this admin can access."
                >
                    <Select>
                        <Select.Option value="super_admin">Super Admin — Full Access</Select.Option>
                        <Select.Option value="product_manager">Product Manager — Products, Categories, Banners</Select.Option>
                        <Select.Option value="order_manager">Order Manager — Orders, Notifications</Select.Option>
                        <Select.Option value="support_agent">Support Agent — Tickets, FAQs</Select.Option>
                        <Select.Option value="viewer">Viewer — Dashboard Only (Read-Only)</Select.Option>
                    </Select>
                </Form.Item>
            </Form>
        </Edit>
    );
};