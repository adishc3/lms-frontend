import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PaymentModal({ open, onClose, price, onPay, loading }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="max-w-md w-full bg-slate-900/90 border-slate-800">
        <CardHeader>
          <CardTitle>Course Payment</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-slate-300">This course requires payment to enroll.</p>
          <div className="mt-4 mb-6 flex items-center justify-between">
            <span className="text-sm text-slate-400">Amount</span>
            <span className="text-lg font-semibold">${price ?? "0.00"} USD</span>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={onPay} disabled={loading} className="bg-amber-500 text-slate-950 hover:bg-amber-400">
              {loading ? "Processing..." : "Pay now"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
