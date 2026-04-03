<?php

namespace Tests\Feature;

use App\Models\Registration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VerificationTest extends TestCase
{
    use RefreshDatabase;

    private function authenticatedSession(): array
    {
        return ['admin_authenticated' => true];
    }

    private function createRegistration(array $overrides = []): Registration
    {
        return Registration::create(array_merge([
            'teamName'   => 'Test Team',
            'name'       => 'Test User',
            'email'      => 'test@example.com',
            'phone'      => '9999999999',
            'college'    => 'Test College',
            'event'      => 'Hackathon',
            'category'   => 'technical',
            'utr_number' => 'UTR123456',
            'amount'     => 500,
            'status'     => 'pending',
        ], $overrides));
    }

    public function test_verify_approve_updates_status(): void
    {
        $reg = $this->createRegistration();

        $response = $this->withSession($this->authenticatedSession())
            ->postJson("/api/admin/verify/{$reg->id}", ['action' => 'approve']);

        $response->assertStatus(200)
                 ->assertJson(['success' => true, 'status' => 'verified']);

        $this->assertDatabaseHas('registrations', [
            'id'     => $reg->id,
            'status' => 'verified',
        ]);
    }

    public function test_verify_reject_updates_status_and_notes(): void
    {
        $reg = $this->createRegistration();

        $response = $this->withSession($this->authenticatedSession())
            ->postJson("/api/admin/verify/{$reg->id}", [
                'action'      => 'reject',
                'admin_notes' => 'Blurry screenshot',
            ]);

        $response->assertStatus(200)
                 ->assertJson(['success' => true, 'status' => 'rejected']);

        $this->assertDatabaseHas('registrations', [
            'id'          => $reg->id,
            'status'      => 'rejected',
            'admin_notes' => 'Blurry screenshot',
        ]);
    }

    public function test_verify_reset_resets_to_pending(): void
    {
        $reg = $this->createRegistration(['status' => 'verified']);

        $response = $this->withSession($this->authenticatedSession())
            ->postJson("/api/admin/verify/{$reg->id}/reset");

        $response->assertStatus(200)
                 ->assertJson(['success' => true, 'status' => 'pending']);

        $this->assertDatabaseHas('registrations', [
            'id'     => $reg->id,
            'status' => 'pending',
        ]);
    }

    public function test_verify_requires_authentication(): void
    {
        $reg = $this->createRegistration();

        $response = $this->postJson("/api/admin/verify/{$reg->id}", ['action' => 'approve']);
        $response->assertStatus(401);
    }

    public function test_verify_requires_valid_action(): void
    {
        $reg = $this->createRegistration();

        $response = $this->withSession($this->authenticatedSession())
            ->postJson("/api/admin/verify/{$reg->id}", ['action' => 'invalid_action']);

        $response->assertStatus(422);
    }

    public function test_refresh_grid_returns_json(): void
    {
        $this->createRegistration();
        $this->createRegistration(['status' => 'verified', 'email' => 'v@example.com']);

        $response = $this->withSession($this->authenticatedSession())
                         ->getJson('/api/admin/registrations');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'registrations' => [['id', 'name', 'email', 'status', 'status_label', 'status_badge_class']],
                     'stats' => ['total', 'pending', 'verified', 'rejected'],
                 ]);
    }

    public function test_refresh_grid_filter_by_status(): void
    {
        $this->createRegistration(['status' => 'pending']);
        $this->createRegistration(['status' => 'verified', 'email' => 'v@example.com']);

        $response = $this->withSession($this->authenticatedSession())
                         ->getJson('/api/admin/registrations?status=pending');

        $response->assertStatus(200);
        $data = $response->json('registrations');
        $this->assertCount(1, $data);
        $this->assertEquals('pending', $data[0]['status']);
    }

    public function test_dashboard_shows_registration_stats(): void
    {
        $this->createRegistration(['status' => 'pending']);
        $this->createRegistration(['status' => 'verified', 'email' => 'v@example.com']);
        $this->createRegistration(['status' => 'rejected', 'email' => 'r@example.com']);

        $response = $this->withSession($this->authenticatedSession())
                         ->get('/admin/dashboard');

        $response->assertStatus(200)
                 ->assertSee('PENDING')
                 ->assertSee('VERIFIED')
                 ->assertSee('REJECTED');
    }
}
