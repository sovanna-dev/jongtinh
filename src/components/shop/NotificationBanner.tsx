import React from "react";
import { Button, Typography } from "antd";
import { BellOutlined, CloseOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { INotification } from "../../interfaces";

const { Title, Text } = Typography;

interface NotificationBannerProps {
    notifications: INotification[];
    dismissedIds: string[];
    onDismiss: (id: string) => void;
    isDark: boolean;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
    notifications, dismissedIds, onDismiss, isDark,
}) => {
    const navigate = useNavigate();

    const visibleNotifications = notifications.filter(
        n => !dismissedIds.includes(n.id) && !n.isRead
    );

    if (visibleNotifications.length === 0) return null;

    const handleClick = async (notification: INotification) => {
        await updateDoc(doc(db, "notifications", notification.id), { isRead: true });

        if (notification.destination === "product" && notification.destinationId) {
            navigate(`/shop/product/${notification.destinationId}`);
        } else if (notification.destination === "order" && notification.destinationId) {
            navigate(`/shop/order/${notification.destinationId}`);
        } else {
            navigate("/shop/orders");
        }
    };

    return (
        <div style={{ marginBottom: 32 }}>
            {visibleNotifications.slice(0, 3).map((notification) => (
                <div
                    key={notification.id}
                    onClick={() => handleClick(notification)}
                    style={{
                        display: "flex", alignItems: "center", gap: 16,
                        padding: "16px 20px", marginBottom: 8, borderRadius: 16,
                        cursor: "pointer",
                        background: isDark
                            ? "linear-gradient(135deg, rgba(255,0,110,0.15), rgba(131,56,236,0.15))"
                            : "linear-gradient(135deg, #fff0f6, #f9f0ff)",
                        border: "1px solid",
                        borderColor: isDark ? "rgba(255,0,110,0.3)" : "rgba(255,0,110,0.15)",
                        transition: "all 0.3s ease",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    }}
                >
                    <div style={{
                        width: 48, height: 48, borderRadius: 14, display: "flex",
                        alignItems: "center", justifyContent: "center", flexShrink: 0,
                        background: notification.type === "order"
                            ? "linear-gradient(135deg, #3A86FF, #8338EC)"
                            : notification.type === "promo"
                            ? "linear-gradient(135deg, #FFBE0B, #FB5607)"
                            : "linear-gradient(135deg, #FF006E, #8338EC)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}>
                        <BellOutlined style={{ color: "#fff", fontSize: 22 }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <Text strong style={{ fontSize: 15, display: "block", marginBottom: 2, color: isDark ? "#fff" : "#1a1a1a" }}>
                            {notification.title}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 13, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {notification.message}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: "block" }}>
                            {new Date(notification.timestamp).toLocaleDateString("en-US", {
                                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                            })}
                        </Text>
                    </div>

                    <Button
                        type="text"
                        size="small"
                        icon={<CloseOutlined style={{ fontSize: 14 }} />}
                        onClick={(e) => { e.stopPropagation(); onDismiss(notification.id); }}
                        style={{ flexShrink: 0, color: isDark ? "#999" : "#666" }}
                    />
                </div>
            ))}
        </div>
    );
};