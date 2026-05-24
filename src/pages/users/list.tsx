import { List, useTable, EmailField, EditButton } from "@refinedev/antd";
import { Table, Space, Tag, Avatar } from "antd";
import { IUser } from "../../interfaces";
import { UserOutlined } from "@ant-design/icons";
import { useLanguage } from "../../contexts/LanguageContext";

export const UserList = () => {
    const { t } = useLanguage();
    const { tableProps } = useTable<IUser>();

    return (
        <List title={t.admin.users.title}>
            <Table {...tableProps} rowKey="id">
                <Table.Column
                    dataIndex="photoUrl"
                    title={t.admin.users.avatar}
                    render={(value: string) => (
                        <Avatar src={value} icon={<UserOutlined />} />
                    )}
                />
                <Table.Column dataIndex="displayName" title={t.admin.users.fullName} />
                <Table.Column
                    dataIndex="email"
                    title={t.admin.users.email}
                    render={(value: string) => <EmailField value={value} />}
                />
                <Table.Column
                    dataIndex="isAdmin"
                    title={t.admin.users.role}
                    render={(value: boolean) => (
                        <Tag color={value ? "red" : "blue"}>
                            {value ? t.admin.users.admin : t.admin.users.user}
                        </Tag>
                    )}
                />
                <Table.Column
                    dataIndex="createdAt"
                    title={t.admin.users.joinedAt}
                    render={(value: number) => value ? new Date(value).toLocaleDateString() : "-"}
                />
                <Table.Column
                    title={t.admin.users.actions}
                    dataIndex="actions"
                    render={(_, record: IUser) => (
                        <Space>
                            <EditButton hideText size="small" recordItemId={record.id} />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
};