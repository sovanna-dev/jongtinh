import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { collection, doc, setDoc, deleteDoc, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";

interface WishlistContextType {
    favorites: Set<string>;
    loading: boolean;
    toggleFavorite: (productId: string) => Promise<void>;
    isFavorite: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType>({} as WishlistContextType);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    // Listen for auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) {
                setFavorites(new Set());
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // Fetch favorites when user changes
    useEffect(() => {
        if (!user) {
            setFavorites(new Set());
            setLoading(false);
            return;
        }

        const fetchFavorites = async () => {
            try {
                const q = query(
                    collection(db, "favorites"),
                    where("userId", "==", user.uid)
                );
                const snapshot = await getDocs(q);
                const ids = new Set<string>();
                snapshot.docs.forEach((doc) => {
                    ids.add(doc.data().productId);
                });
                setFavorites(ids);
            } catch (error) {
                console.error("Error fetching favorites:", error);
            }
            setLoading(false);
        };

        fetchFavorites();
    }, [user]);

    const toggleFavorite = useCallback(async (productId: string) => {
        if (!user) return;

        const docId = `${user.uid}_${productId}`;
        const favRef = doc(db, "favorites", docId);

        try {
            if (favorites.has(productId)) {
                // Remove from favorites
                await deleteDoc(favRef);
                setFavorites((prev) => {
                    const next = new Set(prev);
                    next.delete(productId);
                    return next;
                });
            } else {
                // Add to favorites
                await setDoc(favRef, {
                    userId: user.uid,
                    productId: productId,
                    addedAt: Date.now(),
                });
                setFavorites((prev) => new Set(prev).add(productId));
            }
        } catch (error) {
            console.error("Error toggling favorite:", error);
        }
    }, [user, favorites]);

    const isFavorite = useCallback(
        (productId: string) => favorites.has(productId),
        [favorites]
    );

    return (
        <WishlistContext.Provider value={{ favorites, loading, toggleFavorite, isFavorite }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => useContext(WishlistContext);