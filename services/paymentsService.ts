import { supabase } from '@/lib/supabase'

export const paymentsService = {
    // Record a debt payment
    async recordPayment(payment: {
        customer_id: string
        sale_id?: string
        amount: number
        payment_method: 'CASH' | 'BANK_TRANSFER' | 'CARD'
        notes?: string
    }) {
        const { data, error } = await supabase
            .from('debt_payments')
            .insert([{
                customer_id: payment.customer_id,
                sale_id: payment.sale_id,
                amount: payment.amount,
                payment_method: payment.payment_method,
                notes: payment.notes
            }])
            .select()
            .single()

        if (error) {
            console.error('Payment insert error:', error)
            return { data: null, error }
        }

        // Update customer's credit balance
        const { error: updateError } = await supabase.rpc(
            'reduce_customer_credit',
            {
                p_customer_id: payment.customer_id,
                p_amount: payment.amount
            }
        )

        if (updateError) {
            console.error('Credit update error:', updateError)
            return { data: null, error: updateError }
        }

        return { data, error: null }
    },

    // Get all payments with sale info
    async getAll() {
        const { data, error } = await supabase
            .from('debt_payments')
            .select('*, customers(name, credit_balance), sales(transaction_id)')
            .order('payment_date', { ascending: false })

        return { data, error }
    },

    // Get payments by customer
    async getByCustomer(customerId: string) {
        const { data, error } = await supabase
            .from('debt_payments')
            .select('*, sales(transaction_id)')
            .eq('customer_id', customerId)
            .order('payment_date', { ascending: false })

        return { data, error }
    },

    // Get today's payments
    async getToday() {
        const today = new Date().toISOString().split('T')[0]
        const { data, error } = await supabase
            .from('debt_payments')
            .select('*, customers(name, credit_balance), sales(transaction_id)')
            .gte('payment_date', `${today}T00:00:00`)
            .order('payment_date', { ascending: false })

        return { data, error }
    }
}
