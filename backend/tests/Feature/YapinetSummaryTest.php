<?php

namespace Tests\Feature;

use App\Models\FollowUpItem;
use App\Models\Meeting;
use App\Models\MeetingNote;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class YapinetSummaryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.yapinet.api_key' => 'kunci-yapinet']);
    }

    public function test_menolak_tanpa_api_key(): void
    {
        $this->getJson('/api/integrations/yapinet/summary')->assertUnauthorized();
    }

    public function test_ringkasan_v11_dengan_tugas_lewat_tenggat_dan_periode(): void
    {
        $user = User::factory()->create(['name' => 'Bu Sari', 'department' => 'Keuangan']);
        $meeting = Meeting::create(['title' => 'Rapat BPH', 'meeting_date' => now()->subDays(10), 'location' => 'Ruang Rapat', 'created_by' => $user->id]);
        Meeting::create(['title' => 'Koordinasi Unit', 'meeting_date' => now()->addDay()->setTime(9, 0), 'created_by' => $user->id]);
        $note = MeetingNote::create(['meeting_id' => $meeting->id, 'content' => ['type' => 'doc'], 'created_by' => $user->id]);

        $followUp = fn (string $title) => FollowUpItem::create([
            'meeting_id' => $meeting->id, 'meeting_note_id' => $note->id, 'highlighted_text' => $title,
            'title' => $title, 'created_by' => $user->id,
        ]);
        $withTask = $followUp('Kajian tarif SPP');
        $followUp('Revisi SOP tamu'); // tanpa tugas → belum punya PIC

        Task::create([
            'follow_up_item_id' => $withTask->id, 'assigned_to' => $user->id, 'assigned_by' => $user->id,
            'title' => 'Susun kajian tarif', 'deadline' => now()->subDays(5)->toDateString(),
        ]);

        $json = $this->withToken('kunci-yapinet')->getJson('/api/integrations/yapinet/summary')
            ->assertOk()
            ->assertJsonPath('contract_version', 2)
            ->assertJsonPath('status', 'warning')
            ->assertJsonPath('filters.0.key', 'periode')
            ->json();

        $titles = collect($json['attention'])->pluck('title')->implode(' | ');
        $this->assertStringContainsString('1 tugas melewati tenggat', $titles);
        $this->assertStringContainsString('1 tindak lanjut belum punya penanggung jawab', $titles);
        $this->assertStringContainsString('rapat terjadwal minggu ini', $titles);

        $overdue = collect($json['sections'])->first(fn ($s) => str_starts_with($s['title'], 'Tugas lewat tenggat'));
        $this->assertSame('PIC: Bu Sari (Keuangan) · Rapat BPH', $overdue['items'][0]['subtitle']);

        $rapat30 = collect($json['metrics'])->firstWhere('label', 'Rapat 30 hari');
        $this->assertSame(['periode' => '30'], $rapat30['when']);
        $this->assertSame(1, $rapat30['value']);

        // v1.2: hero tindak lanjut + cincin selesai tepat waktu, tugas lewat tenggat sebagai batang umur.
        $this->assertSame('Tindak lanjut terbuka', $json['hero'][0]['label']);
        $this->assertSame(['Selesai tepat waktu'], $json['hero'][0]['side']);
        $this->assertSame('aging', collect($json['sections'])->first(fn ($s) => str_starts_with($s['title'] ?? '', 'Tugas lewat tenggat'))['display']);

        file_put_contents(sys_get_temp_dir().'/yapinet-summary-simonik.json', json_encode($json));
    }
}
