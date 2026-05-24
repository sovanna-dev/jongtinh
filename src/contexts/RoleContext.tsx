import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { getRoleConfig, type UserRole, type RoleConfig } from "../config/roles";

interface RoleContextType {
    role: UserRole | undefined;
    roleConfig: RoleConfig | null;
    loading: boolean;
    hasAccess: (resource: string) => boolean;
}

const RoleContext = createContext<RoleContextType>({
    role: undefined,
    roleConfig: null,
    loading: true,
    hasAccess: () => false,
});

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [role, setRole] = useState<UserRole | undefined>();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Use Firebase Auth directly instead of Refine's useGetIdentity
        // This avoids the dependency on Refine's QueryClient
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    const userData = userDoc.data();
                    setRole(userData?.role || "customer");
                } catch {
                    setRole("customer");
                }
            } else {
                setRole(undefined);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const roleConfig = getRoleConfig(role);

    const checkAccess = useCallback(
        (resource: string) => {
            if (!roleConfig) return false;
            return roleConfig.resources.includes(resource);
        },
        [roleConfig]
    );

    return (
        <RoleContext.Provider value={{ role, roleConfig, loading, hasAccess: checkAccess }}>
            {children}
        </RoleContext.Provider>
    );
};

export const useRole = () => useContext(RoleContext);