export type AdminRole = "super_admin" | "product_manager" | "order_manager" | "support_agent" | "viewer";

export type UserRole = AdminRole | "customer";

export interface RoleConfig {
    label: string;
    color: string;
    resources: string[]; // Resource names that this role can access
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
}

export const ROLE_CONFIG: Record<AdminRole, RoleConfig> = {
    super_admin: {
        label: "Super Admin",
        color: "red",
        resources: [
            "dashboard",
            "products",
            "categories",
            "promotion_banners",
            "orders",
            "users",
            "support_tickets",
            "notifications",
            "faqs",
            "styles",
        ],
        canCreate: true,
        canEdit: true,
        canDelete: true,
    },
    product_manager: {
        label: "Product Manager",
        color: "blue",
        resources: [
            "dashboard",
            "products",
            "categories",
            "promotion_banners",
            "styles",
        ],
        canCreate: true,
        canEdit: true,
        canDelete: true,
    },
    order_manager: {
        label: "Order Manager",
        color: "green",
        resources: [
            "dashboard",
            "orders",
            "notifications",
        ],
        canCreate: true,
        canEdit: true,
        canDelete: false,
    },
    support_agent: {
        label: "Support Agent",
        color: "orange",
        resources: [
            "dashboard",
            "support_tickets",
            "faqs",
        ],
        canCreate: true,
        canEdit: true,
        canDelete: false,
    },
    viewer: {
        label: "Viewer (Admin)",
        color: "default",
        resources: ["dashboard"],
        canCreate: false,
        canEdit: false,
        canDelete: false,
    },
};

export const getRoleConfig = (role?: UserRole | string): RoleConfig | null => {
    if (role === "customer") return null;
    return ROLE_CONFIG[role as AdminRole] || null;
};

export const hasAccess = (role: UserRole | string | undefined, resource: string): boolean => {
    if (role === "customer") return false;
    const config = getRoleConfig(role as UserRole);
    return config ? config.resources.includes(resource) : false;
};