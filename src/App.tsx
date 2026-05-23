import { Refine, Authenticated } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import { useNotificationProvider, ErrorComponent, ThemedLayout, ThemedTitle, AuthPage } from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";
import { HashRouter, Route, Routes, Outlet, Navigate } from "react-router";
import routerBindings, { UnsavedChangesNotifier, DocumentTitleHandler, CatchAllNavigate } from "@refinedev/react-router";
import { App as AntdApp, Spin } from "antd";
import { dataProvider, authProvider } from "./providers/firebaseProvider";
import { Header } from "./components/header";
import { ColorModeContextProvider } from "./contexts/color-mode";
import { RoleProvider, useRole } from "./contexts/RoleContext";
import { CartProvider } from "./contexts/CartContext";
import { CustomerAuthProvider } from "./contexts/CustomerAuthContext";

// Admin Pages
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
import { StyleList, StyleCreate, StyleEdit } from "./pages/styles";

// Shop Pages
import { ShopHomePage } from "./pages/shop/ShopHomePage";
import { ProductDetail } from "./pages/shop/ProductDetail";
import { CartPage } from "./pages/shop/CartPage";
import { CheckoutPage } from "./pages/shop/CheckoutPage";
import { OrderTracking } from "./pages/shop/OrderTracking";
import { OrdersPage } from "./pages/shop/OrdersPage";
import { ProfilePage } from "./pages/shop/ProfilePage";
import { SearchResultsPage } from "./pages/shop/SearchResultsPage";
import { FlashSalePage } from "./pages/shop/FlashSalePage";
import { FaqPage as ShopFaqPage } from "./pages/shop/FaqPage";

// ──────────────────────────────────────────────────────────────
// Redirect based on role
// ──────────────────────────────────────────────────────────────
const AuthenticatedRedirect = () => {
    const { hasAccess } = useRole();
    const canAccessAdmin = hasAccess("dashboard");
    return <Navigate to={canAccessAdmin ? "/admin" : "/shop"} replace />;
};

// ──────────────────────────────────────────────────────────────
// Guard for admin routes — blocks customers
// ──────────────────────────────────────────────────────────────
const AdminLayoutGuard = () => {
    const { hasAccess, loading } = useRole();

    if (loading) {
        return (
            <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
            }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!hasAccess("dashboard")) {
        return <Navigate to="/shop" replace />;
    }

    return (
        <ThemedLayout
            Header={() => <Header sticky />}
            Title={({ collapsed }) => (
                <ThemedTitle collapsed={collapsed} text="JongTinh Admin" />
            )}
        >
            <Outlet />
        </ThemedLayout>
    );
};

// ──────────────────────────────────────────────────────────────
// Main Admin Content
// ──────────────────────────────────────────────────────────────
function AppContent() {
    const { hasAccess, roleConfig, loading } = useRole();

    if (loading) {
        return null;
    }

    const allResources = [
        { name: "dashboard", list: "/admin", meta: { label: "Dashboard" } },
        { name: "promotion_banners", list: "/admin/promotion-banners", create: "/admin/promotion-banners/create", edit: "/admin/promotion-banners/edit/:id", meta: { canDelete: roleConfig.canDelete, label: "Promotion Banners" } },
        { name: "categories", list: "/admin/categories", create: "/admin/categories/create", edit: "/admin/categories/edit/:id", meta: { canDelete: roleConfig.canDelete, label: "Categories" } },
        { name: "products", list: "/admin/products", create: "/admin/products/create", edit: "/admin/products/edit/:id", meta: { canDelete: roleConfig.canDelete, label: "Products" } },
        { name: "orders", list: "/admin/orders", edit: "/admin/orders/edit/:id", meta: { canDelete: roleConfig.canDelete, label: "Orders" } },
        { name: "users", list: "/admin/users", edit: "/admin/users/edit/:id", meta: { label: "Users" } },
        { name: "support_tickets", list: "/admin/support-tickets", show: "/admin/support-tickets/show/:id", meta: { label: "Support Tickets" } },
        { name: "notifications", list: "/admin/notifications", create: "/admin/notifications/create", meta: { label: "Notifications" } },
        { name: "faqs", list: "/admin/faqs", create: "/admin/faqs/create", edit: "/admin/faqs/edit/:id", meta: { canDelete: roleConfig.canDelete, label: "FAQs" } },
        { name: "styles", list: "/admin/styles", create: "/admin/styles/create", edit: "/admin/styles/edit/:id", meta: { canDelete: roleConfig.canDelete, label: "Style Trends" } },
    ];

    const filteredResources = allResources.filter((r) => hasAccess(r.name));

    return (
        <Refine
            dataProvider={dataProvider()}
            authProvider={authProvider}
            notificationProvider={useNotificationProvider}
            routerProvider={routerBindings}
            resources={filteredResources}
            options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
            }}
        >
            <Routes>
                {/* ═══════ 1. SHOP ROUTES (Public) ═══════ */}
                <Route path="/shop" element={<ShopHomePage />} />
                <Route path="/shop/product/:id" element={<ProductDetail />} />
                <Route path="/shop/cart" element={<CartPage />} />
                <Route path="/shop/checkout" element={<CheckoutPage />} />
                <Route path="/shop/order/:id" element={<OrderTracking />} />
                <Route path="/shop/orders" element={<OrdersPage />} />
                <Route path="/shop/profile" element={<ProfilePage />} />
                <Route path="/shop/search" element={<SearchResultsPage />} />
                <Route path="/shop/flash-sale" element={<FlashSalePage />} />
                <Route path="/shop/faq" element={<ShopFaqPage />} />

                {/* ═══════ 2. ADMIN ROUTES (Protected) ═══════ */}
                <Route
                    element={
                        <Authenticated
                            key="auth-admin"
                            fallback={<CatchAllNavigate to="/login" />}
                        >
                            <AdminLayoutGuard />
                        </Authenticated>
                    }
                >
                    <Route path="/admin" element={<DashboardPage />} />
                    {hasAccess("promotion_banners") && (
                        <Route path="/admin/promotion-banners">
                            <Route index element={<BannerList />} />
                            {roleConfig.canCreate && <Route path="create" element={<BannerCreate />} />}
                            {roleConfig.canEdit && <Route path="edit/:id" element={<BannerEdit />} />}
                        </Route>
                    )}
                    {hasAccess("categories") && (
                        <Route path="/admin/categories">
                            <Route index element={<CategoryList />} />
                            {roleConfig.canCreate && <Route path="create" element={<CategoryCreate />} />}
                            {roleConfig.canEdit && <Route path="edit/:id" element={<CategoryEdit />} />}
                        </Route>
                    )}
                    {hasAccess("products") && (
                        <Route path="/admin/products">
                            <Route index element={<ProductList />} />
                            {roleConfig.canCreate && <Route path="create" element={<ProductCreate />} />}
                            {roleConfig.canEdit && <Route path="edit/:id" element={<ProductEdit />} />}
                        </Route>
                    )}
                    {hasAccess("orders") && (
                        <Route path="/admin/orders">
                            <Route index element={<OrderList />} />
                            {roleConfig.canEdit && <Route path="edit/:id" element={<OrderEdit />} />}
                        </Route>
                    )}
                    {hasAccess("users") && (
                        <Route path="/admin/users">
                            <Route index element={<UserList />} />
                            <Route path="edit/:id" element={<UserEdit />} />
                        </Route>
                    )}
                    {hasAccess("support_tickets") && (
                        <Route path="/admin/support-tickets">
                            <Route index element={<TicketList />} />
                            <Route path="show/:id" element={<TicketShow />} />
                        </Route>
                    )}
                    {hasAccess("faqs") && (
                        <Route path="/admin/faqs">
                            <Route index element={<FaqList />} />
                            {roleConfig.canCreate && <Route path="create" element={<FaqCreate />} />}
                            {roleConfig.canEdit && <Route path="edit/:id" element={<FaqEdit />} />}
                        </Route>
                    )}
                    {hasAccess("notifications") && (
                        <Route path="/admin/notifications">
                            <Route index element={<NotificationList />} />
                            {roleConfig.canCreate && <Route path="create" element={<NotificationCreate />} />}
                        </Route>
                    )}
                    {hasAccess("styles") && (
                        <Route path="/admin/styles">
                            <Route index element={<StyleList />} />
                            {roleConfig.canCreate && <Route path="create" element={<StyleCreate />} />}
                            {roleConfig.canEdit && <Route path="edit/:id" element={<StyleEdit />} />}
                        </Route>
                    )}
                </Route>

                {/* ═══════ 3. AUTH PAGES ═══════ */}
                <Route
                    element={
                        <Authenticated key="auth-pages" fallback={<Outlet />}>
                            <AuthenticatedRedirect />
                        </Authenticated>
                    }
                >
                    <Route path="/login" element={<AuthPage type="login" />} />
                    <Route path="/register" element={<AuthPage type="register" />} />
                    <Route path="/forgot-password" element={<AuthPage type="forgotPassword" />} />
                </Route>

                {/* ═══════ 4. ROOT & CATCH-ALL ═══════ */}
                <Route path="/" element={<Navigate to="/shop" replace />} />
                <Route path="*" element={<ErrorComponent />} />
            </Routes>
            <RefineKbar />
            <UnsavedChangesNotifier />
            <DocumentTitleHandler
                handler={({ resource }) => {
                    const siteName = "JongTinh";
                    if (resource?.meta?.label) {
                        return `${resource.meta.label} | ${siteName}`;
                    }
                    return `${siteName} — Online Shopping Cambodia`;
                }}
            />
        </Refine>
    );
}

// ──────────────────────────────────────────────────────────────
// Main App
// ──────────────────────────────────────────────────────────────
function App() {
    return (
        <HashRouter>
            <RefineKbarProvider>
                <ColorModeContextProvider>
                    <AntdApp>
                        <DevtoolsProvider>
                            <CustomerAuthProvider>
                                <CartProvider>
                                    <RoleProvider>
                                        <AppContent />
                                    </RoleProvider>
                                </CartProvider>
                            </CustomerAuthProvider>
                            <DevtoolsPanel />
                        </DevtoolsProvider>
                    </AntdApp>
                </ColorModeContextProvider>
            </RefineKbarProvider>
        </HashRouter>
    );
}

export default App;