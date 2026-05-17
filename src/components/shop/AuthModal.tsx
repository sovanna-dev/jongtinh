import React, { useState } from "react";
import { Modal, Form, Input, Button, Tabs, message, Typography } from "antd";
import { MailOutlined, LockOutlined, UserOutlined } from "@ant-design/icons";
import { useCustomerAuth } from "../../contexts/CustomerAuthContext";

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
    const [form] = Form.useForm();

    const handleLogin = async (values: { email: string; password: string }) => {
        setLoading(true);
        const result = await login(values.email, values.password);
        setLoading(false);
        if (result.success) {
            message.success("Logged in successfully!");
            onClose();
        } else {
            message.error(result.error || "Login failed");
        }
    };

    const handleRegister = async (values: { name: string; email: string; password: string }) => {
        setLoading(true);
        const result = await register(values.name, values.email, values.password);
        setLoading(false);
        if (result.success) {
            message.success("Account created! You are now logged in.");
            onClose();
        } else {
            message.error(result.error || "Registration failed");
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
                <Text strong style={{ fontSize: 20 }}>Welcome to JongTinh</Text>
                <br />
                <Text type="secondary">Sign in to continue shopping</Text>
            </div>

            <Tabs activeKey={activeTab} onChange={setActiveTab} centered style={{ marginBottom: 8 }}>
                <Tabs.TabPane tab="Login" key="login">
                    <Form form={form} layout="vertical" onFinish={handleLogin} size="large">
                        <Form.Item name="email" rules={[{ required: true, type: "email", message: "Valid email required" }]}>
                            <Input prefix={<MailOutlined />} placeholder="Email" style={{ borderRadius: 10 }} />
                        </Form.Item>
                        <Form.Item name="password" rules={[{ required: true, min: 6, message: "Min 6 characters" }]}>
                            <Input.Password prefix={<LockOutlined />} placeholder="Password" style={{ borderRadius: 10 }} />
                        </Form.Item>
                        <Button type="primary" htmlType="submit" block loading={loading}
                            style={{ background: "#FF006E", border: "none", borderRadius: 12, height: 46, fontWeight: 600 }}>
                            Login
                        </Button>
                    </Form>
                </Tabs.TabPane>

                <Tabs.TabPane tab="Register" key="register">
                    <Form form={form} layout="vertical" onFinish={handleRegister} size="large">
                        <Form.Item name="name" rules={[{ required: true, message: "Name is required" }]}>
                            <Input prefix={<UserOutlined />} placeholder="Full Name" style={{ borderRadius: 10 }} />
                        </Form.Item>
                        <Form.Item name="email" rules={[{ required: true, type: "email", message: "Valid email required" }]}>
                            <Input prefix={<MailOutlined />} placeholder="Email" style={{ borderRadius: 10 }} />
                        </Form.Item>
                        <Form.Item name="password" rules={[{ required: true, min: 6, message: "Min 6 characters" }]}>
                            <Input.Password prefix={<LockOutlined />} placeholder="Password" style={{ borderRadius: 10 }} />
                        </Form.Item>
                        <Button type="primary" htmlType="submit" block loading={loading}
                            style={{ background: "#FF006E", border: "none", borderRadius: 12, height: 46, fontWeight: 600 }}>
                            Create Account
                        </Button>
                    </Form>
                </Tabs.TabPane>
            </Tabs>
        </Modal>
    );
};