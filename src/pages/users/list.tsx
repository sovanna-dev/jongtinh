import { List, useTable, EmailField, EditButton } from "@refinedev/antd";
import { Table, Space, Tag, Avatar } from "antd";
import { IUser } from "../../interfaces";
import { UserOutlined } from "@ant-design/icons";

export const UserList = () => {
    const { tableProps } = useTable<IUser>();

    return (
        <List>
            <Table {...tableProps} rowKey="id">
                <Table.Column
                    dataIndex="photoUrl"
                    title="Avatar"
                    render={(value: string) => (
                        <Avatar src={value} icon={<UserOutlined />} />
                    )}
                />
                <Table.Column dataIndex="displayName" title="Full Name" />
                <Table.Column
                    dataIndex="email"
                    title="Email"
                    render={(value: string) => <EmailField value={value} />}
                />
                <Table.Column
                    dataIndex="isAdmin"
                    title="Role"
                    render={(value: boolean) => (
                        <Tag color={value ? "red" : "blue"}>
                            {value ? "Admin" : "User"}
                        </Tag>
                    )}
                />
                <Table.Column
                    dataIndex="createdAt"
                    title="Joined At"
                    render={(value: number) => value ? new Date(value).toLocaleDateString() : "-"}
                />
                <Table.Column
                    title="Actions"
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