import { DataProvider, AuthProvider } from "@refinedev/core";
import {
    collection,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    limit,
    startAfter,
    getCountFromServer,
    DocumentData,
    DocumentSnapshot,
    WithFieldValue,
    QueryConstraint
} from "firebase/firestore";
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "firebase/auth";
import { db, auth } from "../firebase";

// Cursor cache for Firestore pagination.
const cursorCache = new Map<string, DocumentSnapshot>();

const buildCacheKey = (
    resource: string,
    page: number,
    pageSize: number,
    sorters: any,
    filters: any
) =>
    `${resource}::${page}::${pageSize}::${JSON.stringify(sorters ?? [])}::${JSON.stringify(filters ?? [])}`;

export const dataProvider = (): DataProvider => ({
        getList: async ({ resource, pagination, sorters, filters, meta }) => {
            const collectionPath = meta?.subCollection
                ? `${resource}/${meta.subCollection}`
                : resource;
            const colRef = collection(db, collectionPath);

            const currentPage = (pagination as any)?.current ?? 1;
            const pageSize = pagination?.pageSize ?? 10;

            const filterConstraints: QueryConstraint[] = [];
            if (filters) {
                filters.forEach((filter) => {
                    if (!("field" in filter)) return;
                    if (filter.operator === "eq") {
                        filterConstraints.push(where(filter.field, "==", filter.value));
                    } else if (
                        filter.operator === "in" &&
                        Array.isArray(filter.value) &&
                        filter.value.length > 0
                    ) {
                        filterConstraints.push(where(filter.field, "in", filter.value.slice(0, 30)));
                    }
                });
            }

            const dataConstraints: QueryConstraint[] = [...filterConstraints];

            if (sorters && sorters.length > 0) {
                sorters.forEach((sorter) => {
                    dataConstraints.push(orderBy(sorter.field, sorter.order));
                });
            }

            if (currentPage > 1) {
                const prevKey = buildCacheKey(resource, currentPage - 1, pageSize, sorters, filters);
                const cursor = cursorCache.get(prevKey);
                if (cursor) {
                    dataConstraints.push(startAfter(cursor));
                }
            }

            dataConstraints.push(limit(pageSize));

            try {
                const q = query(colRef, ...dataConstraints);
                const snapshot = await getDocs(q);

                if (snapshot.docs.length > 0) {
                    const pageKey = buildCacheKey(resource, currentPage, pageSize, sorters, filters);
                    cursorCache.set(pageKey, snapshot.docs[snapshot.docs.length - 1]);
                }

                const countSnapshot = await getCountFromServer(query(colRef, ...filterConstraints));
                const total = countSnapshot.data().count;

                const data = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as any;

                return { data, total };
            } catch (error: any) {
                if (error.code === "permission-denied") {
                    console.warn(`Permission denied for ${collectionPath}`);
                    return { data: [], total: 0 };
                }
                throw error;
            }
        },

    getOne: async ({ resource, id }) => {
        if (!id) return { data: {} as any };
        const docRef = doc(db, resource, id as string);
        const snapshot = await getDoc(docRef);
        return {
            data: { id: snapshot.id, ...snapshot.data() } as any,
        };
    },

    create: async ({ resource, variables, meta }) => {
        const collectionPath = meta?.subCollection
            ? `${resource}/${meta.subCollection}`
            : resource;
        const colRef = collection(db, collectionPath);
        const docRef = await addDoc(colRef, variables as WithFieldValue<DocumentData>);
        await updateDoc(docRef, { id: docRef.id } as any);
        return { data: { ...variables, id: docRef.id } as any };
    },

    update: async ({ resource, id, variables }) => {
        if (!id) return { data: {} as any };
        const docRef = doc(db, resource, id as string);
        await updateDoc(docRef, variables as WithFieldValue<DocumentData>);
        return { data: { id, ...variables } as any };
    },

    deleteOne: async ({ resource, id }) => {
        if (!id) return { data: { id: "" } as any };
        const docRef = doc(db, resource, id as string);
        await deleteDoc(docRef);
        return { data: { id } as any };
    },

    getMany: async ({ resource, ids }) => {
        if (!ids || ids.length === 0) return { data: [] };
        const colRef = collection(db, resource);
        const q = query(colRef, where("__name__", "in", ids));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as any;
        return { data };
    },

    getApiUrl: () => "",
});

// ═══════════════════════════════════════════════════
// AUTH PROVIDER (Single check function)
// ═══════════════════════════════════════════════════
export const authProvider: AuthProvider = {
    login: async ({ email, password }) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            let userDoc = await getDoc(doc(db, "users", user.uid));
            let userData = userDoc.data();

            if (!userDoc.exists()) {
                const q = query(collection(db, "users"), where("uid", "==", user.uid), limit(1));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    userDoc = querySnapshot.docs[0] as any;
                    userData = userDoc.data();
                }
            }

            const role = userData?.role?.toString().toLowerCase().trim();
            const isAdminBool = userData?.isAdmin === true;
            const isAdminRole = isAdminBool ||
                ['super_admin', 'product_manager', 'order_manager', 'support_agent'].includes(role);

            if (userData && isAdminRole) {
                return { success: true, redirectTo: "/admin" };
            } else {
                // Customer or unknown — reject from admin login
                await signOut(auth);
                return {
                    success: false,
                    error: {
                        name: "Login Error",
                        message: "This login is for administrators only. Please use the shop to login as a customer.",
                    },
                };
            }
        } catch (error: any) {
            return {
                success: false,
                error: { name: "Login Error", message: error.message },
            };
        }
    },

    logout: async () => {
        await signOut(auth);
        return { success: true, redirectTo: "/login" };
    },

    // ONLY ONE check function — the correct one with logout: false for customers
    check: async () => {
        return new Promise((resolve) => {
            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                unsubscribe();
                if (user) {
                    let userDoc = await getDoc(doc(db, "users", user.uid));
                    let userData = userDoc.data();

                    if (!userDoc.exists()) {
                        const q = query(collection(db, "users"), where("uid", "==", user.uid), limit(1));
                        const querySnapshot = await getDocs(q);
                        if (!querySnapshot.empty) {
                            userDoc = querySnapshot.docs[0] as any;
                            userData = userDoc.data();
                        }
                    }

                    const role = userData?.role?.toString().toLowerCase().trim();
                    const isAdminBool = userData?.isAdmin === true;
                    const isAdminRole = isAdminBool ||
                        ['super_admin', 'product_manager', 'order_manager', 'support_agent'].includes(role);
                    const isCustomer = role === "viewer" || role === "customer" || (!role && !isAdminBool);

                    if (isAdminRole) {
                        resolve({ authenticated: true });
                    } else if (isCustomer) {
                        // Customer — deny access but DON'T logout
                        resolve({
                            authenticated: false,
                            redirectTo: "/shop",
                            logout: false,
                        });
                    } else {
                        resolve({
                            authenticated: false,
                            redirectTo: "/login",
                            logout: true,
                        });
                    }
                } else {
                    resolve({
                        authenticated: false,
                        redirectTo: "/login",
                    });
                }
            });
        });
    },

    getPermissions: async () => {
        const user = auth.currentUser;
        if (user) {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            const userData = userDoc.data();
            if (userData?.isAdmin) return ["admin"];
            if (userData?.role) return [userData.role];
        }
        return [];
    },

    getIdentity: async () => {
        const user = auth.currentUser;
        if (user) {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            const userData = userDoc.data();
            return {
                id: user.uid,
                name: userData?.displayName || userData?.fullName || user.displayName || user.email,
                avatar: userData?.photoUrl || userData?.profileImage || user.photoURL,
                role: userData?.role || "viewer",
            };
        }
        return null;
    },

    onError: async (error) => {
        if (error.code === "permission-denied") {
            return { logout: true };
        }
        return { error };
    },
};