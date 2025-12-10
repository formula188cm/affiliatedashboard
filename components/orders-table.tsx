"use client"

import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"

interface Order {
  id: string
  name: string
  phone: string
  address: string
  price: number
  referralCode: string
  status: "pending" | "completed" | "rejected"
}

interface OrdersTableProps {
  orders: Order[]
  onApprove: (orderId: string) => Promise<void>
  onReject: (orderId: string) => Promise<void>
}

export function OrdersTable({ orders, onApprove, onReject }: OrdersTableProps) {
  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 border border-yellow-300",
      completed: "bg-green-100 text-green-800 border border-green-300",
      rejected: "bg-red-100 text-red-800 border border-red-300",
    }
    return styles[status as keyof typeof styles] || styles.pending
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="text-left py-3 px-4 font-semibold">Name</th>
            <th className="text-left py-3 px-4 font-semibold hidden sm:table-cell">Phone</th>
            <th className="text-left py-3 px-4 font-semibold hidden lg:table-cell">Address</th>
            <th className="text-right py-3 px-4 font-semibold">Price</th>
            <th className="text-left py-3 px-4 font-semibold">Code</th>
            <th className="text-center py-3 px-4 font-semibold">Status</th>
            <th className="text-center py-3 px-4 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-8 text-muted-foreground">
                No orders found
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr key={order.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="py-3 px-4 font-medium">{order.name}</td>
                <td className="py-3 px-4 hidden sm:table-cell text-muted-foreground">{order.phone}</td>
                <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground truncate max-w-xs">
                  {order.address}
                </td>
                <td className="py-3 px-4 font-semibold text-right">₹{order.price.toFixed(0)}</td>
                <td className="py-3 px-4 font-mono text-primary text-sm">{order.referralCode}</td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${getStatusBadge(order.status)}`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex gap-1 justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onApprove(order.id)}
                      className={
                        order.status === "completed"
                          ? "hover:bg-green-100 hover:text-green-700 bg-green-50 text-green-700"
                          : "hover:bg-green-100 hover:text-green-700"
                      }
                      title={order.status === "completed" ? "Undo approval" : "Approve order"}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onReject(order.id)}
                      className={
                        order.status === "rejected"
                          ? "hover:bg-red-100 hover:text-red-700 bg-red-50 text-red-700"
                          : "hover:bg-red-100 hover:text-red-700"
                      }
                      title={order.status === "rejected" ? "Undo rejection" : "Reject order"}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
