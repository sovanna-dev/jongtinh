import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, Select } from "antd";
import { useLanguage } from "../../contexts/LanguageContext";

export const FaqEdit = () => {
    const { t } = useLanguage();
    const { formProps, saveButtonProps, onFinish } = useForm();

    const handleOnFinish = (values: any) => {
        onFinish({
            ...values,
            order: values.order || 0,
        });
    };

    return (
        <Edit saveButtonProps={saveButtonProps} title={t.admin.adminFaq.title}>
            <Form
                {...formProps}
                layout="vertical"
                onFinish={handleOnFinish}
            >
                <Form.Item
                    label={t.admin.adminFaq.question}
                    name="question"
                    rules={[{ required: true, message: t.admin.adminFaq.validation.questionRequired }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label={t.admin.adminFaq.answer}
                    name="answer"
                    rules={[{ required: true, message: t.admin.adminFaq.validation.answerRequired }]}
                >
                    <Input.TextArea rows={4} />
                </Form.Item>

                <Form.Item
                    label={t.tickets.category}
                    name="category"
                    rules={[{ required: true, message: t.admin.adminFaq.validation.categoryRequired }]}
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
                    label={t.admin.adminFaq.order}
                    name="order"
                >
                    <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
            </Form>
        </Edit>
    );
};