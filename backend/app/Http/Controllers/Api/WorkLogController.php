<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\WorkLog\ReviewWorkLogRequest;
use App\Http\Requests\WorkLog\StoreWorkLogRequest;
use App\Http\Requests\WorkLog\UpdateWorkLogRequest;
use App\Http\Resources\DailyWorkLogResource;
use App\Models\DailyWorkLog;
use App\Models\WorkLogAttachment;
use App\Services\WorkLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

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
        $validated = $request->validated();
        $files = $request->file('attachments', []);
        $links = $validated['links'] ?? [];

        $log = $this->workLogService->create(
            $validated,
            $request->user(),
            $files,
            $links
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

        $workLog->load(['user', 'reviewer', 'items', 'attachments']);

        return response()->json([
            'success' => true,
            'data' => new DailyWorkLogResource($workLog),
        ]);
    }

    public function update(UpdateWorkLogRequest $request, DailyWorkLog $workLog): JsonResponse
    {
        $validated = $request->validated();
        $files = $request->file('attachments', []);
        $links = $validated['links'] ?? [];
        $keepIds = $validated['existing_attachment_ids'] ?? null;

        $log = $this->workLogService->update(
            $workLog,
            $validated,
            $files,
            $links,
            $keepIds
        );

        return response()->json([
            'success' => true,
            'data' => new DailyWorkLogResource($log),
            'message' => 'Laporan harian berhasil diperbarui.',
        ]);
    }

    public function destroy(DailyWorkLog $workLog): JsonResponse
    {
        $this->authorize('delete', $workLog);

        // Delete attachment files
        foreach ($workLog->attachments as $att) {
            if ($att->type === 'file' && $att->file_path) {
                Storage::disk('public')->delete($att->file_path);
            }
        }

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

    public function downloadAttachment(WorkLogAttachment $attachment): StreamedResponse
    {
        if ($attachment->type !== 'file' || !$attachment->file_path) {
            abort(404);
        }

        return Storage::disk('public')->download(
            $attachment->file_path,
            $attachment->original_name
        );
    }
}
