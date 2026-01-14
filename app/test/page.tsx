'use client'

import { useProducts } from '@/hooks/useProducts'
import { useCustomers } from '@/hooks/useCustomers'

export default function TestPage() {
    const { products, loading: productsLoading } = useProducts()
    const { customers, loading: customersLoading } = useCustomers()

    if (productsLoading || customersLoading) {
        return <div className="p-8">Loading...</div>
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Database Connection Test</h1>

            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Products ({products.length})</h2>
                <div className="grid gap-2">
                    {products.slice(0, 5).map(product => (
                        <div key={product.id} className="p-3 bg-gray-100 rounded">
                            {product.name} - Stock: {product.stock}
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-2">Customers ({customers.length})</h2>
                <div className="grid gap-2">
                    {customers.map(customer => (
                        <div key={customer.id} className="p-3 bg-gray-100 rounded">
                            {customer.name} - Credit: ₹{customer.credit_balance}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
