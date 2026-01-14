"use client";

import { useState, useEffect } from 'react'
import { paymentsService } from '@/services/paymentsService'

// Define the payment type
interface Payment {
    id: string
    customer_id: string
    amount: number
    payment_method: 'CASH' | 'BANK_TRANSFER' | 'CARD'
    notes?: string
    payment_date: string
    created_at: string
    customers?: {
        name: string
        credit_balance: number
    }
}

export function usePayments() {
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<any>(null)

    useEffect(() => {
        fetchPayments()
    }, [])

    async function fetchPayments() {
        setLoading(true)
        const { data, error } = await paymentsService.getAll()
        if (error) {
            setError(error)
        } else {
            setPayments(data || [])
        }
        setLoading(false)
    }

    return {
        payments,
        loading,
        error,
        refetch: fetchPayments
    }
}

export function useTodayPayments() {
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchTodayPayments()
    }, [])

    async function fetchTodayPayments() {
        setLoading(true)
        const { data } = await paymentsService.getToday()
        setPayments(data || [])
        setLoading(false)
    }

    return { payments, loading, refetch: fetchTodayPayments }
}
