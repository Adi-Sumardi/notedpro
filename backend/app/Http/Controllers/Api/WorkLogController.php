<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\WorkLog\ReviewWorkLogRequest;
use App\Http\Requests\WorkLog\StoreWorkLogRequest;
use App\Http\Requests\WorkLog\UpdateWorkLogRequest;
use App\Http\Resources\DailyWorkLogResource;
use App\Models\DailyWorkLog;
use App\Services\WorkLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkLogController extends Controller
{
    public function __construct(private WorkLogService $workLogService) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', DailyWorkLog::class);

        $logs = $this->workLogService->list(
            $request->query(),
            $request->user()
        );

        return response()->json([
            'success' => true,
            'data' => DailyWorkLogResource::collection($logs),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }

    public function store(StoreWorkLogRequest $request): JsonResponse
    {
        $log = $this->workLogService->create(
            $request->validated(),
            $request->user()
        );

        return response()->json([
            'success' => true,
            'data' => new DailyWorkLogResource($log),
            'message' => 'Laporan harian berhasil dibuat.',
        ], 201);
    }

    public function show(DailyWorkLog $workLog): JsonResponse
    {
        $this->authorize('view', $workLog);

        $workLog->load(['user', 'reviewer', 'items']);

        return response()->json([
            'success' => true,
            'data' => new DailyWorkLogResource($workLog),
        ]);
    }

    public function update(UpdateWorkLogRequest $request, DailyWorkLog $workLog): JsonResponse
    {
        $log = $this->workLogService->update($workLog, $request->validated());

        return response()->json([
            'success' => true,
            'data' => new DailyWorkLogResource($log),
            'message' => 'Laporan harian berhasil diperbarui.',
        ]);
    }

    public function destroy(DailyWorkLog $workLog): JsonResponse
    {
        $this->authorize('delete', $workLog);

        $workLog->delete();

        return response()->json([
            'success' => true,
            'message' => 'Laporan harian berhasil dihapus.',
        ]);
    }

    public function submit(DailyWorkLog $workLog): JsonResponse
    {
        $this->authorize('submit', $workLog);

        $log = $this->workLogService->submit($workLog);

        return response()->json([
            'success' => true,
            'data' => new DailyWorkLogResource($log),
            'message' => 'Laporan harian berhasil diajukan untuk review.',
        ]);
    }

    public function review(ReviewWorkLogRequest $request, DailyWorkLog $workLog): JsonResponse
    {
        $log = $this->workLogService->review(
            $workLog,
            $request->validated(),
            $request->user()
        );

        return response()->json([
            'success' => true,
            'data' => new DailyWorkLogResource($log),
            'message' => "Laporan harian {$log->status->label()}.",
        ]);
    }
}
