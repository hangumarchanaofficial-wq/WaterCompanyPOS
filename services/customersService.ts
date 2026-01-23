import { supabase } from '@/lib/supabase';

export const customersService = {
    /**
     * Get all customers ordered by name
     */
    async getAll() {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('name');

        return { data, error };
    },

    /**
     * Get a single customer by ID
     */
    async getById(id: string) {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('id', id)
            .single();

        return { data, error };
    },

    /**
     * Create a new customer
     */
    async create(customer: {
        name: string;
        phone?: string;
        address?: string;
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
            .single();

        return { data, error };
    },

    /**
     * Update an existing customer
     */
    async update(id: string, updates: {
        name?: string;
        phone?: string;
        address?: string;
    }) {
        const updateData: any = {};

        if (updates.name !== undefined) updateData.name = updates.name.trim();
        if (updates.phone !== undefined) updateData.phone = updates.phone.trim() || null;
        if (updates.address !== undefined) updateData.address = updates.address.trim() || null;

        const { data, error } = await supabase
            .from('customers')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        return { data, error };
    },

    /**
     * Delete a customer (only if credit_balance is 0)
     */
    async delete(id: string) {
        // First check if customer has outstanding credit
        const { data: customer, error: fetchError } = await supabase
            .from('customers')
            .select('credit_balance')
            .eq('id', id)
            .single();

        if (fetchError) {
            return { data: null, error: fetchError };
        }

        if (customer && customer.credit_balance > 0) {
            return {
                data: null,
                error: new Error(`Cannot delete customer with outstanding debt of Rs ${customer.credit_balance}`)
            };
        }

        const { data, error } = await supabase
            .from('customers')
            .delete()
            .eq('id', id);

        return { data, error };
    },

    /**
     * Get all customers with outstanding credit balance
     */
    async getWithCredit() {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .gt('credit_balance', 0)
            .order('credit_balance', { ascending: false });

        return { data, error };
    },

    /**
     * Update customer's credit balance
     */
    async updateCreditBalance(id: string, amount: number) {
        const { data, error } = await supabase
            .from('customers')
            .update({ credit_balance: amount })
            .eq('id', id)
            .select()
            .single();

        return { data, error };
    },

    /**
     * Increment customer's credit balance
     */
    async incrementCredit(id: string, amount: number) {
        const { data: customer, error: fetchError } = await supabase
            .from('customers')
            .select('credit_balance')
            .eq('id', id)
            .single();

        if (fetchError || !customer) {
            return { data: null, error: fetchError };
        }

        const newBalance = customer.credit_balance + amount;

        return await this.updateCreditBalance(id, newBalance);
    },

    /**
     * Decrement customer's credit balance (for payments)
     */
    async decrementCredit(id: string, amount: number) {
        const { data: customer, error: fetchError } = await supabase
            .from('customers')
            .select('credit_balance')
            .eq('id', id)
            .single();

        if (fetchError || !customer) {
            return { data: null, error: fetchError };
        }

        const newBalance = Math.max(0, customer.credit_balance - amount);

        return await this.updateCreditBalance(id, newBalance);
    }
};
