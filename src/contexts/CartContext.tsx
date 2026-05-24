import React, { createContext, useContext, useState, useCallback } from "react";
import { IProduct } from "../interfaces";

interface CartItem {
    product: IProduct;
    quantity: number;
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: IProduct, quantity?: number) => void;
    removeFromCart: (productId: string, selectedColor?: any, selectedSize?: string) => void;
    updateQuantity: (productId: string, quantity: number, selectedColor?: any, selectedSize?: string) => void;
    clearCart: () => void;
    cartCount: number;
    cartTotal: number;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<CartItem[]>([]);

    const addToCart = useCallback((product: IProduct, quantity: number = 1) => {
        setCart((prev) => {
            const existing = prev.find((item) =>
                item.product.id === product.id &&
                item.product.selectedColor === product.selectedColor &&
                item.product.selectedSize === product.selectedSize
            );
            if (existing) {
                return prev.map((item) =>
                    (item.product.id === product.id &&
                        item.product.selectedColor === product.selectedColor &&
                        item.product.selectedSize === product.selectedSize)
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prev, { product, quantity }];
        });
    }, []);

    const removeFromCart = useCallback((productId: string, selectedColor?: any, selectedSize?: string) => {
        setCart((prev) => prev.filter((item) =>
            !(item.product.id === productId &&
                item.product.selectedColor === selectedColor &&
                item.product.selectedSize === selectedSize)
        ));
    }, []);

    const updateQuantity = useCallback((productId: string, quantity: number, selectedColor?: any, selectedSize?: string) => {
        if (quantity <= 0) {
            removeFromCart(productId, selectedColor, selectedSize);
            return;
        }
        setCart((prev) =>
            prev.map((item) =>
                (item.product.id === productId &&
                    item.product.selectedColor === selectedColor &&
                    item.product.selectedSize === selectedSize) ? { ...item, quantity } : item
            )
        );
    }, [removeFromCart]);

    const clearCart = useCallback(() => {
        setCart([]);
    }, []);

    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cart.reduce((sum, item) => {
        const price = item.product.discountPrice ?? item.product.price;
        return sum + price * item.quantity;
    }, 0);

    return (
        <CartContext.Provider
            value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);