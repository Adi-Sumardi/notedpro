<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(private DashboardService $dashboardService) {}

    public function summary(Request $request): JsonResponse
    {
        $data = $this->dashboardService->getSummary();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function mySummary(Request $request): JsonResponse
    {
        $data = $this->dashboardService->getSummary($request->user());

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}
