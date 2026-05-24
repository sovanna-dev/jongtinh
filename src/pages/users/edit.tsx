import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Switch, Avatar, Typography, Tag, Select } from "antd";
import { IUser } from "../../interfaces";
import { UserOutlined } from "@ant-design/icons";
import { auth } from "../../firebase";
import { useLanguage } from "../../contexts/LanguageContext";

const { Title, Text } = Typography;

export const UserEdit = () => {
    const { t } = useLanguage();
    const { formProps, saveButtonProps, query: queryResult } = useForm<IUser>();

    const userData = queryResult?.data?.data;
    const isEditingSelf = userData?.id === auth.currentUser?.uid;

    return (
        <Edit saveButtonProps={saveButtonProps} title={t.users.editTitle}>
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
                            {userData?.isAdmin ? t.users.administrator : t.users.standardUser}
                        </Tag>
                    </div>
                    <Text type="secondary">{userData?.email}</Text>
                    {isEditingSelf && (
                        <div style={{ marginTop: 8 }}>
                            <Text type="warning" italic>{t.users.editingSelf}</Text>
                        </div>
                    )}
                </div>

                <Form.Item label={t.users.fullName} name="displayName">
                    <Input disabled />
                </Form.Item>

                <Form.Item label={t.users.email} name="email">
                    <Input disabled />
                </Form.Item>

                <Form.Item
                    label={t.users.adminAccess}
                    name="isAdmin"
                    valuePropName="checked"
                    extra={isEditingSelf
                        ? t.users.revokeWarning
                        : t.users.grantHelp}
                >
                    <Switch
                        checkedChildren={t.users.admin}
                        unCheckedChildren={t.users.user}
                        disabled={isEditingSelf}
                    />
                </Form.Item>

                {/* NEW: Role Selection */}
                <Form.Item
                    label={t.users.adminRole}
                    name="role"
                    rules={[{ required: true }]}
                    extra={t.users.roleHelp}
                >
                    <Select>
                        <Select.Option value="super_admin">{t.users.roles.super_admin}</Select.Option>
                        <Select.Option value="product_manager">{t.users.roles.product_manager}</Select.Option>
                        <Select.Option value="order_manager">{t.users.roles.order_manager}</Select.Option>
                        <Select.Option value="support_agent">{t.users.roles.support_agent}</Select.Option>
                        <Select.Option value="viewer">{t.users.roles.viewer}</Select.Option>
                    </Select>
                </Form.Item>
            </Form>
        </Edit>
    );
};