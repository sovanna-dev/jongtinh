import { Create, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber } from "antd";

export const FaqCreate = () => {
    const { formProps, saveButtonProps, onFinish } = useForm();

    const handleOnFinish = (values: any) => {
        onFinish({
            ...values,
            order: values.order || 0,
        });
    };

    return (
        <Create saveButtonProps={saveButtonProps}>
            <Form
                {...formProps}
                layout="vertical"
                onFinish={handleOnFinish}
            >
                <Form.Item
                    label="Question"
                    name="question"
                    rules={[{ required: true }]}
                >
                    <Input placeholder="e.g. How do I track my order?" />
                </Form.Item>

                <Form.Item
                    label="Answer"
                    name="answer"
                    rules={[{ required: true }]}
                >
                    <Input.TextArea rows={4} placeholder="Enter the answer..." />
                </Form.Item>

                <Form.Item
                    label="Display Order"
                    name="order"
                    initialValue={0}
                >
                    <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
            </Form>
        </Create>
    );
};