"use client";

import { useState } from "react";
import { useHrReport, useDepartments } from "@/hooks/useHrReport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, CheckCircle, AlertTriangle } from "lucide-react";

export default function HrReportPage() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  const [dateFrom, setDateFrom] = useState(firstDay.toISOString().split("T")[0]);
  const [dateTo, setDateTo] = useState(today.toISOString().split("T")[0]);
  const [department, setDepartment] = useState("");

  const params: Record<string, string> = {};
  if (dateFrom) params.date_from = dateFrom;
  if (dateTo) params.date_to = dateTo;
  if (department && department !== "all") params.department = department;

  const { data: report, isLoading } = useHrReport(params);
  const { data: departments } = useDepartments();

  const totalEmployees = report?.employees.length ?? 0;
  const totalTasks = report?.employees.reduce((sum, e) => sum + e.tasks.total, 0) ?? 0;
  const totalCompleted = report?.employees.reduce((sum, e) => sum + e.tasks.completed, 0) ?? 0;
  const totalOverdue = report?.employees.reduce((sum, e) => sum + e.tasks.overdue, 0) ?? 0;
  const avgCompletion = totalEmployees > 0
    ? (report!.employees.reduce((sum, e) => sum + e.tasks.completion_rate, 0) / totalEmployees).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rekap Kinerja Karyawan</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ringkasan tugas dan laporan harian per karyawan
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Dari Tanggal</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Sampai Tanggal</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Departemen</label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Departemen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Departemen</SelectItem>
                  {departments?.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2.5">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
                <p className="text-xs text-gray-500">Karyawan</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2.5">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
                <p className="text-xs text-gray-500">Total Tugas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2.5">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalCompleted}</p>
                <p className="text-xs text-gray-500">Selesai</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2.5">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalOverdue}</p>
                <p className="text-xs text-gray-500">Terlambat</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detail Per Karyawan</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-gray-500">Memuat data...</div>
          ) : !report?.employees.length ? (
            <div className="py-12 text-center text-gray-500">Tidak ada data karyawan</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Karyawan</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">Total Tugas</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">Selesai</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">Progress</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">Review</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">Terlambat</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">Completion</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-700">Laporan Harian</th>
                  </tr>
                </thead>
                <tbody>
                  {report.employees.map((emp) => (
                    <tr key={emp.user.id} className="border-b hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{emp.user.name}</p>
                          <p className="text-xs text-gray-500">
                            {emp.user.position} &middot; {emp.user.department}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-medium">{emp.tasks.total}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {emp.tasks.completed}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {emp.tasks.in_progress}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          {emp.tasks.review}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {emp.tasks.overdue > 0 ? (
                          <Badge variant="destructive">{emp.tasks.overdue}</Badge>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CompletionBar rate={emp.tasks.completion_rate} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="text-xs">
                          <span className="font-medium">{emp.work_logs.approved}</span>
                          <span className="text-gray-400">/{emp.work_logs.total}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-gray-50 font-medium">
                    <td className="px-4 py-3">Total ({totalEmployees} karyawan)</td>
                    <td className="px-4 py-3 text-center">{totalTasks}</td>
                    <td className="px-4 py-3 text-center">{totalCompleted}</td>
                    <td className="px-4 py-3 text-center">
                      {report.employees.reduce((s, e) => s + e.tasks.in_progress, 0)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {report.employees.reduce((s, e) => s + e.tasks.review, 0)}
                    </td>
                    <td className="px-4 py-3 text-center">{totalOverdue}</td>
                    <td className="px-4 py-3 text-center">{avgCompletion}%</td>
                    <td className="px-4 py-3 text-center">
                      {report.employees.reduce((s, e) => s + e.work_logs.approved, 0)}/
                      {report.employees.reduce((s, e) => s + e.work_logs.total, 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CompletionBar({ rate }: { rate: number }) {
  const color =
    rate >= 80 ? "bg-green-500" : rate >= 50 ? "bg-yellow-500" : rate > 0 ? "bg-red-500" : "bg-gray-200";

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-16 rounded-full bg-gray-200">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.min(rate, 100)}%` }} />
      </div>
      <span className="text-xs font-medium">{rate}%</span>
    </div>
  );
}
