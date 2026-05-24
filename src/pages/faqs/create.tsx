import { Create, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, Select } from "antd";
import { useLanguage } from "../../contexts/LanguageContext";

export const FaqCreate = () => {
    const { t } = useLanguage();
    const { formProps, saveButtonProps, onFinish } = useForm();

    const handleOnFinish = (values: any) => {
        onFinish({
            ...values,
            order: values.order || 0,
        });
    };

    return (
        <Create saveButtonProps={saveButtonProps} title={t.adminFaq.title}>
            <Form
                {...formProps}
                layout="vertical"
                onFinish={handleOnFinish}
            >
                <Form.Item
                    label={t.adminFaq.question}
                    name="question"
                    rules={[{ required: true, message: t.adminFaq.validation.questionRequired }]}
                >
                    <Input placeholder="e.g. How do I track my order?" />
                </Form.Item>

                <Form.Item
                    label={t.adminFaq.answer}
                    name="answer"
                    rules={[{ required: true, message: t.adminFaq.validation.answerRequired }]}
                >
                    <Input.TextArea rows={4} placeholder="Enter the answer..." />
                </Form.Item>

                <Form.Item
                    label={t.tickets.category}
                    name="category"
                    rules={[{ required: true, message: t.adminFaq.validation.categoryRequired }]}
                >
                    <Select
                        showSearch
                        allowClear
                        placeholder="Select or type category"
                        options={[
                            { label: t.faq.general, value: "General" },
                            { label: "Orders", value: "Orders" },
                            { label: "Payment", value: "Payment" },
                            { label: "Shipping", value: "Shipping" },
                            { label: "Returns", value: "Returns" },
                        ]}
                    />
                </Form.Item>

                <Form.Item
                    label={t.adminFaq.order}
                    name="order"
                    initialValue={0}
                >
                    <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
            </Form>
        </Create>
    );
};