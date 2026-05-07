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
    getCountFromServer,
    DocumentData,
    WithFieldValue,
    QueryConstraint
} from "firebase/firestore";
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "firebase/auth";
import { db, auth } from "../firebase";

export const dataProvider = (): DataProvider => ({
    getList: async ({ resource, pagination, sorters, filters }) => {
        const colRef = collection(db, resource);

        const filterConstraints: QueryConstraint[] = [];
        if (filters) {
            filters.forEach((filter) => {
                if ("field" in filter && filter.operator === "eq") {
                    filterConstraints.push(where(filter.field, "==", filter.value));
                }
            });
        }

        const dataConstraints: QueryConstraint[] = [...filterConstraints];

        if (sorters && sorters.length > 0) {
            sorters.forEach((sorter) => {
                dataConstraints.push(orderBy(sorter.field, sorter.order));
            });
        }

        if (pagination && pagination.pageSize) {
            dataConstraints.push(limit(pagination.pageSize));
        }

        const q = query(colRef, ...dataConstraints);
        const snapshot = await getDocs(q);

        const countSnapshot = await getCountFromServer(query(colRef, ...filterConstraints));
        const total = countSnapshot.data().count;

        const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as any;

        return {
            data,
            total,
        };
    },

    getOne: async ({ resource, id }) => {
        if (!id) {
            return { data: {} as any };
        }
        const docRef = doc(db, resource, id as string);
        const snapshot = await getDoc(docRef);
        return {
            data: {
                id: snapshot.id,
                ...snapshot.data(),
            } as any,
        };
    },

    create: async ({ resource, variables }) => {
        const colRef = collection(db, resource);
        const docRef = await addDoc(colRef, variables as WithFieldValue<DocumentData>);

        // Update the document to set the id field to match the document ID
        await updateDoc(docRef, { id: docRef.id } as any);

        return {
            data: {
                id: docRef.id,
                ...variables,
                id: docRef.id,  // Ensure id is set
            } as any,
        };
    },

    update: async ({ resource, id, variables }) => {
        if (!id) {
            return { data: {} as any };
        }
        const docRef = doc(db, resource, id as string);
        await updateDoc(docRef, variables as WithFieldValue<DocumentData>);
        return {
            data: {
                id,
                ...variables,
            } as any,
        };
    },

    deleteOne: async ({ resource, id }) => {
        if (!id) {
            return { data: { id: "" } as any };
        }
        const docRef = doc(db, resource, id as string);
        await deleteDoc(docRef);
        return {
            data: { id } as any,
        };
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

        return {
            data,
        };
    },

    getApiUrl: () => "",
});

export const authProvider: AuthProvider = {
    login: async ({ email, password }) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data().isAdmin === true) {
                return {
                    success: true,
                    redirectTo: "/",
                };
            } else {
                await signOut(auth);
                return {
                    success: false,
                    error: {
                        name: "Login Error",
                        message: "Unauthorized: You do not have Admin privileges.",
                    },
                };
            }
        } catch (error: any) {
            return {
                success: false,
                error: {
                    name: "Login Error",
                    message: error.message,
                },
            };
        }
    },
    logout: async () => {
        await signOut(auth);
        return {
            success: true,
            redirectTo: "/login",
        };
    },
    check: async () => {
        return new Promise((resolve) => {
            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists() && userDoc.data().isAdmin === true) {
                        resolve({ authenticated: true });
                    } else {
                        resolve({
                            authenticated: false,
                            redirectTo: "/login",
                            logout: true
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
            return userDoc.data()?.isAdmin ? ["admin"] : [];
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