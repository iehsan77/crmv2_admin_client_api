import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Users, UserCheck } from "lucide-react";

export default function ProfileStats({ record = [] }) {

  const stats = [
    {
      title: "Permissions",
      value: record?.permissions?.length || 0,
      description: "all assigned permissions",
      icon: UserCheck,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "All Users",
      value: record?.users?.length || 0,
      description: "users assigned to this profile",
      icon: Users,
      color: "text-[#1E3A8A]",
      bgColor: "bg-blue-100",
    },
  ];

  return (
    <>
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-5/8 p-4 overflow-y-auto ">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-1">
              Profile: {record?.title || "Untitled"}
            </h2>
            <p className="text-sm text-gray-600">
              {record?.excerpt || "No description available."}
            </p>
          </div>
        </div>
        <div className="w-full md:w-3/8 p-4 flex flex-col items-center relative">
          <div className="container mx-auto py-2">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              {stats.map((stat) => (
                <Card
                  key={stat.title}
                  className="h-[140px]_ transition-all gap-0 py-3 duration-200 hover:shadow-lg hover:scale-[1.02]"
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y- pb-1">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-full ${stat.bgColor}`}>
                      <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-gray-500">{stat.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
