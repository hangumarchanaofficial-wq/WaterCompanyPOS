"use client";

import { useState, useEffect } from 'react'
import { productsService } from '@/services/productsService'

// Define the product type
interface Product {
    id: string
    name: string
    category: string
    stock: number
    created_at: string
}

export function useProducts() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<any>(null)

    useEffect(() => {
        fetchProducts()
    }, [])

    async function fetchProducts() {
        setLoading(true)
        const { data, error } = await productsService.getAll()
        if (error) {
            setError(error)
        } else {
            setProducts(data || [])
        }
        setLoading(false)
    }

    return {
        products,
        loading,
        error,
        refetch: fetchProducts
    }
}

export function useLowStockProducts() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchLowStock()
    }, [])

    async function fetchLowStock() {
        setLoading(true)
        const { data } = await productsService.getAll()

        const lowStockProducts = (data || []).filter((p: any) => p.stock <= 20 && p.stock > 0)
        setProducts(lowStockProducts)
        setLoading(false)
    }

    return { products, loading, refetch: fetchLowStock }
}
