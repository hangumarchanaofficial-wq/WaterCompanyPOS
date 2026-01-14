import { supabase } from '@/lib/supabase'

export const productsService = {
    async getAll() {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('name')

        return { data, error }
    },

    async getLowStock() {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .lte('stock', 20)
            .gt('stock', 0)
            .order('stock')

        return { data, error }
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single()

        return { data, error }
    },

    async create(product: { name: string, category: string, stock: number }) {
        const { data, error } = await supabase
            .from('products')
            .insert([product])
            .select()
            .single()

        return { data, error }
    },

    async update(id: string, updates: any) {
        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id)
            .select()
            .single()

        return { data, error }
    },

    async delete(id: string) {
        const { data, error } = await supabase
            .from('products')
            .delete()
            .eq('id', id)

        return { data, error }
    }
}
