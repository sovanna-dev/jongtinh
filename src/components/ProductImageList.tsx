import { Form, Button } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { CloudinaryUpload } from "./CloudinaryUpload";

/**
 * ProductImageList
 *
 * Replaces the plain URL <Input> Form.List in product create/edit forms.
 * Stores the same data shape: images: string[]
 * handleOnFinish in create.tsx and edit.tsx requires NO changes.
 *
 * Each slot:
 *  - Empty → shows CloudinaryUpload dragger
 *  - Has URL → shows image preview with a delete button
 *
 * The form field value is set via the Form.List `fields` mechanism,
 * keeping full compatibility with Ant Design form validation and
 * Refine's useForm.
 */
export const ProductImageList: React.FC = () => {
    const form = Form.useFormInstance();

    return (
        <Form.List name="images">
            {(fields, { add, remove }) => (
                <>
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 12,
                            marginBottom: 12,
                        }}
                    >
                        {fields.map(({ key, name }) => {
                            const url: string | undefined = form.getFieldValue(["images", name]);

                            return (
                                <div
                                    key={key}
                                    style={{
                                        width: 150,
                                        height: 150,
                                        position: "relative",
                                        border: "1px solid #d9d9d9",
                                        borderRadius: 8,
                                        overflow: "hidden",
                                        flexShrink: 0,
                                    }}
                                >
                                    {url ? (
                                        <>
                                            <img
                                                src={url}
                                                alt={`Product image ${name + 1}`}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "cover",
                                                }}
                                            />
                                            <Button
                                                danger
                                                icon={<DeleteOutlined />}
                                                size="small"
                                                onClick={() => remove(name)}
                                                style={{
                                                    position: "absolute",
                                                    top: 4,
                                                    right: 4,
                                                    opacity: 0.85,
                                                }}
                                            />
                                        </>
                                    ) : (
                                        <div style={{ width: "100%", height: "100%" }}>
                                            <CloudinaryUpload
                                                onUploadComplete={(uploadedUrl) => {
                                                    // Write the returned URL into this specific
                                                    // Form.List slot so the form holds string[]
                                                    form.setFieldValue(["images", name], uploadedUrl);
                                                    // Trigger re-render so the preview appears
                                                    form.validateFields([["images", name]]);
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Add new empty slot */}
                        <Button
                            type="dashed"
                            onClick={() => add("")}
                            style={{
                                width: 150,
                                height: 150,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                borderRadius: 8,
                            }}
                        >
                            <PlusOutlined style={{ fontSize: 24, marginBottom: 8 }} />
                            <span>Add Image</span>
                        </Button>
                    </div>
                </>
            )}
        </Form.List>
    );
};