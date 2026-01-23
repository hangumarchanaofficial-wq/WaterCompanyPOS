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

    // Get sale by ID with full details
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

    // Delete sale with proper cleanup (restores stock and credit)
    async delete(id: string) {
        try {
            // First, get the sale details to restore stock and credit
            const { data: saleData, error: fetchError } = await supabase
                .from('sales')
                .select('*, sale_items(*)')
                .eq('id', id)
                .single()

            if (fetchError) {
                console.error('Error fetching sale for deletion:', fetchError)
                return { data: null, error: fetchError }
            }

            if (!saleData) {
                return { data: null, error: { message: 'Sale not found' } }
            }

            // Restore product stock for each item
            if (saleData.sale_items && saleData.sale_items.length > 0) {
                for (const item of saleData.sale_items) {
                    const { error: stockError } = await supabase.rpc(
                        'increase_product_stock',
                        {
                            p_product_id: item.product_id,
                            p_quantity: item.quantity
                        }
                    )
                    if (stockError) {
                        console.error('Error restoring stock:', stockError)
                        // Try direct update as fallback
                        const { data: product } = await supabase
                            .from('products')
                            .select('stock')
                            .eq('id', item.product_id)
                            .single()

                        if (product) {
                            await supabase
                                .from('products')
                                .update({ stock: product.stock + item.quantity })
                                .eq('id', item.product_id)
                        }
                    }
                }
            }

            // If it was a credit sale, reduce customer credit balance
            if (saleData.payment_type === 'CREDIT') {
                const { error: creditError } = await supabase.rpc(
                    'decrease_customer_credit',
                    {
                        p_customer_id: saleData.customer_id,
                        p_amount: saleData.total_amount
                    }
                )
                if (creditError) {
                    console.error('Error reducing customer credit:', creditError)
                    // Try direct update as fallback
                    const { data: customer } = await supabase
                        .from('customers')
                        .select('credit_balance')
                        .eq('id', saleData.customer_id)
                        .single()

                    if (customer) {
                        await supabase
                            .from('customers')
                            .update({
                                credit_balance: Math.max(0, customer.credit_balance - saleData.total_amount)
                            })
                            .eq('id', saleData.customer_id)
                    }
                }
            }

            // Delete sale items first
            const { error: itemsError } = await supabase
                .from('sale_items')
                .delete()
                .eq('sale_id', id)

            if (itemsError) {
                console.error('Error deleting sale items:', itemsError)
                return { data: null, error: itemsError }
            }

            // Finally, delete the sale
            const { data, error } = await supabase
                .from('sales')
                .delete()
                .eq('id', id)
                .select()

            if (error) {
                console.error('Error deleting sale:', error)
                return { data: null, error }
            }

            return { data: saleData, error: null }
        } catch (error) {
            console.error('Unexpected error during sale deletion:', error)
            return { data: null, error }
        }
    },

    // Bulk delete sales (with proper cleanup)
    async bulkDelete(ids: string[]) {
        const results = []
        const errors = []

        for (const id of ids) {
            const result = await this.delete(id)
            if (result.error) {
                errors.push({ id, error: result.error })
            } else {
                results.push(result.data)
            }
        }

        return {
            data: results,
            errors: errors.length > 0 ? errors : null
        }
    },

    // Get sales by date range
    async getByDateRange(startDate: string, endDate: string) {
        const { data, error } = await supabase
            .from('sales')
            .select('*, sale_items(*)')
            .gte('transaction_date', startDate)
            .lte('transaction_date', endDate)
            .order('transaction_date', { ascending: false })

        return { data, error }
    },

    // Get sales by payment type
    async getByPaymentType(paymentType: 'CASH' | 'CREDIT') {
        const { data, error } = await supabase
            .from('sales')
            .select('*, sale_items(*)')
            .eq('payment_type', paymentType)
            .order('transaction_date', { ascending: false })

        return { data, error }
    }
}

// Export individual functions for convenience
export const createSale = salesService.create
export const getAllSales = salesService.getAll
export const getTodaySales = salesService.getToday
export const getSalesSummary = salesService.getSalesSummary
export const getSaleById = salesService.getById
export const updateSale = salesService.update
export const deleteSale = salesService.delete
export const bulkDeleteSales = salesService.bulkDelete
export const getCreditSalesByCustomer = salesService.getCreditSalesByCustomer
export const getSalesByDateRange = salesService.getByDateRange
export const getSalesByPaymentType = salesService.getByPaymentType