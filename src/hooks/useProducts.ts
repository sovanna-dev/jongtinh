import { useState, useEffect, useCallback, useRef } from "react";
import {
    collection, query, where, orderBy, limit, getDocs,
    startAfter, QueryConstraint, DocumentData, QueryDocumentSnapshot
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

    const fetchIdRef = useRef(0);

    const fetchProducts = useCallback(async (isNextPage = false) => {
        const currentFetchId = ++fetchIdRef.current;

        try {
            if (isNextPage) setLoadingMore(true);
            else setLoading(true);

            const constraints: QueryConstraint[] = [];

            // Category filter
            if (category) {
                constraints.push(where("category", "==", category));
            }
            // SubCategory filter
            if (subCategory) {
                constraints.push(where("subCategory", "==", subCategory));
            }

            // Search by name (prefix match via nameLowercase)
            if (searchQuery && searchQuery.trim()) {
                const queryLower = searchQuery.trim().toLowerCase();
                constraints.push(where("nameLowercase", ">=", queryLower));
                constraints.push(where("nameLowercase", "<=", queryLower + "\uf8ff"));
                constraints.push(orderBy("nameLowercase", "asc"));
            } else {
                // Normal sorting when not searching
                if (sortBy === "priceLowHigh") {
                    constraints.push(orderBy("price", "asc"));
                } else if (sortBy === "priceHighLow") {
                    constraints.push(orderBy("price", "desc"));
                } else if (sortBy === "rating") {
                    constraints.push(orderBy("rating", "desc"));
                } else {
                    constraints.push(orderBy("createdAt", "desc"));
                }
            }

            // Advanced Filters
            if (filters.brands && filters.brands.length > 0) {
                constraints.push(where("brand", "in", filters.brands));
            }

            if (filters.priceRange && filters.priceRange.length === 2) {
                const [min, max] = filters.priceRange;
                if (min > 0) constraints.push(where("price", ">=", min));
                if (max < 5000) constraints.push(where("price", "<=", max));
            }

            if (filters.inStock) {
                constraints.push(where("isAvailable", "==", true));
            }
            if (filters.minRating && filters.minRating > 0) {
                constraints.push(where("rating", ">=", filters.minRating));
            }

            // Pagination
            if (isNextPage && lastDoc) {
                constraints.push(startAfter(lastDoc));
            }
            constraints.push(limit(pageSize));

            const q = query(collection(db, "products"), ...constraints);
            const snapshot = await getDocs(q);

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
    }, [category, subCategory, searchQuery, sortBy, pageSize, lastDoc, JSON.stringify(filters)]);

    useEffect(() => {
        setLastDoc(null);
        fetchProducts(false);
    }, [category, subCategory, searchQuery, sortBy, JSON.stringify(filters)]);

    return {
        products,
        loading,
        loadingMore,
        hasMore,
        loadMore: () => fetchProducts(true),
        refresh: () => fetchProducts(false)
    };
};