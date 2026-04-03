<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;

/**
 * Handles admin login and logout.
 * Authentication is a simple password check against ADMIN_PASSWORD env var.
 */
class AuthController extends Controller
{
    /**
     * Show the admin login page.
     */
    public function showLogin(Request $request): View|RedirectResponse
    {
        if ($request->session()->get('admin_authenticated', false)) {
            return redirect()->route('admin.dashboard');
        }

        return view('admin.login');
    }

    /**
     * Process login form submission.
     */
    public function login(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        $adminPassword = env('ADMIN_SECRET', '');

        if (empty($adminPassword)) {
            return back()->withErrors(['password' => 'Admin secret is not configured on the server.']);
        }

        if (!hash_equals($adminPassword, $request->input('password'))) {
            return back()->withErrors(['password' => 'Invalid admin password.'])->withInput();
        }

        $request->session()->put('admin_authenticated', true);
        $request->session()->regenerate();

        return redirect()->route('admin.dashboard')
            ->with('success', 'Welcome back, Arena Master!');
    }

    /**
     * Log the admin out.
     */
    public function logout(Request $request): RedirectResponse
    {
        $request->session()->forget('admin_authenticated');
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login')
            ->with('success', 'Logged out successfully.');
    }
}
