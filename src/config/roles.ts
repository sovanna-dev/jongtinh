export type AdminRole = "super_admin" | "product_manager" | "order_manager" | "support_agent" | "viewer";

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
        label: "Viewer",
        color: "default",
        resources: [
            "dashboard",
        ],
        canCreate: false,
        canEdit: false,
        canDelete: false,
    },
};

export const getRoleConfig = (role?: AdminRole | string): RoleConfig => {
    return ROLE_CONFIG[role as AdminRole] || ROLE_CONFIG.viewer;
};

export const hasAccess = (role: AdminRole | string | undefined, resource: string): boolean => {
    const config = getRoleConfig(role as AdminRole);
    return config.resources.includes(resource);
};