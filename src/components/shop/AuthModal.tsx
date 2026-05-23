import React, { useState } from "react";
import { Modal, Form, Input, Button, Tabs, message, Typography } from "antd";
import { MailOutlined, LockOutlined, UserOutlined } from "@ant-design/icons";
import { useCustomerAuth } from "../../contexts/CustomerAuthContext";
import { useLanguage } from "../../contexts/LanguageContext";

const { Text } = Typography;

interface AuthModalProps {
    open: boolean;
    onClose: () => void;
    defaultTab?: "login" | "register";
}

export const AuthModal: React.FC<AuthModalProps> = ({ open, onClose, defaultTab = "login" }) => {
    const [activeTab, setActiveTab] = useState<string>(defaultTab);
    const [loading, setLoading] = useState(false);
    const { login, register } = useCustomerAuth();
    const { t } = useLanguage();
    const [form] = Form.useForm();

    const handleLogin = async (values: { email: string; password: string }) => {
        setLoading(true);
        const result = await login(values.email, values.password);
        setLoading(false);
        if (result.success) {
            message.success(t.auth.loginSuccess || "Logged in successfully!");
            onClose();
        } else {
            message.error(result.error || t.auth.loginFailed || "Login failed");
        }
    };

    const handleRegister = async (values: { name: string; email: string; password: string }) => {
        setLoading(true);
        const result = await register(values.name, values.email, values.password);
        setLoading(false);
        if (result.success) {
            message.success(t.auth.registerSuccess || "Account created! You are now logged in.");
            onClose();
        } else {
            message.error(result.error || t.auth.registerFailed || "Registration failed");
        }
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={440}
            centered
            styles={{ body: { padding: "24px 32px" } }}
        >
            <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{
                    width: 56, height: 56, borderRadius: 16, margin: "0 auto 12px",
                    background: "linear-gradient(135deg, #FF006E, #8338EC)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <UserOutlined style={{ fontSize: 28, color: "#fff" }} />
                </div>
                <Text strong style={{ fontSize: 20 }}>{t.auth.welcome}</Text>
                <br />
                <Text type="secondary">{t.auth.loginToContinue}</Text>
            </div>

            <Tabs activeKey={activeTab} onChange={setActiveTab} centered style={{ marginBottom: 8 }}>
                <Tabs.TabPane tab={t.auth.login} key="login">
                    <Form form={form} layout="vertical" onFinish={handleLogin} size="large">
                        <Form.Item name="email" rules={[{ required: true, type: "email", message: t.checkout.errors.fillRequired }]}>
                            <Input prefix={<MailOutlined />} placeholder={t.auth.email} style={{ borderRadius: 10 }} />
                        </Form.Item>
                        <Form.Item name="password" rules={[{ required: true, min: 6, message: t.auth.passwordMinChar || "Min 6 characters" }]}>
                            <Input.Password prefix={<LockOutlined />} placeholder={t.auth.password} style={{ borderRadius: 10 }} />
                        </Form.Item>
                        <Button type="primary" htmlType="submit" block loading={loading}
                            style={{ background: "#FF006E", border: "none", borderRadius: 12, height: 46, fontWeight: 600 }}>
                            {t.auth.login}
                        </Button>
                    </Form>
                </Tabs.TabPane>

                <Tabs.TabPane tab={t.auth.register} key="register">
                    <Form form={form} layout="vertical" onFinish={handleRegister} size="large">
                        <Form.Item name="name" rules={[{ required: true, message: t.checkout.errors.fillRequired }]}>
                            <Input prefix={<UserOutlined />} placeholder={t.auth.fullName} style={{ borderRadius: 10 }} />
                        </Form.Item>
                        <Form.Item name="email" rules={[{ required: true, type: "email", message: t.checkout.errors.fillRequired }]}>
                            <Input prefix={<MailOutlined />} placeholder={t.auth.email} style={{ borderRadius: 10 }} />
                        </Form.Item>
                        <Form.Item name="password" rules={[{ required: true, min: 6, message: t.auth.passwordMinChar || "Min 6 characters" }]}>
                            <Input.Password prefix={<LockOutlined />} placeholder={t.auth.password} style={{ borderRadius: 10 }} />
                        </Form.Item>
                        <Button type="primary" htmlType="submit" block loading={loading}
                            style={{ background: "#FF006E", border: "none", borderRadius: 12, height: 46, fontWeight: 600 }}>
                            {t.auth.createAccount}
                        </Button>
                    </Form>
                </Tabs.TabPane>
            </Tabs>
        </Modal>
    );
};