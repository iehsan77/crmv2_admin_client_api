"use client";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import {
  ArrowUpRight,
  Home,
  ClipboardList,
  DollarSign,
  Users,
} from "lucide-react";

export default function CardGrid() {
  const cards = [
    {
      title: "Total Properties",
      value: "155",
      change: "8 new this month",
      icon: <Home className="h-7 w-7 text-[#1E3A8A]" />,
      iconBg: "bg-blue-100",
    },
    {
      title: "Active Projects",
      value: "12",
      change: "3 new this month",
      icon: <ClipboardList className="h-7 w-7 text-purple-600" />,
      iconBg: "bg-purple-100",
    },
    {
      title: "Total Revenue",
      value: "$520K",
      change: "12% from last month",
      icon: <DollarSign className="h-7 w-7 text-green-600" />,
      iconBg: "bg-green-100",
    },
    {
      title: "Active Users",
      value: "2,847",
      change: "12% increase",
      icon: <Users className="h-7 w-7 text-pink-600" />,
      iconBg: "bg-pink-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {cards.map((card, index) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {card.title}
                </p>
                <h2 className="text-3xl font-bold mt-3">{card.value}</h2>
                <div className="flex items-center mt-3 text-green-600">
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  <span className="text-sm">{card.change}</span>
                </div>
              </div>
              <div
                className={`h-14 w-14 rounded-full ${card.iconBg} flex items-center justify-center`}
              >
                {card.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
