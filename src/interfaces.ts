// src/interfaces.ts

export interface IPromotionBanner {
    id: string;
    title: string;
    subtitle: string;
    imageUrl: string;
    backgroundColor: string;
    actionUrl: string;
    isActive: boolean;
    createdAt?: number;
}

export interface ISubCategory {
    id: string;
    name: string;
}

export interface ICategory {
    id: string;
    name: string;
    icon: string;
    productCount: number;
    subCategories: ISubCategory[];
}

export interface IProductVariant {
    id: string;
    name: string; // e.g., "iPhone 15 - Blue - 256GB"
    attributes: Record<string, string>;
    price: number;
    stockQuantity: number;
    images: string[];
}

export interface IProductAttribute {
    key: string;
    label: string;
    value: string;
    displayType: "TEXT" | "CHIP" | "COLOR" | "DROPDOWN";
}

export interface IProductColor {
    name: string;
    hex: string;
    isSelected?: boolean;
}

export interface IProduct {
    id: string;
    name: string;
    nameLowercase: string;
    brandLowercase: string;
    description: string;
    price: number;
    discountPrice?: number;
    images: string[];
    category: string;
    subCategory?: string;
    brand?: string;
    barcode: string;
    rating: number;
    reviewCount: number;
    stockQuantity: number;
    isAvailable: boolean;
    colors: IProductColor[];
    createdAt: number;
    updatedAt: number;
    specifications: Record<string, string>;
    attributes: IProductAttribute[];
    filterTags: string[];
    isFeatured: boolean;
    variants?: IProductVariant[];
}

export type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPING" | "DELIVERED" | "CANCELLED";

export interface IAddress {
    fullName: string;
    phoneNumber: string;
    streetAddress: string;
    city: string;
    province: string;
    postalCode: string;
    additionalInfo: string;
}

export interface ICartItem {
    productId: string;
    productName: string;
    productImage: string;
    price: number;
    quantity: number;
    userId: string;
    totalPrice: number;
}

export interface ITrackingStep {
    id: string;
    title: string;
    description: string;
    completedAt?: number;
}

export interface IOrder {
    id: string;
    orderId: string;
    userId: string;
    items: ICartItem[];
    shippingAddress: IAddress;
    paymentMethod: string;
    subtotal: number;
    shippingCost: number;
    total: number;
    orderStatus: OrderStatus;
    createdAt: number;
    updatedAt: number;
    trackingSteps: ITrackingStep[];
}

export interface IUser {
    id: string;
    displayName: string;
    email: string;
    profileImage?: string;
    photoUrl?: string;
    isAdmin: boolean;
    role?: "super_admin" | "product_manager" | "order_manager" | "support_agent" | "viewer";
    phoneNumber?: string;
    createdAt?: number;
}

export interface ISupportTicket {
    id: string;
    userId: string;
    userName?: string;
    userEmail?: string;
    subject: string;
    message: string;
    category?: string;
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
    priority?: "LOW" | "MEDIUM" | "HIGH";
    orderId?: string;
    createdAt: number;
    updatedAt: number;
}

export interface ITicketReply {
    id: string;
    userId: string;
    message: string;
    isAdminReply: boolean;
    createdAt: number;
}

export interface INotification {
    id: string;
    userId: string;
    title: string;
    message: string;
    timestamp: number;         // Changed from 'createdAt' to match Android
    type: string;              // "order", "promo", "general" (match Android)
    isRead: boolean;
    destination?: string;      // Added
    destinationId?: string;    // Added
    imageUrl?: string;         // Added
    targetEmail?: string;      // Added
}

export interface IStyle {
    id: string;
    name: string;
    color: string;
    image: string;
    label: string;
    isActive: boolean;
    order?: number;
}
