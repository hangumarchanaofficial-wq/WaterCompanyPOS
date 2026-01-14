"use client";

import { useState, useEffect } from 'react'
import { customersService } from '@/services/customersService'

// Define the customer type
interface Customer {
    id: string
    name: string
    phone?: string
    address?: string
    credit_balance: number
    created_at: string
}

export function useCustomers() {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<any>(null)

    useEffect(() => {
        fetchCustomers()
    }, [])

    async function fetchCustomers() {
        setLoading(true)
        const { data, error } = await customersService.getAll()
        if (error) {
            setError(error)
        } else {
            setCustomers(data || [])
        }
        setLoading(false)
    }

    return {
        customers,
        loading,
        error,
        refetch: fetchCustomers
    }
}

export function useCustomersWithCredit() {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchCustomersWithCredit()
    }, [])

    async function fetchCustomersWithCredit() {
        setLoading(true)
        const { data } = await customersService.getWithCredit()
        setCustomers(data || [])
        setLoading(false)
    }

    return { customers, loading, refetch: fetchCustomersWithCredit }
}
