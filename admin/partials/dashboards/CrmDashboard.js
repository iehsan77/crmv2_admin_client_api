"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, LineChart as LineChartIcon } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Legend,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { useState } from "react";

// Enhanced sample data with more metrics
const propertyData = {
  occupancyRate: [
    { name: "Jan", rate: 85, target: 90 },
    { name: "Feb", rate: 88, target: 90 },
    { name: "Mar", rate: 92, target: 90 },
    { name: "Apr", rate: 90, target: 90 },
    { name: "May", rate: 95, target: 90 },
    { name: "Jun", rate: 93, target: 90 },
  ],
  revenue: [
    { name: "Jan", amount: 40000, target: 45000 },
    { name: "Feb", amount: 45000, target: 45000 },
    { name: "Mar", amount: 50000, target: 45000 },
    { name: "Apr", amount: 48000, target: 45000 },
    { name: "May", amount: 55000, target: 45000 },
    { name: "Jun", amount: 52000, target: 45000 },
  ],
  propertyTypes: [
    { name: "Apartments", value: 45, target: 50 },
    { name: "Houses", value: 30, target: 35 },
    { name: "Condos", value: 25, target: 25 },
  ],
  maintenance: [
    { name: "Jan", completed: 12, pending: 5, critical: 2 },
    { name: "Feb", completed: 15, pending: 3, critical: 1 },
    { name: "Mar", completed: 18, pending: 2, critical: 0 },
    { name: "Apr", completed: 14, pending: 4, critical: 1 },
    { name: "May", completed: 20, pending: 1, critical: 0 },
    { name: "Jun", completed: 16, pending: 3, critical: 1 },
  ],
  performance: [
    { name: "Occupancy", value: 92 },
    { name: "Revenue", value: 88 },
    { name: "Maintenance", value: 95 },
    { name: "Customer Satisfaction", value: 90 },
    { name: "Efficiency", value: 85 },
  ],
};

const projectData = {
  progress: [
    { name: "Jan", completed: 65, inProgress: 25, delayed: 10, target: 70 },
    { name: "Feb", completed: 70, inProgress: 20, delayed: 10, target: 75 },
    { name: "Mar", completed: 75, inProgress: 15, delayed: 10, target: 80 },
    { name: "Apr", completed: 80, inProgress: 15, delayed: 5, target: 85 },
    { name: "May", completed: 85, inProgress: 10, delayed: 5, target: 90 },
    { name: "Jun", completed: 90, inProgress: 8, delayed: 2, target: 95 },
  ],
  timeline: [
    { name: "Jan", planned: 100, actual: 95, efficiency: 95 },
    { name: "Feb", planned: 100, actual: 98, efficiency: 98 },
    { name: "Mar", planned: 100, actual: 97, efficiency: 97 },
    { name: "Apr", planned: 100, actual: 99, efficiency: 99 },
    { name: "May", planned: 100, actual: 100, efficiency: 100 },
    { name: "Jun", planned: 100, actual: 100, efficiency: 100 },
  ],
  budget: [
    { name: "Jan", allocated: 500000, spent: 450000, savings: 50000 },
    { name: "Feb", allocated: 550000, spent: 520000, savings: 30000 },
    { name: "Mar", allocated: 600000, spent: 580000, savings: 20000 },
    { name: "Apr", allocated: 650000, spent: 620000, savings: 30000 },
    { name: "May", allocated: 700000, spent: 680000, savings: 20000 },
    { name: "Jun", allocated: 750000, spent: 720000, savings: 30000 },
  ],
  performance: [
    { name: "Timeline", value: 95 },
    { name: "Budget", value: 92 },
    { name: "Quality", value: 90 },
    { name: "Team Performance", value: 88 },
    { name: "Client Satisfaction", value: 94 },
  ],
};

const userData = {
  growth: [
    { name: "Jan", users: 120, active: 100, new: 20 },
    { name: "Feb", users: 150, active: 130, new: 30 },
    { name: "Mar", users: 180, active: 160, new: 30 },
    { name: "Apr", users: 220, active: 200, new: 40 },
    { name: "May", users: 250, active: 230, new: 30 },
    { name: "Jun", users: 300, active: 280, new: 50 },
  ],
  activity: [
    { name: "Jan", logins: 800, actions: 1200, sessions: 600 },
    { name: "Feb", logins: 950, actions: 1400, sessions: 750 },
    { name: "Mar", logins: 1100, actions: 1600, sessions: 900 },
    { name: "Apr", logins: 1300, actions: 1800, sessions: 1100 },
    { name: "May", logins: 1500, actions: 2000, sessions: 1300 },
    { name: "Jun", logins: 1800, actions: 2400, sessions: 1600 },
  ],
  performance: [
    { name: "Productivity", value: 92 },
    { name: "Engagement", value: 88 },
    { name: "Collaboration", value: 90 },
    { name: "Task Completion", value: 95 },
    { name: "Communication", value: 87 },
  ],
};

const COLORS = [
  "#2563EB",
  "#7C3AED",
  "#DB2777",
  "#059669",
  "#D97706",
  "#DC2626",
];

// Enhanced property data
const properties = [
  {
    id: 1,
    name: "Luxury Apartment Complex",
    type: "Apartment",
    status: "Occupied",
    location: "Downtown",
    units: 50,
    occupied: 45,
    revenue: "$125,000",
    maintenance: "Good",
    rating: 4.8,
    occupancyRate: 90,
    monthlyGrowth: 5,
    lastInspection: "2024-02-15",
    nextInspection: "2024-05-15",
  },
  {
    id: 2,
    name: "Modern Condo Tower",
    type: "Condo",
    status: "Available",
    location: "Uptown",
    units: 30,
    occupied: 25,
    revenue: "$85,000",
    maintenance: "Excellent",
    rating: 4.9,
    occupancyRate: 83,
    monthlyGrowth: 3,
    lastInspection: "2024-03-01",
    nextInspection: "2024-06-01",
  },
  {
    id: 3,
    name: "Family Homes",
    type: "House",
    status: "Maintenance",
    location: "Suburbs",
    units: 20,
    occupied: 18,
    revenue: "$65,000",
    maintenance: "Needs Attention",
    rating: 4.2,
    occupancyRate: 90,
    monthlyGrowth: -2,
    lastInspection: "2024-01-15",
    nextInspection: "2024-04-15",
  },
];

// Enhanced user activity data
const userActivities = [
  {
    id: 1,
    user: "John Doe",
    role: "Property Manager",
    action: "Property View",
    target: "Luxury Apartment Complex",
    time: "2 hours ago",
    status: "Completed",
    impact: "High",
    details: "Reviewed occupancy reports and maintenance schedules",
  },
  {
    id: 2,
    user: "Jane Smith",
    role: "Project Manager",
    action: "Project Update",
    target: "Business District Office Park",
    time: "4 hours ago",
    status: "In Progress",
    impact: "Medium",
    details: "Updated project timeline and resource allocation",
  },
  {
    id: 3,
    user: "Mike Johnson",
    role: "Maintenance Supervisor",
    action: "Document Upload",
    target: "Industrial Warehouse Complex",
    time: "1 day ago",
    status: "Completed",
    impact: "Low",
    details: "Uploaded maintenance inspection reports",
  },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border rounded-lg shadow-lg">
        <p className="font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
            {entry.unit || ""}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

import CardGrid from "@/components/Dashboard/CardGrid";
import CrmButtons from "@/components/Dashboard/CrmButtons";

export default function CrmDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="h-full space-y-8">
      <CardGrid />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader className="pb-6">
            <CardTitle className="text-xl">Revenue Overview</CardTitle>
            <CardDescription className="mt-2">
              Monthly revenue trends and targets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={propertyData.revenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    name="Revenue"
                    stroke="#2563EB"
                    fill="#2563EB"
                    fillOpacity={0.2}
                  />
                  <Area
                    type="monotone"
                    dataKey="target"
                    name="Target"
                    stroke="#7C3AED"
                    fill="#7C3AED"
                    fillOpacity={0.1}
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>User acquisition and activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userData.growth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="users"
                    name="Total Users"
                    stroke="#7C3AED"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="active"
                    name="Active Users"
                    stroke="#059669"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="new"
                    name="New Users"
                    stroke="#DB2777"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Property Performance</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={propertyData.performance}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" />
                  <PolarRadiusAxis />
                  <Radar
                    name="Performance"
                    dataKey="value"
                    stroke="#2563EB"
                    fill="#2563EB"
                    fillOpacity={0.2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
            <CardDescription>Overall project status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectData.progress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="completed"
                    name="Completed"
                    fill="#059669"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="inProgress"
                    name="In Progress"
                    fill="#2563EB"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="delayed"
                    name="Delayed"
                    fill="#DC2626"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance Overview</CardTitle>
            <CardDescription>Maintenance tasks and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={propertyData.maintenance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    name="Completed"
                    stroke="#059669"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pending"
                    name="Pending"
                    stroke="#DC2626"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="critical"
                    name="Critical"
                    stroke="#DB2777"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-6">
          <div>
            <CardTitle className="text-xl">Recent Activity</CardTitle>
            <CardDescription className="mt-2">
              Latest updates and actions
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" className="px-5">
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-5">User</TableHead>
                <TableHead className="py-5">Role</TableHead>
                <TableHead className="py-5">Action</TableHead>
                <TableHead className="py-5">Target</TableHead>
                <TableHead className="py-5">Time</TableHead>
                <TableHead className="py-5">Status</TableHead>
                <TableHead className="py-5">Impact</TableHead>
                <TableHead className="py-5">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userActivities.map((activity) => (
                <TableRow key={activity.id} className="hover:bg-gray-50">
                  <TableCell className="py-5">{activity.user}</TableCell>
                  <TableCell className="py-5">{activity.role}</TableCell>
                  <TableCell className="py-5">{activity.action}</TableCell>
                  <TableCell className="py-5">{activity.target}</TableCell>
                  <TableCell className="py-5">{activity.time}</TableCell>
                  <TableCell className="py-5">
                    <Badge
                      variant={
                        activity.status === "Completed"
                          ? "secondary"
                          : "default"
                      }
                      className="px-3 py-1"
                    >
                      {activity.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-5">
                    <Badge
                      variant={
                        activity.impact === "High"
                          ? "destructive"
                          : activity.impact === "Medium"
                          ? "secondary"
                          : "default"
                      }
                      className="px-3 py-1"
                    >
                      {activity.impact}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-5">
                    <Button variant="ghost" size="sm" className="px-3">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
