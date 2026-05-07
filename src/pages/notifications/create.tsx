import { Create, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, Select, Radio } from "antd";
import { INotification, IUser } from "../../interfaces";

export const NotificationCreate = () => {
    const { formProps, saveButtonProps, onFinish, form } = useForm<INotification & { targetType: string }>();

    const { selectProps: userSelectProps } = useSelect<IUser>({
        resource: "users",
        optionLabel: "fullName",
    });

    const handleOnFinish = (values: any) => {
        const { targetType, ...rest } = values;
        onFinish({
            ...rest,
            userId: targetType === "all" ? "all" : values.userId,
            isRead: false,
            createdAt: Date.now(),
        });
    };

    return (
        <Create saveButtonProps={saveButtonProps}>
            <Form
                {...formProps}
                layout="vertical"
                onFinish={handleOnFinish}
                initialValues={{
                    type: "INFO",
                    targetType: "all",
                }}
            >
                <Form.Item
                    label="Target Audience"
                    name="targetType"
                    rules={[{ required: true }]}
                >
                    <Radio.Group>
                        <Radio value="all">Broadcast (All Users)</Radio>
                        <Radio value="specific">Specific User</Radio>
                    </Radio.Group>
                </Form.Item>

                <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) => prevValues.targetType !== currentValues.targetType}
                >
                    {({ getFieldValue }) =>
                        getFieldValue("targetType") === "specific" ? (
                            <Form.Item
                                label="Select User"
                                name="userId"
                                rules={[{ required: true, message: "Please select a user" }]}
                            >
                                <Select {...userSelectProps} placeholder="Search for a user" />
                            </Form.Item>
                        ) : null
                    }
                </Form.Item>

                <Form.Item
                    label="Notification Type"
                    name="type"
                    rules={[{ required: true }]}
                >
                    <Select>
                        <Select.Option value="INFO">Information</Select.Option>
                        <Select.Option value="ORDER">Order Update</Select.Option>
                        <Select.Option value="PROMO">Promotion</Select.Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    label="Title"
                    name="title"
                    rules={[{ required: true }]}
                >
                    <Input placeholder="e.g. Flash Sale Live!" />
                </Form.Item>

                <Form.Item
                    label="Message"
                    name="message"
                    rules={[{ required: true }]}
                >
                    <Input.TextArea rows={4} placeholder="Enter the notification content..." />
                </Form.Item>
            </Form>
        </Create>
    );
};
