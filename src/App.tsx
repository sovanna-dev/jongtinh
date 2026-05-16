import { Refine, Authenticated } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import {
    useNotificationProvider,
    ErrorComponent,
    ThemedLayout,
    ThemedTitle,
    AuthPage
} from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";
import { HashRouter, Route, Routes, Outlet, Navigate } from "react-router";
import routerBindings, {
    UnsavedChangesNotifier,
    DocumentTitleHandler,
    CatchAllNavigate
} from "@refinedev/react-router";
import { App as AntdApp } from "antd";
import { dataProvider, authProvider } from "./providers/firebaseProvider";
import { Header } from "./components/header";
import { ColorModeContextProvider } from "./contexts/color-mode";
import { RoleProvider, useRole } from "./contexts/RoleContext";
import { useState } from "react";
import { IProduct } from "./interfaces";
import { CartProvider } from "./contexts/CartContext";

// ═══════════════════════════════════════════════════
// ADMIN PAGES
// ═══════════════════════════════════════════════════
import { BannerList } from "./pages/promotion-banners/list";
import { BannerCreate } from "./pages/promotion-banners/create";
import { BannerEdit } from "./pages/promotion-banners/edit";
import { CategoryList } from "./pages/categories/list";
import { CategoryCreate } from "./pages/categories/create";
import { CategoryEdit } from "./pages/categories/edit";
import { ProductList } from "./pages/products/list";
import { ProductCreate } from "./pages/products/create";
import { ProductEdit } from "./pages/products/edit";
import { OrderList } from "./pages/orders/list";
import { OrderEdit } from "./pages/orders/edit";
import { UserList } from "./pages/users/list";
import { UserEdit } from "./pages/users/edit";
import { TicketList } from "./pages/support-tickets/list";
import { TicketShow } from "./pages/support-tickets/show";
import { NotificationList } from "./pages/notifications/list";
import { NotificationCreate } from "./pages/notifications/create";
import { DashboardPage } from "./pages/dashboard";
import { FaqList } from "./pages/faqs/list";
import { FaqCreate } from "./pages/faqs/create";
import { FaqEdit } from "./pages/faqs/edit";

// ═══════════════════════════════════════════════════
// SHOP PAGES
// ═══════════════════════════════════════════════════
import { ShopHomePage } from "./pages/shop/HomePage";
import { ProductDetail } from "./pages/shop/ProductDetail";
import { CartPage } from "./pages/shop/CartPage";
import { CheckoutPage } from "./pages/shop/CheckoutPage";
import { OrderTracking } from "./pages/shop/OrderTracking";
import { OrdersPage } from "./pages/shop/OrdersPage";
import { ProfilePage } from "./pages/shop/ProfilePage";
import { SearchResultsPage } from "./pages/shop/SearchResultsPage";

interface CartItem {
    product: IProduct;
    quantity: number;
}

// ═══════════════════════════════════════════════════
// ADMIN ROUTES (Login Required)
// ═══════════════════════════════════════════════════
function AppContent() {
    const { hasAccess, roleConfig } = useRole();

    const allResources = [
        { name: "dashboard", list: "/admin", meta: { label: "Dashboard" } },
        {
            name: "promotion_banners", list: "/admin/promotion-banners",
            create: "/admin/promotion-banners/create", edit: "/admin/promotion-banners/edit/:id",
            meta: { canDelete: roleConfig.canDelete, label: "Promotion Banners" },
        },
        {
            name: "categories", list: "/admin/categories",
            create: "/admin/categories/create", edit: "/admin/categories/edit/:id",
            meta: { canDelete: roleConfig.canDelete, label: "Categories" },
        },
        {
            name: "products", list: "/admin/products",
            create: "/admin/products/create", edit: "/admin/products/edit/:id",
            meta: { canDelete: roleConfig.canDelete, label: "Products" },
        },
        {
            name: "orders", list: "/admin/orders", edit: "/admin/orders/edit/:id",
            meta: { canDelete: roleConfig.canDelete, label: "Orders" },
        },
        {
            name: "users", list: "/admin/users", edit: "/admin/users/edit/:id",
            meta: { label: "Users" },
        },
        {
            name: "support_tickets", list: "/admin/support-tickets",
            show: "/admin/support-tickets/show/:id",
            meta: { label: "Support Tickets" },
        },
        {
            name: "notifications", list: "/admin/notifications",
            create: "/admin/notifications/create",
            meta: { label: "Notifications" },
        },
        {
            name: "faqs", list: "/admin/faqs",
            create: "/admin/faqs/create", edit: "/admin/faqs/edit/:id",
            meta: { canDelete: roleConfig.canDelete, label: "FAQs" },
        },
    ];

    const filteredResources = allResources.filter((r) => hasAccess(r.name));

    return (
        <Refine
            dataProvider={dataProvider()}
            authProvider={authProvider}
            notificationProvider={useNotificationProvider}
            routerProvider={routerBindings}
            resources={filteredResources}
            options={{ syncWithLocation: true, warnWhenUnsavedChanges: true }}
        >
            <Routes>
                {/* ═══════════════════════════════════════════════════ */}
                {/* SHOP ROUTES (Public — No Login Required) */}
                {/* ═══════════════════════════════════════════════════ */}
                <Route path="/" element={<Navigate to="/shop" replace />} />
                <Route path="/shop" element={<ShopHomePage />} />
                <Route path="/shop/product/:id" element={<ProductDetail />} />
                <Route path="/shop/cart" element={<CartPage />} />
                <Route path="/shop/checkout" element={<CheckoutPage />} />
                <Route path="/shop/order/:id" element={<OrderTracking />} />
                <Route path="/shop/orders" element={<OrdersPage />} />
                <Route path="/shop/profile" element={<ProfilePage />} />
                <Route path="/shop/search" element={<SearchResultsPage />} />

                {/* ═══════════════════════════════════════════════════ */}
                {/* ADMIN ROUTES (Login Required) */}
                {/* ═══════════════════════════════════════════════════ */}
                <Route
                    element={
                        <Authenticated key="authenticated-inner" fallback={<CatchAllNavigate to="/login" />}>
                            <ThemedLayout
                                Header={() => <Header sticky />}
                                Title={({ collapsed }) => (
                                    <ThemedTitle collapsed={collapsed} text="JongTinh Admin" />
                                )}
                            >
                                <Outlet />
                            </ThemedLayout>
                        </Authenticated>
                    }
                >
                    {/* Admin Dashboard */}
                    <Route path="/admin" element={<DashboardPage />} />

                    {/* Promotion Banners */}
                    {hasAccess("promotion_banners") && (
                        <Route path="/admin/promotion-banners">
                            <Route index element={<BannerList />} />
                            {roleConfig.canCreate && <Route path="create" element={<BannerCreate />} />}
                            {roleConfig.canEdit && <Route path="edit/:id" element={<BannerEdit />} />}
                        </Route>
                    )}

                    {/* Categories */}
                    {hasAccess("categories") && (
                        <Route path="/admin/categories">
                            <Route index element={<CategoryList />} />
                            {roleConfig.canCreate && <Route path="create" element={<CategoryCreate />} />}
                            {roleConfig.canEdit && <Route path="edit/:id" element={<CategoryEdit />} />}
                        </Route>
                    )}

                    {/* Products */}
                    {hasAccess("products") && (
                        <Route path="/admin/products">
                            <Route index element={<ProductList />} />
                            {roleConfig.canCreate && <Route path="create" element={<ProductCreate />} />}
                            {roleConfig.canEdit && <Route path="edit/:id" element={<ProductEdit />} />}
                        </Route>
                    )}

                    {/* Orders */}
                    {hasAccess("orders") && (
                        <Route path="/admin/orders">
                            <Route index element={<OrderList />} />
                            {roleConfig.canEdit && <Route path="edit/:id" element={<OrderEdit />} />}
                        </Route>
                    )}

                    {/* Users */}
                    {hasAccess("users") && (
                        <Route path="/admin/users">
                            <Route index element={<UserList />} />
                            <Route path="edit/:id" element={<UserEdit />} />
                        </Route>
                    )}

                    {/* Support Tickets */}
                    {hasAccess("support_tickets") && (
                        <Route path="/admin/support-tickets">
                            <Route index element={<TicketList />} />
                            <Route path="show/:id" element={<TicketShow />} />
                        </Route>
                    )}

                    {/* FAQs */}
                    {hasAccess("faqs") && (
                        <Route path="/admin/faqs">
                            <Route index element={<FaqList />} />
                            {roleConfig.canCreate && <Route path="create" element={<FaqCreate />} />}
                            {roleConfig.canEdit && <Route path="edit/:id" element={<FaqEdit />} />}
                        </Route>
                    )}

                    {/* Notifications */}
                    {hasAccess("notifications") && (
                        <Route path="/admin/notifications">
                            <Route index element={<NotificationList />} />
                            {roleConfig.canCreate && <Route path="create" element={<NotificationCreate />} />}
                        </Route>
                    )}
                </Route>

                {/* Login Routes */}
                <Route element={<Authenticated key="authenticated-outer" fallback={<Outlet />}><Navigate to="/admin" /></Authenticated>}>
                    <Route path="/login" element={<AuthPage type="login" />} />
                    <Route path="/register" element={<AuthPage type="register" />} />
                    <Route path="/forgot-password" element={<AuthPage type="forgotPassword" />} />
                </Route>

                {/* Error Route */}
                <Route element={<Authenticated key="authenticated-auth"><ThemedLayout Header={() => <Header sticky />} Title={({ collapsed }) => (<ThemedTitle collapsed={collapsed} text="JongTinh Admin" />)}><Outlet /></ThemedLayout></Authenticated>}>
                    <Route path="*" element={<ErrorComponent />} />
                </Route>
            </Routes>
            <RefineKbar />
            <UnsavedChangesNotifier />
            <DocumentTitleHandler />
        </Refine>
    );
}

// ═══════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════
function App() {
    return (
        <HashRouter>
            <RefineKbarProvider>
                <ColorModeContextProvider>
                    <AntdApp>
                        <DevtoolsProvider>
                            <RoleProvider>
                                <CartProvider>
                                    <AppContent />
                                </CartProvider>
                            </RoleProvider>
                            <DevtoolsPanel />
                        </DevtoolsProvider>
                    </AntdApp>
                </ColorModeContextProvider>
            </RefineKbarProvider>
        </HashRouter>
    );
}

export default App;