import { Bell, Clock3, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export function NotificationsPanel({ notifications }) {
  return (
    <Card className="bg-slate-900/60 border border-slate-800 mb-8">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-cyan-300 font-semibold">
            <Bell className="w-4 h-4" />
            Notifications
          </div>
          <CardTitle className="text-lg text-white mt-2">Stay informed about your activity</CardTitle>
        </div>
        <CardDescription className="text-slate-400">
          Latest updates on assignments, lesson completion, and course progress.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-800 p-6 text-center text-slate-400">
            <CheckCircle2 className="mx-auto mb-3 w-8 h-8 text-slate-500" />
            <p className="font-medium">No new notifications</p>
            <p className="text-sm text-slate-500">You are all caught up for now.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div key={notification.id} className="rounded-3xl border border-slate-800 p-4 bg-slate-950/90">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-300 font-semibold">{notification.title}</p>
                  <p className="mt-2 text-sm text-slate-400">{notification.message}</p>
                </div>
                <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                  {notification.is_read ? "Read" : "New"}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <Clock3 className="w-3.5 h-3.5" />
                <span>{new Date(notification.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
