import { supabase } from '@/lib/supabase'

export const salesService = {
    // Create a new sale
    async create(sale: {
        transaction_id?: string
        customer_id: string
        customer_name: string
        total_amount: number
        payment_type: 'CASH' | 'CREDIT'
        items: Array<{
            product_id: string
            product_name: string
            quantity: number
            unit_price: number
            total_price: number
        }>
    }) {
        // Create the sale
        const { data: saleData, error: saleError } = await supabase
            .from('sales')
            .insert([{
                transaction_id: sale.transaction_id,
                customer_id: sale.customer_id,
                customer_name: sale.customer_name,
                total_amount: sale.total_amount,
                payment_type: sale.payment_type
            }])
            .select()
            .single()

        if (saleError) {
            console.error('Sale insert error:', saleError)
            return { data: null, error: saleError }
        }

        // Insert sale items
        const saleItems = sale.items.map(item => ({
            sale_id: saleData.id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price
        }))

        const { error: itemsError } = await supabase
            .from('sale_items')
            .insert(saleItems)

        if (itemsError) {
            console.error('Sale items insert error:', itemsError)
            return { data: null, error: itemsError }
        }

        // Update product stock
        for (const item of sale.items) {
            const { error: stockError } = await supabase.rpc(
                'decrease_product_stock',
                {
                    p_product_id: item.product_id,
                    p_quantity: item.quantity
                }
            )
            if (stockError) {
                console.error('Stock update error:', stockError)
            }
        }

        // If credit sale, update customer credit balance
        if (sale.payment_type === 'CREDIT') {
            const { error: creditError } = await supabase.rpc(
                'increase_customer_credit',
                {
                    p_customer_id: sale.customer_id,
                    p_amount: sale.total_amount
                }
            )
            if (creditError) {
                console.error('Credit update error:', creditError)
            }
        }

        return { data: saleData, error: null }
    },

    // Get all sales
    async getAll() {
        const { data, error } = await supabase
            .from('sales')
            .select('*, sale_items(*)')
            .order('transaction_date', { ascending: false })

        return { data, error }
    },

    // Get today's sales
    async getToday() {
        const today = new Date().toISOString().split('T')[0]
        const { data, error } = await supabase
            .from('sales')
            .select('*, sale_items(*)')
            .gte('transaction_date', `${today}T00:00:00`)
            .order('transaction_date', { ascending: false })

        return { data, error }
    },

    // Get sales summary
    async getSalesSummary() {
        const { data, error } = await supabase
            .from('sales')
            .select('total_amount, payment_type, transaction_date')

        if (error) return { data: null, error }

        // Calculate summary statistics
        const totalSales = data.reduce((sum, sale) => sum + sale.total_amount, 0)
        const totalTransactions = data.length
        const cashSales = data
            .filter(s => s.payment_type === 'CASH')
            .reduce((sum, sale) => sum + sale.total_amount, 0)
        const creditSales = data
            .filter(s => s.payment_type === 'CREDIT')
            .reduce((sum, sale) => sum + sale.total_amount, 0)

        return {
            data: {
                totalSales,
                totalTransactions,
                cashSales,
                creditSales,
                avgTransaction: totalTransactions > 0 ? totalSales / totalTransactions : 0
            },
            error: null
        }
    },

    // Get summary data (alternative simpler version)
    async getSummary() {
        const { data, error } = await supabase
            .from('sales')
            .select('total_amount, payment_type, transaction_date')

        return { data, error }
    },

    // Get credit sales by customer
    async getCreditSalesByCustomer(customerId: string) {
        const { data, error } = await supabase
            .from('sales')
            .select('*, sale_items(*)')
            .eq('customer_id', customerId)
            .eq('payment_type', 'CREDIT')
            .order('transaction_date', { ascending: false })

        return { data, error }
    },

    // Get sale by ID
    async getById(id: string) {
        const { data, error } = await supabase
            .from('sales')
            .select('*, sale_items(*)')
            .eq('id', id)
            .single()

        return { data, error }
    },

    // Update sale
    async update(id: string, updates: any) {
        const { data, error } = await supabase
            .from('sales')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        return { data, error }
    },

    // Delete sale
    async delete(id: string) {
        const { data, error } = await supabase
            .from('sales')
            .delete()
            .eq('id', id)

        return { data, error }
    }
}
