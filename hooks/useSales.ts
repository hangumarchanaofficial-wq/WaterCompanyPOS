import { useState, useEffect } from 'react'
import { salesService } from '@/services/salesService'

export function useSales() {
    const [sales, setSales] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<any>(null)

    useEffect(() => {
        fetchSales()
    }, [])

    async function fetchSales() {
        setLoading(true)
        const { data, error } = await salesService.getAll()
        if (error) {
            setError(error)
        } else {
            setSales(data || [])
        }
        setLoading(false)
    }

    return {
        sales,
        loading,
        error,
        refetch: fetchSales
    }
}

export function useTodaySales() {
    const [sales, setSales] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchTodaySales()
    }, [])

    async function fetchTodaySales() {
        setLoading(true)
        const { data } = await salesService.getToday()
        setSales(data || [])
        setLoading(false)
    }

    return { sales, loading, refetch: fetchTodaySales }
}

export function useSalesSummary() {
    const [summary, setSummary] = useState({ cash: 0, credit: 0, total: 0 })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchSummary()
    }, [])

    async function fetchSummary() {
        setLoading(true)
        const { data } = await salesService.getSalesSummary()
        if (data) setSummary(data)
        setLoading(false)
    }

    return { summary, loading, refetch: fetchSummary }
}
