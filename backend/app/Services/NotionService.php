<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class NotionService
{
    private const API_BASE = 'https://api.notion.com/v1';
    private const NOTION_VERSION = '2022-06-28';

    private string $token;

    public function __construct()
    {
        $this->token = (string) config('services.notion.token');
    }

    /**
     * Accepts a raw Notion page ID or a full page URL (with or without
     * dashes in the ID, with or without a workspace slug / query string)
     * and returns the ID formatted as a dashed UUID, as required by the API.
     */
    public function extractPageId(string $source): string
    {
        // Drop any query string / fragment first — e.g. "?source=copy_link"
        // or "?pvs=4" contain stray hex-looking letters (c, e, a, ...) that,
        // if left in, get concatenated onto the stripped hex string and
        // shift which 32 characters are picked up as the "page id",
        // silently corrupting it.
        $path = preg_split('/[?#]/', trim($source), 2)[0];

        $hex = preg_replace('/[^a-fA-F0-9]/', '', $path) ?? '';

        if (strlen($hex) < 32) {
            throw ValidationException::withMessages([
                'source' => 'Link atau ID Notion tidak valid. Pastikan sudah menyalin link halaman Notion yang benar.',
            ]);
        }

        $hex = substr($hex, -32);

        return sprintf(
            '%s-%s-%s-%s-%s',
            substr($hex, 0, 8),
            substr($hex, 8, 4),
            substr($hex, 12, 4),
            substr($hex, 16, 4),
            substr($hex, 20, 12)
        );
    }

    /**
     * Fetch a Notion page's title and full block content as ready-to-store
     * HTML. Children are resolved recursively with proper cursor-based
     * pagination (has_more / next_cursor) at every level, and any images are
     * downloaded server-side into our own public storage immediately — so
     * the returned HTML never depends on Notion's short-lived signed URLs.
     */
    public function fetchPageAsHtml(string $pageId): array
    {
        $page = $this->request("/pages/{$pageId}");
        $title = $this->extractTitle($page);
        $meetingDate = $this->extractDateTime($page);

        $blocks = $this->fetchAllChildren($pageId);
        $html = $this->blocksToHtml($blocks);

        return [
            'title' => $title,
            'meeting_date' => $meetingDate,
            'content_html' => $html,
        ];
    }

    private function request(string $path, array $query = []): array
    {
        if (! $this->token) {
            throw new RuntimeException('NOTION_API_TOKEN belum dikonfigurasi di server.');
        }

        $attempt = 0;

        do {
            $response = Http::withToken($this->token)
                ->withHeaders(['Notion-Version' => self::NOTION_VERSION])
                ->get(self::API_BASE.$path, array_filter($query, fn ($v) => $v !== null));

            if ($response->status() === 429 && $attempt < 3) {
                sleep(max(1, (int) ($response->header('Retry-After') ?: 1)));
                $attempt++;

                continue;
            }

            break;
        } while (true);

        if ($response->status() === 401) {
            throw new RuntimeException('Token integrasi Notion tidak valid atau kedaluwarsa.');
        }

        if ($response->status() === 404) {
            throw new RuntimeException('Halaman Notion tidak ditemukan. Pastikan halaman sudah di-share ke integration yang dipakai aplikasi ini (klik ••• > Connections di halaman Notion tersebut).');
        }

        if ($response->failed()) {
            throw new RuntimeException('Gagal mengambil data dari Notion: '.($response->json('message') ?? $response->body()));
        }

        return $response->json();
    }

    private function extractTitle(array $page): string
    {
        foreach ($page['properties'] ?? [] as $property) {
            if (($property['type'] ?? null) === 'title') {
                return collect($property['title'] ?? [])->pluck('plain_text')->implode('') ?: 'Untitled';
            }
        }

        return 'Untitled';
    }

    /**
     * Look for a "date" type property on the page (common on Notion database
     * rows used for meeting notes, e.g. "Event time" / "Date" / "Tanggal")
     * and return it as a "YYYY-MM-DDTHH:mm" string suitable for an HTML
     * datetime-local input. Prefers properties whose name suggests it's the
     * meeting's own date over unrelated date properties, falling back to
     * whichever date property is found first.
     */
    private function extractDateTime(array $page): ?string
    {
        $preferredNames = ['event time', 'meeting date', 'tanggal & waktu', 'waktu', 'tanggal', 'date'];
        $dateProps = [];

        foreach ($page['properties'] ?? [] as $name => $property) {
            if (($property['type'] ?? null) === 'date' && ! empty($property['date']['start'])) {
                $dateProps[strtolower($name)] = $property['date']['start'];
            }
        }

        if (empty($dateProps)) {
            return null;
        }

        foreach ($preferredNames as $preferred) {
            foreach ($dateProps as $name => $start) {
                if (str_contains($name, $preferred)) {
                    return $this->toDatetimeLocal($start);
                }
            }
        }

        return $this->toDatetimeLocal(reset($dateProps));
    }

    private function toDatetimeLocal(string $start): string
    {
        // Notion's date.start is either "2026-07-21" (date-only) or
        // "2026-07-21T10:00:00.000+07:00" (date + time + offset).
        if (strlen($start) === 10) {
            return $start.'T00:00';
        }

        return substr($start, 0, 16);
    }

    private function fetchAllChildren(string $blockId): array
    {
        $all = [];
        $cursor = null;

        do {
            $page = $this->request("/blocks/{$blockId}/children", [
                'page_size' => 100,
                'start_cursor' => $cursor,
            ]);
            $all = array_merge($all, $page['results'] ?? []);
            $cursor = ($page['has_more'] ?? false) ? ($page['next_cursor'] ?? null) : null;
        } while ($cursor);

        foreach ($all as &$block) {
            if (! empty($block['has_children'])) {
                $block['_children'] = $this->fetchAllChildren($block['id']);
            }
        }

        return $all;
    }

    private function blocksToHtml(array $blocks): string
    {
        $html = '';
        $i = 0;
        $n = count($blocks);

        while ($i < $n) {
            $type = $blocks[$i]['type'] ?? null;

            if ($type === 'bulleted_list_item' || $type === 'numbered_list_item') {
                $tag = $type === 'bulleted_list_item' ? 'ul' : 'ol';
                [$listHtml, $i] = $this->consumeList($blocks, $i, $type, $tag);
                $html .= $listHtml;

                continue;
            }

            $html .= $this->blockToHtml($blocks[$i]);
            $i++;
        }

        return $html;
    }

    private function consumeList(array $blocks, int $start, string $type, string $tag): array
    {
        $items = '';
        $i = $start;
        $n = count($blocks);

        while ($i < $n && ($blocks[$i]['type'] ?? null) === $type) {
            $text = $this->richTextToHtml($blocks[$i][$type]['rich_text'] ?? []);
            $children = ! empty($blocks[$i]['_children']) ? $this->blocksToHtml($blocks[$i]['_children']) : '';
            $items .= "<li>{$text}{$children}</li>";
            $i++;
        }

        return ["<{$tag}>{$items}</{$tag}>", $i];
    }

    private function blockToHtml(array $block): string
    {
        $type = $block['type'] ?? null;
        $data = $block[$type] ?? [];
        $childrenHtml = ! empty($block['_children']) ? $this->blocksToHtml($block['_children']) : '';

        return match ($type) {
            'paragraph' => '<p>'.$this->richTextToHtml($data['rich_text'] ?? []).'</p>'.$childrenHtml,
            'heading_1' => '<h1>'.$this->richTextToHtml($data['rich_text'] ?? []).'</h1>',
            'heading_2' => '<h2>'.$this->richTextToHtml($data['rich_text'] ?? []).'</h2>',
            'heading_3' => '<h3>'.$this->richTextToHtml($data['rich_text'] ?? []).'</h3>',
            'quote' => '<blockquote><p>'.$this->richTextToHtml($data['rich_text'] ?? []).'</p></blockquote>',
            'callout' => '<blockquote><p>'.$this->richTextToHtml($data['rich_text'] ?? []).'</p></blockquote>'.$childrenHtml,
            'code' => '<pre><code>'.e($this->plainText($data['rich_text'] ?? [])).'</code></pre>',
            'divider' => '<hr>',
            'to_do' => '<p>'.(($data['checked'] ?? false) ? '&#9745; ' : '&#9744; ').$this->richTextToHtml($data['rich_text'] ?? []).'</p>'.$childrenHtml,
            'toggle' => '<details><summary>'.$this->richTextToHtml($data['rich_text'] ?? []).'</summary>'.$childrenHtml.'</details>',
            'image' => $this->imageBlockToHtml($data),
            'table' => $this->tableBlockToHtml($block),
            'bookmark', 'link_preview' => isset($data['url'])
                ? '<p><a href="'.e($data['url']).'">'.e($data['url']).'</a></p>'
                : '',
            default => $childrenHtml,
        };
    }

    private function tableBlockToHtml(array $block): string
    {
        $rows = $block['_children'] ?? [];
        if (empty($rows)) {
            return '';
        }

        $hasHeader = $block['table']['has_column_header'] ?? false;
        $htmlRows = [];

        foreach ($rows as $index => $row) {
            $cells = $row['table_row']['cells'] ?? [];
            $cellTag = ($hasHeader && $index === 0) ? 'th' : 'td';
            $cellsHtml = collect($cells)
                ->map(fn ($cell) => "<{$cellTag}>".$this->richTextToHtml($cell)."</{$cellTag}>")
                ->implode('');
            $htmlRows[] = "<tr>{$cellsHtml}</tr>";
        }

        return '<table><tbody>'.implode('', $htmlRows).'</tbody></table>';
    }

    private function imageBlockToHtml(array $data): string
    {
        $fileType = $data['type'] ?? null;
        $sourceUrl = $fileType === 'external' ? ($data['external']['url'] ?? null) : ($data['file']['url'] ?? null);

        if (! $sourceUrl) {
            return '';
        }

        $storedUrl = $this->downloadAndStoreImage($sourceUrl);
        $caption = $this->plainText($data['caption'] ?? []);

        return '<img src="'.e($storedUrl ?? $sourceUrl).'" alt="'.e($caption ?: 'image').'">';
    }

    private function downloadAndStoreImage(string $url): ?string
    {
        try {
            $response = Http::timeout(15)->get($url);
            if ($response->failed()) {
                return null;
            }

            $contentType = $response->header('Content-Type', 'image/jpeg');
            $ext = match (true) {
                str_contains($contentType, 'png') => 'png',
                str_contains($contentType, 'gif') => 'gif',
                str_contains($contentType, 'webp') => 'webp',
                default => 'jpg',
            };

            $path = 'notes/images/notion-import/'.Str::uuid().'.'.$ext;
            Storage::disk('public')->put($path, $response->body());

            return url('storage/'.$path);
        } catch (Throwable) {
            return null;
        }
    }

    private function richTextToHtml(array $richText): string
    {
        return collect($richText)->map(function (array $segment) {
            $text = e($segment['plain_text'] ?? '');
            $annotations = $segment['annotations'] ?? [];

            if ($annotations['code'] ?? false) {
                $text = "<code>{$text}</code>";
            }
            if ($annotations['bold'] ?? false) {
                $text = "<strong>{$text}</strong>";
            }
            if ($annotations['italic'] ?? false) {
                $text = "<em>{$text}</em>";
            }
            if ($annotations['strikethrough'] ?? false) {
                $text = "<s>{$text}</s>";
            }

            $href = $segment['href'] ?? null;
            if ($href) {
                $text = '<a href="'.e($href).'">'.$text.'</a>';
            }

            return $text;
        })->implode('');
    }

    private function plainText(array $richText): string
    {
        return collect($richText)->pluck('plain_text')->implode('');
    }
}
