// src/interfaces.ts
export interface IPromotionBanner {
    id: string;
    title: string;
    subtitle: string;
    imageUrl: string;
    backgroundColor: string;
    actionUrl: string;
    isActive: boolean;
}

export interface ICategory {
    id: string;
    name: string;
    icon: string;
    productCount: number;
}

export interface IProduct {
    id: string;
    name: string;
    nameLowercase: string;
    description: string;
    price: number;
    discountPrice?: number;
    images: string[];
    category: string;
    barcode: string;
    rating: number;
    reviewCount: number;
    stockQuantity: number;
    isAvailable: boolean;
    colors: string[];
    createdAt: number;
    specifications: Record<string, string>;
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
    type: "INFO" | "ORDER" | "PROMO";
    isRead: boolean;
    createdAt: number;
}