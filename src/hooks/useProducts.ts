import { useState, useEffect, useCallback, useRef } from "react";
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    startAfter,
    QueryConstraint,
    DocumentData,
    QueryDocumentSnapshot
} from "firebase/firestore";
import { db } from "../firebase";
import { IProduct } from "../interfaces";

interface UseProductsProps {
    pageSize?: number;
    category?: string | null;
    subCategory?: string | null;
    searchQuery?: string;
    sortBy?: string;
    filters?: {
        priceRange?: number[];
        brands?: string[];
        inStock?: boolean;
        minRating?: number;
    };
}

export const useProducts = ({
    pageSize = 12,
    category,
    subCategory,
    searchQuery,
    sortBy = "createdAt",
    filters = {}
}: UseProductsProps) => {
    const [products, setProducts] = useState<IProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

    // Use a ref to track the current fetch ID to prevent race conditions
    const fetchIdRef = useRef(0);

    const fetchProducts = useCallback(async (isNextPage = false) => {
        const currentFetchId = ++fetchIdRef.current;

        try {
            if (isNextPage) setLoadingMore(true);
            else {
                setLoading(true);
                // Reset lastDoc when parameters change
            }

            const constraints: QueryConstraint[] = [];

            // 1. Basic Filters
            if (category) {
                constraints.push(where("category", "==", category));
            }
            if (subCategory) {
                constraints.push(where("subCategory", "==", subCategory));
            }

            // 2. Advanced Filters (Requires composite indexes)
            if (filters.brands && filters.brands.length > 0) {
                constraints.push(where("brand", "in", filters.brands));
            }
            if (filters.inStock) {
                constraints.push(where("isAvailable", "==", true));
            }
            if (filters.minRating && filters.minRating > 0) {
                constraints.push(where("rating", ">=", filters.minRating));
            }

            // 3. Sorting
            // Note: If you have a 'where' on a field, you must 'orderBy' that field first in Firestore
            if (sortBy === "priceLowHigh") {
                constraints.push(orderBy("price", "asc"));
            } else if (sortBy === "priceHighLow") {
                constraints.push(orderBy("price", "desc"));
            } else if (sortBy === "rating") {
                constraints.push(orderBy("rating", "desc"));
            } else {
                constraints.push(orderBy("createdAt", "desc"));
            }

            // 4. Pagination
            if (isNextPage && lastDoc) {
                constraints.push(startAfter(lastDoc));
            }
            constraints.push(limit(pageSize));

            const q = query(collection(db, "products"), ...constraints);
            const snapshot = await getDocs(q);

            // Only update state if this is still the latest request
            if (currentFetchId !== fetchIdRef.current) return;

            const newProducts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as IProduct[];

            if (isNextPage) {
                setProducts(prev => [...prev, ...newProducts]);
            } else {
                setProducts(newProducts);
            }

            const lastVisible = snapshot.docs[snapshot.docs.length - 1];
            setLastDoc(lastVisible || null);
            setHasMore(snapshot.docs.length === pageSize);

        } catch (error) {
            if (currentFetchId === fetchIdRef.current) {
                console.error("Error fetching products:", error);
            }
        } finally {
            if (currentFetchId === fetchIdRef.current) {
                setLoading(false);
                setLoadingMore(false);
            }
        }
    }, [category, subCategory, sortBy, pageSize, lastDoc, JSON.stringify(filters)]);

    // Trigger refresh when primary filters change
    useEffect(() => {
        setLastDoc(null);
        fetchProducts(false);
    }, [category, subCategory, sortBy, JSON.stringify(filters)]);

    return {
        products,
        loading,
        loadingMore,
        hasMore,
        loadMore: () => fetchProducts(true),
        refresh: () => fetchProducts(false)
    };
};
