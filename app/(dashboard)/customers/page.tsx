"use client"

import { useEffect, useState } from "react"
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
import { Pencil } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/lib/api"

type Customer = {
    id: number
    name: string
    email: string
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)

    // dialog state
    const [open, setOpen] = useState(false)
    const [editingCustomer, setEditingCustomer] =
        useState<Customer | null>(null)

    // form state
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [saving, setSaving] = useState(false)

    // -----------------------------
    // Load customers
    // -----------------------------
    async function loadCustomers() {
        try {
            setLoading(true)
            const data = await apiFetch<Customer[]>("/customers")
            setCustomers(data)
        } catch {
            toast.error("Failed to load customers")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadCustomers()
    }, [])

    // -----------------------------
    // Open create dialog
    // -----------------------------
    function openCreateDialog() {
        setEditingCustomer(null)
        setName("")
        setEmail("")
        setOpen(true)
    }

    // -----------------------------
    // Open edit dialog
    // -----------------------------
    function openEditDialog(customer: Customer) {
        setEditingCustomer(customer)
        setName(customer.name)
        setEmail(customer.email)
        setOpen(true)
    }

    // -----------------------------
    // Save (create or update)
    // -----------------------------
    async function handleSave() {
        if (!name || !email) return

        try {
            setSaving(true)

            if (editingCustomer) {
                const updated = await apiFetch<Customer>(
                    `/customers/${editingCustomer.id}`,
                    {
                        method: "PUT",
                        body: JSON.stringify({ name, email }),
                    }
                )

                setCustomers(prev =>
                    prev.map(c => (c.id === updated.id ? updated : c))
                )

                toast.success("Customer updated successfully")
            } else {
                const created = await apiFetch<Customer>("/customers", {
                    method: "POST",
                    body: JSON.stringify({ name, email }),
                })

                setCustomers(prev => [...prev, created])
                toast.success("Customer created successfully")
            }

            setOpen(false)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
                toast.error(err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Customers</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage your customers
                    </p>
                </div>

                <Button onClick={openCreateDialog}>
                    Create Customer
                </Button>
            </div>

            {/* Customers Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {loading && (
                            <TableRow>
                                <TableCell colSpan={4}>Loading...</TableCell>
                            </TableRow>
                        )}

                        {!loading &&
                            customers.map(customer => (
                                <TableRow key={customer.id}>
                                    <TableCell>{customer.id}</TableCell>
                                    <TableCell>{customer.name}</TableCell>
                                    <TableCell>{customer.email}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                openEditDialog(customer)
                                            }
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}

                        {!loading && customers.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="text-center"
                                >
                                    No customers found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Create / Edit Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingCustomer
                                ? "Edit Customer"
                                : "Create Customer"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>

                        <Button onClick={handleSave} disabled={saving}>
                            {saving
                                ? "Saving..."
                                : editingCustomer
                                    ? "Update"
                                    : "Create"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
