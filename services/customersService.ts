import { supabase } from '@/lib/supabase'

export const customersService = {
    async getAll() {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('name')

        return { data, error }
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('id', id)
            .single()

        return { data, error }
    },

    async create(customer: {
        name: string
        phone?: string
        address?: string
    }) {
        const { data, error } = await supabase
            .from('customers')
            .insert([{
                name: customer.name.trim(),
                phone: customer.phone?.trim() || null,
                address: customer.address?.trim() || null,
                credit_balance: 0
            }])
            .select()
            .single()

        return { data, error }
    },

    async update(id: string, updates: {
        name?: string
        phone?: string
        address?: string
    }) {
        const updateData: any = {}

        if (updates.name !== undefined) updateData.name = updates.name.trim()
        if (updates.phone !== undefined) updateData.phone = updates.phone.trim() || null
        if (updates.address !== undefined) updateData.address = updates.address.trim() || null

        const { data, error } = await supabase
            .from('customers')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        return { data, error }
    },

    async delete(id: string) {
        const { data, error } = await supabase
            .from('customers')
            .delete()
            .eq('id', id)

        return { data, error }
    },

    async getWithCredit() {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .gt('credit_balance', 0)
            .order('credit_balance', { ascending: false })

        return { data, error }
    }
}
