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

// Shop Pages
import { ShopHomePage } from "./pages/shop/HomePage";
import { ProductDetail } from "./pages/shop/ProductDetail";
import { CartPage } from "./pages/shop/CartPage";
import { CheckoutPage } from "./pages/shop/CheckoutPage";
import { OrderTracking } from "./pages/shop/OrderTracking";
import { OrdersPage } from "./pages/shop/OrdersPage";
import { ProfilePage } from "./pages/shop/ProfilePage";

interface CartItem {
    product: IProduct;
    quantity: number;
}

function ShopRoutes() {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <Routes>
            <Route path="/shop" element={<ShopHomePage />} />
            <Route path="/shop/product/:id" element={<ProductDetail cart={cart} setCart={setCart} />} />
            <Route path="/shop/cart" element={<CartPage cart={cart} setCart={setCart} />} />
            <Route path="/shop/checkout" element={<CheckoutPage cart={cart} setCart={setCart} />} />
            <Route path="/shop/order/:id" element={<OrderTracking cart={cart} setCart={setCart} />} />

            <Route path="/shop/orders" element={<OrdersPage cart={cart} setCart={setCart} />} />
            <Route path="/shop/profile" element={<ProfilePage cart={cart} setCart={setCart} />} />

        </Routes>
    );
}

function AppContent() {
    const { hasAccess, roleConfig } = useRole();

    const allResources = [
        { name: "dashboard", list: "/", meta: { label: "Dashboard" } },
        {
            name: "promotion_banners", list: "/promotion-banners",
            create: "/promotion-banners/create", edit: "/promotion-banners/edit/:id",
            meta: { canDelete: roleConfig.canDelete, label: "Promotion Banners" },
        },
        {
            name: "categories", list: "/categories",
            create: "/categories/create", edit: "/categories/edit/:id",
            meta: { canDelete: roleConfig.canDelete, label: "Categories" },
        },
        {
            name: "products", list: "/products",
            create: "/products/create", edit: "/products/edit/:id",
            meta: { canDelete: roleConfig.canDelete, label: "Products" },
        },
        {
            name: "orders", list: "/orders", edit: "/orders/edit/:id",
            meta: { canDelete: roleConfig.canDelete, label: "Orders" },
        },
        {
            name: "users", list: "/users", edit: "/users/edit/:id",
            meta: { label: "Users" },
        },
        {
            name: "support_tickets", list: "/support-tickets",
            show: "/support-tickets/show/:id",
            meta: { label: "Support Tickets" },
        },
        {
            name: "notifications", list: "/notifications",
            create: "/notifications/create",
            meta: { label: "Notifications" },
        },
        {
            name: "faqs", list: "/faqs",
            create: "/faqs/create", edit: "/faqs/edit/:id",
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
                <Route
                    element={
                        <Authenticated key="authenticated-inner" fallback={<CatchAllNavigate to="/login" />}>
                            <ThemedLayout
                                Header={() => <Header sticky />}
                                Title={({ collapsed }) => (
                                    <ThemedTitle collapsed={collapsed} text="SmartShop Admin" />
                                )}
                            >
                                <Outlet />
                            </ThemedLayout>
                        </Authenticated>
                    }
                >
                    <Route index element={<DashboardPage />} />
                    {hasAccess("promotion_banners") && (
                        <Route path="/promotion-banners">
                            <Route index element={<BannerList />} />
                            {roleConfig.canCreate && <Route path="create" element={<BannerCreate />} />}
                            {roleConfig.canEdit && <Route path="edit/:id" element={<BannerEdit />} />}
                        </Route>
                    )}
                    {hasAccess("categories") && (
                        <Route path="/categories">
                            <Route index element={<CategoryList />} />
                            {roleConfig.canCreate && <Route path="create" element={<CategoryCreate />} />}
                            {roleConfig.canEdit && <Route path="edit/:id" element={<CategoryEdit />} />}
                        </Route>
                    )}
                    {hasAccess("products") && (
                        <Route path="/products">
                            <Route index element={<ProductList />} />
                            {roleConfig.canCreate && <Route path="create" element={<ProductCreate />} />}
                            {roleConfig.canEdit && <Route path="edit/:id" element={<ProductEdit />} />}
                        </Route>
                    )}
                    {hasAccess("orders") && (
                        <Route path="/orders">
                            <Route index element={<OrderList />} />
                            {roleConfig.canEdit && <Route path="edit/:id" element={<OrderEdit />} />}
                        </Route>
                    )}
                    {hasAccess("users") && (
                        <Route path="/users">
                            <Route index element={<UserList />} />
                            <Route path="edit/:id" element={<UserEdit />} />
                        </Route>
                    )}
                    {hasAccess("support_tickets") && (
                        <Route path="/support-tickets">
                            <Route index element={<TicketList />} />
                            <Route path="show/:id" element={<TicketShow />} />
                        </Route>
                    )}
                    {hasAccess("faqs") && (
                        <Route path="/faqs">
                            <Route index element={<FaqList />} />
                            {roleConfig.canCreate && <Route path="create" element={<FaqCreate />} />}
                            {roleConfig.canEdit && <Route path="edit/:id" element={<FaqEdit />} />}
                        </Route>
                    )}
                    {hasAccess("notifications") && (
                        <Route path="/notifications">
                            <Route index element={<NotificationList />} />
                            {roleConfig.canCreate && <Route path="create" element={<NotificationCreate />} />}
                        </Route>
                    )}
                </Route>
                <Route element={<Authenticated key="authenticated-outer" fallback={<Outlet />}><Navigate to="/" /></Authenticated>}>
                    <Route path="/login" element={<AuthPage type="login" />} />
                    <Route path="/register" element={<AuthPage type="register" />} />
                    <Route path="/forgot-password" element={<AuthPage type="forgotPassword" />} />
                </Route>
                <Route element={<Authenticated key="authenticated-auth"><ThemedLayout Header={() => <Header sticky />} Title={({ collapsed }) => (<ThemedTitle collapsed={collapsed} text="SmartShop Admin" />)}><Outlet /></ThemedLayout></Authenticated>}>
                    <Route path="*" element={<ErrorComponent />} />
                </Route>
            </Routes>
            <RefineKbar />
            <UnsavedChangesNotifier />
            <DocumentTitleHandler />
        </Refine>
    );
}

function App() {
    return (
        <HashRouter>
            <RefineKbarProvider>
                <ColorModeContextProvider>
                    <AntdApp>
                        <DevtoolsProvider>
                            <RoleProvider>
                                {/* Shop routes OUTSIDE Refine — public, no auth needed */}
                                <ShopRoutes />
                                <AppContent />
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