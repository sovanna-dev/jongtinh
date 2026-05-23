import React, { useEffect, useState } from "react";
import { Typography, Collapse, Button, Space, Card, Tag, Input, Empty } from "antd";
import { LikeOutlined, DislikeOutlined, SearchOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { ShopLayout } from "./ShopLayout";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../../firebase";
import { IFaq } from "../../interfaces";

const { Title, Text } = Typography;
const { Panel } = Collapse;

export const FaqPage: React.FC = () => {
    const [faqs, setFaqs] = useState<IFaq[]>([]);
    const [filteredFaqs, setFilteredFaqs] = useState<IFaq[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [votedIds, setVotedIds] = useState<string[]>([]);

    useEffect(() => {
        const q = query(collection(db, "faqs"), orderBy("order", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as IFaq));
            setFaqs(data);
            setFilteredFaqs(data);
        });

        const storedVotes = localStorage.getItem("faq_votes");
        if (storedVotes) {
            setVotedIds(JSON.parse(storedVotes));
        }

        return () => unsubscribe();
    }, []);

    const handleSearch = (value: string) => {
        setSearchQuery(value);
        const filtered = faqs.filter(faq =>
            faq.question.toLowerCase().includes(value.toLowerCase()) ||
            faq.answer.toLowerCase().includes(value.toLowerCase()) ||
            faq.category?.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredFaqs(filtered);
    };

    const handleFeedback = async (faqId: string, isHelpful: Boolean) => {
        if (votedIds.includes(faqId)) return;

        try {
            const faqRef = doc(db, "faqs", faqId);
            await updateDoc(faqRef, {
                [isHelpful ? "helpfulCount" : "unhelpfulCount"]: increment(1)
            });

            const newVotedIds = [...votedIds, faqId];
            setVotedIds(newVotedIds);
            localStorage.setItem("faq_votes", JSON.stringify(newVotedIds));
        } catch (error) {
            console.error("Error updating FAQ feedback:", error);
        }
    };

    return (
        <ShopLayout
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearch={() => handleSearch(searchQuery)}
        >
            <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 0" }}>
                <div style={{ textAlign: "center", marginBottom: 48 }}>
                    <QuestionCircleOutlined style={{ fontSize: 48, color: "#FF006E", marginBottom: 16 }} />
                    <Title level={2}>Frequently Asked Questions</Title>
                    <Text type="secondary" style={{ fontSize: 16 }}>
                        Find answers to common questions about our services, shipping, and more.
                    </Text>
                </div>

                <div style={{ marginBottom: 32 }}>
                    <Input
                        placeholder="Search for questions..."
                        prefix={<SearchOutlined style={{ color: "#FF006E" }} />}
                        size="large"
                        onChange={(e) => handleSearch(e.target.value)}
                        style={{ borderRadius: 12, height: 54 }}
                        allowClear
                    />
                </div>

                {filteredFaqs.length > 0 ? (
                    <Collapse
                        accordion
                        expandIconPosition="end"
                        style={{ background: "transparent", border: "none" }}
                    >
                        {filteredFaqs.map((faq) => (
                            <Panel
                                header={
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <Tag color="blue" style={{ borderRadius: 4 }}>{faq.category || "General"}</Tag>
                                        <Text strong style={{ fontSize: 16 }}>{faq.question}</Text>
                                    </div>
                                }
                                key={faq.id}
                                style={{
                                    marginBottom: 16,
                                    background: "white",
                                    borderRadius: 12,
                                    border: "1px solid #f0f0f0",
                                    overflow: "hidden"
                                }}
                            >
                                <div style={{ padding: "8px 0" }}>
                                    <Text style={{ fontSize: 15, lineHeight: 1.8 }}>{faq.answer}</Text>

                                    <div style={{
                                        marginTop: 24,
                                        paddingTop: 16,
                                        borderTop: "1px solid #f0f0f0",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center"
                                    }}>
                                        <Text type="secondary" style={{ fontSize: 13 }}>Was this helpful?</Text>
                                        <Space>
                                            <Button
                                                type={votedIds.includes(faq.id) ? "text" : "default"}
                                                icon={<LikeOutlined />}
                                                onClick={() => handleFeedback(faq.id, true)}
                                                disabled={votedIds.includes(faq.id)}
                                                style={{ borderRadius: 8 }}
                                            >
                                                Yes
                                            </Button>
                                            <Button
                                                type={votedIds.includes(faq.id) ? "text" : "default"}
                                                icon={<DislikeOutlined />}
                                                onClick={() => handleFeedback(faq.id, false)}
                                                disabled={votedIds.includes(faq.id)}
                                                style={{ borderRadius: 8 }}
                                            >
                                                No
                                            </Button>
                                        </Space>
                                    </div>
                                </div>
                            </Panel>
                        ))}
                    </Collapse>
                ) : (
                    <Empty description="No FAQs found matching your search." />
                )}

                <Card
                    style={{
                        marginTop: 64,
                        borderRadius: 16,
                        background: "linear-gradient(135deg, #FF006E 0%, #8338EC 100%)",
                        border: "none",
                        textAlign: "center"
                    }}
                >
                    <Title level={3} style={{ color: "white", margin: 0 }}>Still have questions?</Title>
                    <Text style={{ color: "rgba(255,255,255,0.8)", display: "block", marginTop: 8, marginBottom: 24 }}>
                        Our support team is here to help you 24/7.
                    </Text>
                    <Button
                        size="large"
                        style={{ borderRadius: 12, fontWeight: 600, height: 48, padding: "0 32px" }}
                        onClick={() => window.location.hash = "#/shop/profile"} // Redirect to support tickets in profile
                    >
                        Contact Support
                    </Button>
                </Card>
            </div>
        </ShopLayout>
    );
};