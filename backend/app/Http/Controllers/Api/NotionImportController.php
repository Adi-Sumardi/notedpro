<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\NotionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class NotionImportController extends Controller
{
    public function __construct(private NotionService $notion) {}

    /**
     * Resolve a Notion page link/ID into a title + ready-to-store HTML,
     * without creating anything yet. The frontend uses this to pre-fill the
     * import row, then submits it through the existing atomic
     * POST /meetings/import endpoint just like a manually uploaded .md file.
     */
    public function preview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'source' => ['required', 'string', 'max:2000'],
        ]);

        try {
            $pageId = $this->notion->extractPageId($validated['source']);
            $result = $this->notion->fetchPageAsHtml($pageId);
        } catch (RuntimeException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }
}
