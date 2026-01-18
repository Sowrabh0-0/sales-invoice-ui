"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { apiFetch } from "@/lib/api"

/* ================= TYPES ================= */

type Customer = {
    id: number
    name: string
}

type OrderItem = {
    product_name: string
    quantity: number
    unit_price: number
}

type Order = {
    id: number
    customer_id: number
    status: string
    total?: number
    items?: OrderItem[]
}

/* ================= PAGE ================= */

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)

    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)

    const [viewOrder, setViewOrder] = useState<Order | null>(null)

    const [customerId, setCustomerId] = useState("")
    const [productName, setProductName] = useState("")
    const [quantity, setQuantity] = useState(1)
    const [unitPrice, setUnitPrice] = useState(0)

    /* ================= HELPERS ================= */

    const customerMap = new Map(customers.map(c => [c.id, c.name]))

    function calculateTotal(items: OrderItem[] = []) {
        return items.reduce(
            (sum, item) => sum + item.quantity * item.unit_price,
            0
        )
    }

    /* ================= LOAD DATA ================= */

    async function loadData() {
        try {
            setLoading(true)
            const [ordersData, customersData] = await Promise.all([
                apiFetch<Order[]>("/orders"),
                apiFetch<Customer[]>("/customers"),
            ])
            setOrders(ordersData)
            setCustomers(customersData)
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    /* ================= CREATE ORDER ================= */

    async function handleCreateOrder() {
        if (!customerId || !productName || quantity <= 0 || unitPrice <= 0) {
            toast.error("Please fill all fields correctly")
            return
        }

        const items = [
            {
                product_name: productName,
                quantity,
                unit_price: unitPrice,
            },
        ]

        try {
            setSaving(true)

            const created = await apiFetch<Order>("/orders", {
                method: "POST",
                body: JSON.stringify({
                    customer_id: Number(customerId),
                    items,
                }),
            })

            created.items = items
            created.total = calculateTotal(items)

            setOrders(prev => [...prev, created])
            toast.success("Order created successfully")
            setOpen(false)

            setCustomerId("")
            setProductName("")
            setQuantity(1)
            setUnitPrice(0)
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setSaving(false)
        }
    }

    /* ================= CONFIRM ORDER ================= */

    async function confirmOrder(orderId: number) {
        try {
            const updated = await apiFetch<Order>(
                `/orders/${orderId}/confirm`,
                { method: "POST" }
            )

            setOrders(prev =>
                prev.map(o => (o.id === updated.id ? { ...o, status: updated.status } : o))
            )

            toast.success("Order confirmed")
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    /* ================= VIEW ORDER ================= */

    async function handleViewOrder(order: Order) {
        try {
            let fullOrder = order

            if (!order.items) {
                fullOrder = await apiFetch<Order>(`/orders/${order.id}`)
            }

            const total = calculateTotal(fullOrder.items)

            setOrders(prev =>
                prev.map(o =>
                    o.id === order.id ? { ...o, items: fullOrder.items, total } : o
                )
            )

            setViewOrder({ ...fullOrder, total })
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    /* ================= RENDER ================= */

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Orders</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage customer orders
                    </p>
                </div>

                <Button onClick={() => setOpen(true)}>Create Order</Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {loading && (
                            <TableRow>
                                <TableCell colSpan={5}>Loading...</TableCell>
                            </TableRow>
                        )}

                        {!loading &&
                            orders.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell>{order.id}</TableCell>

                                    <TableCell>
                                        {customerMap.get(order.customer_id) ??
                                            `Customer #${order.customer_id}`}
                                    </TableCell>

                                    <TableCell>
                                        {order.total ? order.total.toFixed(2) : "—"}
                                    </TableCell>

                                    <TableCell>
                                        <span
                                            className={`rounded-full px-2 py-1 text-xs font-medium
                        ${order.status === "CREATED"
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : order.status === "CONFIRMED"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-gray-100 text-gray-800"
                                                }`}
                                        >
                                            {order.status}
                                        </span>
                                    </TableCell>

                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleViewOrder(order)}
                                        >
                                            View
                                        </Button>

                                        {order.status === "CREATED" && (
                                            <Button
                                                size="sm"
                                                onClick={() => confirmOrder(order.id)}
                                            >
                                                Confirm
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </div>

            {/* Create Order Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Order</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <Label>Customer</Label>
                        <Select value={customerId} onValueChange={setCustomerId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                            <SelectContent>
                                {customers.map(c => (
                                    <SelectItem key={c.id} value={String(c.id)}>
                                        {c.name} - {c.id}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Label>Product Name</Label>
                        <Input value={productName} onChange={e => setProductName(e.target.value)} />

                        <div className="grid grid-cols-2 gap-4">
                            <Input type="number" value={quantity} onChange={e => setQuantity(+e.target.value)} />
                            <Input type="number" value={unitPrice} onChange={e => setUnitPrice(+e.target.value)} />
                        </div>

                        <Button onClick={handleCreateOrder} disabled={saving}>
                            {saving ? "Creating..." : "Create Order"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* View Items Dialog */}
            <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Order #{viewOrder?.id} Items</DialogTitle>
                    </DialogHeader>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Unit Price</TableHead>
                                <TableHead>Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {viewOrder?.items?.map((item, i) => (
                                <TableRow key={i}>
                                    <TableCell>{item.product_name}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>{item.unit_price}</TableCell>
                                    <TableCell>
                                        {(item.quantity * item.unit_price).toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </DialogContent>
            </Dialog>
        </div>
    )
}
