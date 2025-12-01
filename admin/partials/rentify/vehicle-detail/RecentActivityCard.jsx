import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { BellIcon } from "lucide-react"
// import { BellIcon } from "@radix-ui/react-icons"

const activity = [
  { message: "Toyota Camry 2022 rented for AED 1,200", time: "5 minutes ago" },
  { message: "Range Rover Sport 2023 listed for Rent at AED 380K", time: "12 minutes ago" }
]

export default function RecentActivityCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {activity.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <BellIcon className="text-primary" />
              </div>
              <div>
                <p className="text-sm">{item.message}</p>
                <p className="text-xs text-muted-foreground">{item.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}