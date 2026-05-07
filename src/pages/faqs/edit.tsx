import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber } from "antd";

export const FaqEdit = () => {
    const { formProps, saveButtonProps, onFinish } = useForm();

    const handleOnFinish = (values: any) => {
        onFinish({
            ...values,
        });
    };

    return (
        <Edit saveButtonProps={saveButtonProps}>
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
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Answer"
                    name="answer"
                    rules={[{ required: true }]}
                >
                    <Input.TextArea rows={4} />
                </Form.Item>

                <Form.Item
                    label="Display Order"
                    name="order"
                >
                    <InputNumber min={0} style={{ width: "100%" }} />
                </Form.Item>
            </Form>
        </Edit>
    );
};