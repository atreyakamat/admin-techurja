@extends('admin.layouts.app')

@section('title', 'Admin Login')

@push('styles')
<style>
    body { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .main-container { width: 100%; max-width: 420px; }

    .login-card {
        background: var(--bg-card);
        border: 2px solid var(--neon-cyan);
        box-shadow: 0 0 40px #00f5ff22, inset 0 0 30px #00f5ff08;
        padding: 2.5rem 2rem;
        position: relative;
    }

    .login-card::before {
        content: '';
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 3px;
        background: linear-gradient(90deg, transparent, var(--neon-cyan), transparent);
    }

    .login-logo {
        text-align: center;
        margin-bottom: 2rem;
    }
    .login-logo .title {
        font-size: 1.5rem;
        letter-spacing: 6px;
        color: var(--neon-cyan);
        text-shadow: 0 0 15px var(--neon-cyan);
        font-weight: bold;
    }
    .login-logo .subtitle {
        font-size: 0.7rem;
        letter-spacing: 4px;
        color: var(--text-secondary);
        margin-top: 0.5rem;
    }
    .login-logo .event-tag {
        font-size: 0.75rem;
        color: var(--neon-yellow);
        letter-spacing: 3px;
        margin-top: 0.3rem;
    }

    .form-group {
        margin-bottom: 1.25rem;
    }
    .form-group label {
        display: block;
        font-size: 0.65rem;
        letter-spacing: 3px;
        color: var(--text-secondary);
        text-transform: uppercase;
        margin-bottom: 0.4rem;
    }
    .error-msg {
        font-size: 0.72rem;
        color: var(--neon-red);
        margin-top: 0.3rem;
        letter-spacing: 1px;
    }

    .login-btn {
        width: 100%;
        padding: 0.85rem;
        background: transparent;
        border: 2px solid var(--neon-cyan);
        color: var(--neon-cyan);
        font-family: var(--font-mono);
        font-size: 0.85rem;
        letter-spacing: 4px;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 0.3s;
        margin-top: 0.5rem;
    }
    .login-btn:hover {
        background: var(--neon-cyan);
        color: #000;
        box-shadow: 0 0 25px var(--neon-cyan);
    }

    .security-note {
        text-align: center;
        margin-top: 1.5rem;
        font-size: 0.65rem;
        color: var(--text-secondary);
        letter-spacing: 1px;
        border-top: 1px solid var(--border-dim);
        padding-top: 1rem;
    }

    /* Scanline effect */
    .login-card::after {
        content: '';
        position: absolute;
        inset: 0;
        background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,245,255,0.015) 2px,
            rgba(0,245,255,0.015) 4px
        );
        pointer-events: none;
    }
</style>
@endpush

@section('content')
<div class="login-card">
    <div class="login-logo">
        <div class="title">⚡ TECHURJA</div>
        <div class="event-tag">2K26 ADMIN PORTAL</div>
        <div class="subtitle">ARENA MASTER ACCESS ONLY</div>
    </div>

    <form action="{{ route('admin.login.submit') }}" method="POST">
        @csrf
        <div class="form-group">
            <label for="password">⬡ ACCESS CODE</label>
            <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter admin password"
                autocomplete="current-password"
                autofocus
            >
            @error('password')
                <div class="error-msg">✘ {{ $message }}</div>
            @enderror
        </div>

        <button type="submit" class="login-btn">
            ▶ AUTHENTICATE
        </button>
    </form>

    <div class="security-note">
        🔒 SECURE ACCESS · CSRF PROTECTED · SESSION ENCRYPTED
    </div>
</div>
@endsection
