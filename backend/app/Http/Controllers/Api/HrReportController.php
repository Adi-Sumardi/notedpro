<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\HrReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HrReportController extends Controller
{
    public function __construct(private HrReportService $hrReportService) {}

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
            'user_id' => ['nullable', 'exists:users,id'],
            'department' => ['nullable', 'string'],
        ]);

        $report = $this->hrReportService->getEmployeeReport($request->query());

        return response()->json([
            'success' => true,
            'data' => $report,
        ]);
    }

    public function departments(): JsonResponse
    {
        $departments = $this->hrReportService->getDepartments();

        return response()->json([
            'success' => true,
            'data' => $departments,
        ]);
    }
}
