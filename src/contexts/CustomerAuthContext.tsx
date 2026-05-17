import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    User,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

interface CustomerAuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType>({} as CustomerAuthContextType);

export const CustomerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }, []);

    const register = useCallback(async (name: string, email: string, password: string) => {
        try {
            // Create Firebase Auth user
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            const user = credential.user;

            // Update display name
            await updateProfile(user, { displayName: name });

            // Create Firestore user document
            await setDoc(doc(db, "users", user.uid), {
                displayName: name,
                email: email,
                phoneNumber: "",
                photoUrl: "",
                isAdmin: false,
                role: "viewer",
                fcmToken: "",
                createdAt: Date.now(),
            });

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }, []);

    const logout = useCallback(async () => {
        await signOut(auth);
    }, []);

    return (
        <CustomerAuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </CustomerAuthContext.Provider>
    );
};

export const useCustomerAuth = () => useContext(CustomerAuthContext);