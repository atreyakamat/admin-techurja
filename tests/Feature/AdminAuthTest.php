<?php

namespace Tests\Feature;

use App\Models\Registration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_is_redirected_from_dashboard(): void
    {
        $response = $this->get('/admin/dashboard');
        $response->assertRedirect('/admin/login');
    }

    public function test_login_page_is_accessible(): void
    {
        $response = $this->get('/admin/login');
        $response->assertStatus(200);
        $response->assertSee('AUTHENTICATE');
    }

    public function test_login_with_wrong_password_fails(): void
    {
        $response = $this->post('/admin/login', [
            'password' => 'wrong_password',
        ]);
        $response->assertSessionHasErrors('password');
    }

    public function test_login_with_correct_password_succeeds(): void
    {
        $response = $this->post('/admin/login', [
            'password' => 'test_admin_pass',
        ]);
        $response->assertRedirect('/admin/dashboard');
        $response->assertSessionHas('admin_authenticated', true);
    }

    public function test_authenticated_user_can_access_dashboard(): void
    {
        $response = $this->withSession(['admin_authenticated' => true])
                         ->get('/admin/dashboard');
        $response->assertStatus(200);
        $response->assertSee('LIVE REGISTRATION FEED');
    }

    public function test_logout_clears_session(): void
    {
        $response = $this->withSession(['admin_authenticated' => true])
                         ->post('/admin/logout');
        $response->assertRedirect('/admin/login');
        $response->assertSessionMissing('admin_authenticated');
    }
}
