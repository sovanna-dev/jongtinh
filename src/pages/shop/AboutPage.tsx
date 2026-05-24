import React from "react";
import { Typography, Row, Col, Card, Avatar, Space, Divider, Tag } from "antd";
import {
    RocketOutlined,
    TeamOutlined,
    BulbOutlined,
    HeartOutlined,
    GlobalOutlined,
    SafetyCertificateOutlined
} from "@ant-design/icons";
import { ShopLayout } from "./ShopLayout";
import { useLanguage } from "../../contexts/LanguageContext";
import { ColorModeContext } from "../../contexts/color-mode";
import logo from "../../images/logo.webp";

const { Title, Text, Paragraph } = Typography;

export const AboutPage: React.FC = () => {
    const { t, language } = useLanguage();
    const { mode } = React.useContext(ColorModeContext);
    const isDark = mode === "dark";

    const teamMembers = [
        { name: "Ra Sovanna", role: "Project Manager / Lead Developer", initial: "RS" },
        { name: "Kheng Khet", role: "UI/UX Designer", initial: "KK" },
        { name: "Pov Pich", role: "Backend Developer", initial: "PP" },
        { name: "Nim Mengleang", role: "Quality Assurance", initial: "NM" },
        { name: "Chan Borith", role: "System Analyst", initial: "CB" },
        { name: "Chhoeurn Sovannary", role: "Frontend Developer", initial: "CS" },
        { name: "Mao Tonghour", role: "Mobile Developer", initial: "MT" }
    ];

    const values = [
        {
            icon: <RocketOutlined style={{ fontSize: 32, color: "#FF006E" }} />,
            title: language === "en" ? "Innovation" : "នវានុវត្តន៍",
            description: language === "en"
                ? "Continuously improving our platform to provide the best shopping experience in Cambodia."
                : "បន្តកែលម្អគេហទំព័ររបស់យើង ដើម្បីផ្តល់នូវបទពិសោធន៍ទិញទំនិញដ៏ល្អបំផុតនៅក្នុងប្រទេសកម្ពុជា។"
        },
        {
            icon: <SafetyCertificateOutlined style={{ fontSize: 32, color: "#8338EC" }} />,
            title: language === "en" ? "Trust & Security" : "ទំនុកចិត្ត និងសុវត្ថិភាព",
            description: language === "en"
                ? "Your data and payments are always protected with industry-standard security."
                : "ទិន្នន័យ និងការទូទាត់របស់អ្នកត្រូវបានការពារជានិច្ចជាមួយនឹងស្តង់ដារសុវត្ថិភាពខ្ពស់។"
        },
        {
            icon: <HeartOutlined style={{ fontSize: 32, color: "#FFBE0B" }} />,
            title: language === "en" ? "Customer First" : "អតិថិជនជាចម្បង",
            description: language === "en"
                ? "We listen to our customers and strive to exceed their expectations every day."
                : "យើងស្តាប់អតិថិជនរបស់យើង ហើយខិតខំផ្តល់លើសពីការរំពឹងទុករបស់ពួកគេជារៀងរាល់ថ្ងៃ។"
        }
    ];

    return (
        <ShopLayout searchQuery="" setSearchQuery={() => {}} onSearch={() => {}}>
            <div style={{ padding: "40px 0" }}>
                {/* Hero Section */}
                <div style={{ textAlign: "center", marginBottom: 80 }}>
                    <div style={{
                        width: 100, height: 100, borderRadius: 24,
                        background: "linear-gradient(135deg, #FF006E 0%, #8338EC 100%)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 24px", boxShadow: "0 12px 24px rgba(255, 0, 110, 0.2)"
                    }}>
                        <img src={logo} alt="JongTinh" style={{ width: 70, height: 70, borderRadius: 16, background: "#fff" }} />
                    </div>
                    <Title level={1} style={{ fontSize: window.innerWidth > 768 ? 48 : 32, fontWeight: 800, marginBottom: 16 }}>
                        {language === "en" ? "About JongTinh" : "អំពី ចង់ទិញ"}
                    </Title>
                    <Paragraph style={{ fontSize: 18, color: isDark ? "#aaa" : "#666", maxWidth: 700, margin: "0 auto" }}>
                        {language === "en"
                            ? "JongTinh is Cambodia's premier e-commerce destination, dedicated to bringing quality products and seamless shopping experiences to your fingertips."
                            : "ចង់ទិញ គឺជាគោលដៅពាណិជ្ជកម្មតាមប្រព័ន្ធអេឡិចត្រូនិកឈានមុខគេរបស់កម្ពុជា ដែលឧទ្ទិសដល់ការនាំយកផលិតផលដែលមានគុណភាព និងបទពិសោធន៍ទិញទំនិញដ៏រលូនមកកាន់អ្នក។"}
                    </Paragraph>
                </div>

                {/* Mission & Vision */}
                <Row gutter={[40, 40]} style={{ marginBottom: 100 }}>
                    <Col xs={24} md={12}>
                        <Card bordered={false} style={{ height: "100%", borderRadius: 20, background: isDark ? "#141414" : "#fff", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
                            <Space align="start" size={16}>
                                <div style={{ padding: 12, background: "rgba(255, 0, 110, 0.1)", borderRadius: 12 }}>
                                    <BulbOutlined style={{ fontSize: 24, color: "#FF006E" }} />
                                </div>
                                <div>
                                    <Title level={3}>{language === "en" ? "Our Mission" : "បេសកកម្មរបស់យើង"}</Title>
                                    <Text style={{ fontSize: 16, lineHeight: 1.8, color: isDark ? "#ccc" : "#444" }}>
                                        {language === "en"
                                            ? "To empower Cambodian consumers and businesses through a reliable, innovative, and accessible digital marketplace that simplifies life."
                                            : "ដើម្បីផ្តល់ថាមពលដល់អ្នកប្រើប្រាស់ និងអាជីវកម្មកម្ពុជាតាមរយៈទីផ្សារឌីជីថលដែលអាចទុកចិត្តបាន ភាពច្នៃប្រឌិត និងងាយស្រួលប្រើប្រាស់ ដែលធ្វើឱ្យជីវិតកាន់តែងាយស្រួល។"}
                                    </Text>
                                </div>
                            </Space>
                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card bordered={false} style={{ height: "100%", borderRadius: 20, background: isDark ? "#141414" : "#fff", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
                            <Space align="start" size={16}>
                                <div style={{ padding: 12, background: "rgba(131, 56, 236, 0.1)", borderRadius: 12 }}>
                                    <GlobalOutlined style={{ fontSize: 24, color: "#8338EC" }} />
                                </div>
                                <div>
                                    <Title level={3}>{language === "en" ? "Our Vision" : "ចក្ខុវិស័យរបស់យើង"}</Title>
                                    <Text style={{ fontSize: 16, lineHeight: 1.8, color: isDark ? "#ccc" : "#444" }}>
                                        {language === "en"
                                            ? "To be the most trusted and preferred online shopping platform in Cambodia, known for quality, speed, and exceptional customer service."
                                            : "ដើម្បីក្លាយជាវេទិកាទិញទំនិញអនឡាញដែលគួរឱ្យទុកចិត្តបំផុត និងពេញចិត្តបំផុតនៅក្នុងប្រទេសកម្ពុជា ដែលត្រូវបានគេស្គាល់តាមរយៈគុណភាព ល្បឿន និងសេវាកម្មអតិថិជនដ៏ឆ្នើម។"}
                                    </Text>
                                </div>
                            </Space>
                        </Card>
                    </Col>
                </Row>

                {/* Values */}
                <div style={{ marginBottom: 100 }}>
                    <Title level={2} style={{ textAlign: "center", marginBottom: 48 }}>{language === "en" ? "Our Core Values" : "គុណតម្លៃស្នូលរបស់យើង"}</Title>
                    <Row gutter={[24, 24]}>
                        {values.map((val, idx) => (
                            <Col xs={24} md={8} key={idx}>
                                <div style={{ textAlign: "center", padding: 24 }}>
                                    <div style={{ marginBottom: 16 }}>{val.icon}</div>
                                    <Title level={4}>{val.title}</Title>
                                    <Text style={{ color: isDark ? "#aaa" : "#666" }}>{val.description}</Text>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </div>

                <Divider style={{ margin: "60px 0" }} />

                {/* Team Section */}
                <div style={{ marginBottom: 60 }}>
                    <div style={{ textAlign: "center", marginBottom: 48 }}>
                        <Tag color="magenta" style={{ marginBottom: 8 }}>{language === "en" ? "THE BRAINS" : "អ្នកដឹកនាំ"}</Tag>
                        <Title level={2}>{language === "en" ? "Meet Our Team" : "ជួបជាមួយក្រុមការងាររបស់យើង"}</Title>
                        <Text type="secondary">{language === "en" ? "The passionate people behind JongTinh" : "មនុស្សដែលមានចំណង់ចំណូលចិត្តនៅពីក្រោយ ចង់ទិញ"}</Text>
                    </div>

                    <Row gutter={[24, 24]} justify="center">
                        {teamMembers.map((member, idx) => (
                            <Col xs={24} sm={12} md={8} lg={6} key={idx}>
                                <Card
                                    hoverable
                                    style={{
                                        textAlign: "center",
                                        borderRadius: 20,
                                        background: isDark ? "#141414" : "#fff",
                                        border: isDark ? "1px solid #333" : "1px solid #f0f0f0"
                                    }}
                                >
                                    <Avatar
                                        size={80}
                                        style={{
                                            background: `linear-gradient(135deg, ${idx % 2 === 0 ? "#FF006E" : "#8338EC"}, ${idx % 2 === 0 ? "#8338EC" : "#3A86FF"})`,
                                            fontSize: 28,
                                            fontWeight: 700,
                                            marginBottom: 16
                                        }}
                                    >
                                        {member.initial}
                                    </Avatar>
                                    <Title level={4} style={{ margin: 0 }}>{member.name}</Title>
                                    <Text type="secondary" style={{ fontSize: 13 }}>{member.role}</Text>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>

                {/* Call to Action */}
                <Card
                    style={{
                        borderRadius: 24,
                        background: "linear-gradient(135deg, #FF006E 0%, #8338EC 100%)",
                        border: "none",
                        padding: "40px 20px",
                        textAlign: "center"
                    }}
                >
                    <Title level={2} style={{ color: "white", marginBottom: 16 }}>
                        {language === "en" ? "Ready to start shopping?" : "ត្រៀមខ្លួនរួចរាល់ហើយឬនៅ?"}
                    </Title>
                    <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, display: "block", marginBottom: 32 }}>
                        {language === "en"
                            ? "Explore thousands of products with free shipping across Cambodia."
                            : "ស្វែងរកផលិតផលរាប់ពាន់មុខ ជាមួយនឹងការដឹកជញ្ជូនឥតគិតថ្លៃទូទាំងប្រទេសកម្ពុជា។"}
                    </Text>
                    <Space size={16}>
                        <a href="#/shop" style={{
                            background: "white", color: "#FF006E", padding: "12px 32px",
                            borderRadius: 12, fontWeight: 700, textDecoration: "none",
                            boxShadow: "0 8px 16px rgba(0,0,0,0.1)"
                        }}>
                            {language === "en" ? "Shop Now" : "ទិញឥឡូវនេះ"}
                        </a>
                    </Space>
                </Card>
            </div>
        </ShopLayout>
    );
};