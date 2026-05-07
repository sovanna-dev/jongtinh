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

// Banners
import { BannerList } from "./pages/promotion-banners/list";
import { BannerCreate } from "./pages/promotion-banners/create";
import { BannerEdit } from "./pages/promotion-banners/edit";

// Categories
import { CategoryList } from "./pages/categories/list";
import { CategoryCreate } from "./pages/categories/create";
import { CategoryEdit } from "./pages/categories/edit";

// Products
import { ProductList } from "./pages/products/list";
import { ProductCreate } from "./pages/products/create";
import { ProductEdit } from "./pages/products/edit";

// Orders
import { OrderList } from "./pages/orders/list";
import { OrderEdit } from "./pages/orders/edit";

// Users
import { UserList } from "./pages/users/list";
import { UserEdit } from "./pages/users/edit";

// Support Tickets
import { TicketList } from "./pages/support-tickets/list";
import { TicketShow } from "./pages/support-tickets/show";

// Notifications
import { NotificationList } from "./pages/notifications/list";
import { NotificationCreate } from "./pages/notifications/create";

// Dashboard
import { DashboardPage } from "./pages/dashboard";

// FAQs
import { FaqList } from "./pages/faqs/list";
import { FaqCreate } from "./pages/faqs/create";
import { FaqEdit } from "./pages/faqs/edit";

function App() {
  return (
    <HashRouter>
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <AntdApp>
            <DevtoolsProvider>
              <Refine
                dataProvider={dataProvider()}
                authProvider={authProvider}
                notificationProvider={useNotificationProvider}
                routerProvider={routerBindings}
                resources={[
                {
                    name: "dashboard",
                    list: "/",
                    meta: {
                        label: "Dashboard",
                    },
                },
                {
                  name: "promotion_banners",
                  list: "/promotion-banners",
                  create: "/promotion-banners/create",
                  edit: "/promotion-banners/edit/:id",
                  meta: {
                    canDelete: true,
                    label: "Promotion Banners"
                  },
                },
                {
                    name: "categories",
                    list: "/categories",
                    create: "/categories/create",
                    edit: "/categories/edit/:id",
                    meta: {
                      canDelete: true,
                      label: "Categories"
                    },
                },
                {
                    name: "products",
                    list: "/products",
                    create: "/products/create",
                    edit: "/products/edit/:id",
                    meta: {
                      canDelete: true,
                      label: "Products"
                    },
                },
                {
                    name: "orders",
                    list: "/orders",
                    edit: "/orders/edit/:id",
                    meta: {
                      canDelete: true,
                      label: "Orders"
                    },
                },
                {
                    name: "users",
                    list: "/users",
                    edit: "/users/edit/:id",
                    meta: {
                        label: "Users",
                    },
                },
                {
                    name: "support_tickets",
                    list: "/support-tickets",
                    show: "/support-tickets/show/:id",
                    meta: {
                        label: "Support Tickets",
                    },
                },
                {
                    name: "notifications",
                    list: "/notifications",
                    create: "/notifications/create",
                    meta: {
                        label: "Notifications",
                    },
                },
                {
                    name: "faqs",
                    list: "/faqs",
                    create: "/faqs/create",
                    edit: "/faqs/edit/:id",
                    meta: {
                        canDelete: true,
                        label: "FAQs"
                    },
                },
              ]}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
              }}
            >
              <Routes>
                <Route
                  element={
                    <Authenticated
                        key="authenticated-inner"
                        fallback={<CatchAllNavigate to="/login" />}
                    >
                        <ThemedLayout
                            Header={() => <Header sticky />}
                            Title={({ collapsed }: { collapsed: boolean }) => (
                                <ThemedTitle
                                    collapsed={collapsed}
                                    text="SmartShop Admin"
                                />
                            )}
                        >
                            <Outlet />
                        </ThemedLayout>
                    </Authenticated>
                  }
                >
                  <Route index element={<DashboardPage />} />

                  {/* Promotion Banners Routes */}
                  <Route path="/promotion-banners">
                      <Route index element={<BannerList />} />
                      <Route path="create" element={<BannerCreate />} />
                      <Route path="edit/:id" element={<BannerEdit />} />
                  </Route>

                  {/* Categories Routes */}
                  <Route path="/categories">
                      <Route index element={<CategoryList />} />
                      <Route path="create" element={<CategoryCreate />} />
                      <Route path="edit/:id" element={<CategoryEdit />} />
                  </Route>

                  {/* Products Routes */}
                  <Route path="/products">
                      <Route index element={<ProductList />} />
                      <Route path="create" element={<ProductCreate />} />
                      <Route path="edit/:id" element={<ProductEdit />} />
                  </Route>

                  {/* Orders Routes */}
                  <Route path="/orders">
                      <Route index element={<OrderList />} />
                      <Route path="edit/:id" element={<OrderEdit />} />
                  </Route>

                  {/* Users Routes */}
                  <Route path="/users">
                      <Route index element={<UserList />} />
                      <Route path="edit/:id" element={<UserEdit />} />
                  </Route>

                  {/* Support Tickets Routes */}
                  <Route path="/support-tickets">
                      <Route index element={<TicketList />} />
                      <Route path="show/:id" element={<TicketShow />} />
                  </Route>

                  {/* FAQs Routes */}
                  <Route path="/faqs">
                      <Route index element={<FaqList />} />
                      <Route path="create" element={<FaqCreate />} />
                      <Route path="edit/:id" element={<FaqEdit />} />
                  </Route>

                  {/* Notifications Routes */}
                  <Route path="/notifications">
                      <Route index element={<NotificationList />} />
                      <Route path="create" element={<NotificationCreate />} />
                  </Route>
                </Route>

                <Route
                  element={
                    <Authenticated key="authenticated-outer" fallback={<Outlet />}>
                      <Navigate to="/" />
                    </Authenticated>
                  }
                >
                  <Route path="/login" element={<AuthPage type="login" />} />
                  <Route path="/register" element={<AuthPage type="register" />} />
                  <Route path="/forgot-password" element={<AuthPage type="forgotPassword" />} />
                </Route>

                <Route
                  element={
                    <Authenticated key="authenticated-auth">
                      <ThemedLayout
                        Header={() => <Header sticky />}
                        Title={({ collapsed }: { collapsed: boolean }) => (
                            <ThemedTitle
                                collapsed={collapsed}
                                text="SmartShop Admin"
                            />
                        )}
                      >
                        <Outlet />
                      </ThemedLayout>
                    </Authenticated>
                  }
                >
                  <Route path="*" element={<ErrorComponent />} />
                </Route>
              </Routes>

              <RefineKbar />
              <UnsavedChangesNotifier />
              <DocumentTitleHandler />
            </Refine>
            <DevtoolsPanel />
          </DevtoolsProvider>
        </AntdApp>
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </HashRouter>
  );
}

export default App;
