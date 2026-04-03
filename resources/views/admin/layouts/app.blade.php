<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Arena Master') — Techurja 2K26</title>
    <style>
        /* ===================================================
           TECHURJA ADMIN — CYBERPUNK / BRUTALIST THEME
           =================================================== */
        :root {
            --bg-primary:    #0a0a0f;
            --bg-secondary:  #12121a;
            --bg-card:       #1a1a2e;
            --bg-card-hover: #16213e;
            --neon-cyan:     #00f5ff;
            --neon-green:    #00ff88;
            --neon-red:      #ff0055;
            --neon-yellow:   #ffcc00;
            --neon-purple:   #bf00ff;
            --text-primary:  #e0e0e0;
            --text-secondary:#8888aa;
            --border-dim:    #2a2a45;
            --border-neon:   #00f5ff44;
            --font-mono:     'Courier New', Courier, monospace;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            background: var(--bg-primary);
            color: var(--text-primary);
            font-family: var(--font-mono);
            min-height: 100vh;
        }

        a { color: var(--neon-cyan); text-decoration: none; }
        a:hover { text-decoration: underline; }

        /* ---- Scrollbar ---- */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: var(--bg-secondary); }
        ::-webkit-scrollbar-thumb { background: var(--neon-cyan); border-radius: 3px; }

        /* ---- Top Bar ---- */
        .top-bar {
            background: var(--bg-secondary);
            border-bottom: 2px solid var(--neon-cyan);
            padding: 0.75rem 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 100;
            box-shadow: 0 0 20px #00f5ff33;
        }

        .top-bar .logo {
            font-size: 1.2rem;
            font-weight: bold;
            color: var(--neon-cyan);
            text-shadow: 0 0 10px var(--neon-cyan);
            letter-spacing: 3px;
        }

        .top-bar .logo span { color: var(--neon-yellow); }

        .top-bar nav a {
            margin-left: 1.5rem;
            font-size: 0.8rem;
            letter-spacing: 2px;
            color: var(--text-secondary);
            transition: color 0.2s;
        }
        .top-bar nav a:hover { color: var(--neon-cyan); text-decoration: none; }

        .logout-btn {
            background: transparent;
            border: 1px solid var(--neon-red);
            color: var(--neon-red);
            padding: 0.35rem 0.9rem;
            cursor: pointer;
            font-family: var(--font-mono);
            font-size: 0.75rem;
            letter-spacing: 2px;
            transition: all 0.2s;
        }
        .logout-btn:hover {
            background: var(--neon-red);
            color: #000;
            box-shadow: 0 0 10px var(--neon-red);
        }

        /* ---- Main Layout ---- */
        .main-container {
            padding: 1.5rem;
            max-width: 1600px;
            margin: 0 auto;
        }

        /* ---- Alerts ---- */
        .alert {
            padding: 0.75rem 1rem;
            border-left: 4px solid;
            margin-bottom: 1rem;
            font-size: 0.85rem;
            letter-spacing: 1px;
        }
        .alert-success { border-color: var(--neon-green); background: #00ff8811; color: var(--neon-green); }
        .alert-danger  { border-color: var(--neon-red);   background: #ff005511; color: var(--neon-red); }

        /* ---- Cards ---- */
        .card {
            background: var(--bg-card);
            border: 1px solid var(--border-dim);
            padding: 1.25rem;
            margin-bottom: 1.5rem;
        }
        .card-title {
            font-size: 0.85rem;
            letter-spacing: 3px;
            color: var(--neon-cyan);
            text-transform: uppercase;
            margin-bottom: 1rem;
            border-bottom: 1px solid var(--border-dim);
            padding-bottom: 0.5rem;
        }

        /* ---- Stats Grid ---- */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
        }
        .stat-box {
            background: var(--bg-card);
            border: 1px solid var(--border-dim);
            padding: 1rem;
            text-align: center;
            transition: border-color 0.2s;
        }
        .stat-box:hover { border-color: var(--neon-cyan); }
        .stat-box .stat-num {
            font-size: 2rem;
            font-weight: bold;
            line-height: 1;
        }
        .stat-box .stat-label {
            font-size: 0.65rem;
            letter-spacing: 3px;
            color: var(--text-secondary);
            margin-top: 0.4rem;
        }
        .stat-total   .stat-num { color: var(--neon-cyan); }
        .stat-pending .stat-num { color: var(--neon-yellow); }
        .stat-verified .stat-num { color: var(--neon-green); }
        .stat-rejected .stat-num { color: var(--neon-red); }

        /* ---- Buttons ---- */
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.5rem 1rem;
            font-family: var(--font-mono);
            font-size: 0.75rem;
            letter-spacing: 2px;
            cursor: pointer;
            border: 1px solid;
            transition: all 0.2s;
            text-transform: uppercase;
            white-space: nowrap;
        }
        .btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .btn-cyan {
            background: transparent;
            border-color: var(--neon-cyan);
            color: var(--neon-cyan);
        }
        .btn-cyan:hover:not(:disabled) {
            background: var(--neon-cyan);
            color: #000;
            box-shadow: 0 0 15px var(--neon-cyan);
        }

        .btn-green {
            background: transparent;
            border-color: var(--neon-green);
            color: var(--neon-green);
        }
        .btn-green:hover:not(:disabled) {
            background: var(--neon-green);
            color: #000;
            box-shadow: 0 0 15px var(--neon-green);
        }

        .btn-red {
            background: transparent;
            border-color: var(--neon-red);
            color: var(--neon-red);
        }
        .btn-red:hover:not(:disabled) {
            background: var(--neon-red);
            color: #fff;
            box-shadow: 0 0 15px var(--neon-red);
        }

        .btn-yellow {
            background: transparent;
            border-color: var(--neon-yellow);
            color: var(--neon-yellow);
        }
        .btn-yellow:hover:not(:disabled) {
            background: var(--neon-yellow);
            color: #000;
            box-shadow: 0 0 15px var(--neon-yellow);
        }

        .btn-sm { padding: 0.3rem 0.6rem; font-size: 0.65rem; }

        /* ---- Inputs & Select ---- */
        input[type="text"],
        input[type="email"],
        input[type="password"],
        input[type="search"],
        select,
        textarea {
            background: var(--bg-secondary);
            border: 1px solid var(--border-dim);
            color: var(--text-primary);
            padding: 0.5rem 0.75rem;
            font-family: var(--font-mono);
            font-size: 0.85rem;
            outline: none;
            width: 100%;
            transition: border-color 0.2s;
        }
        input:focus, select:focus, textarea:focus {
            border-color: var(--neon-cyan);
            box-shadow: 0 0 8px #00f5ff44;
        }

        /* ---- Table ---- */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.82rem;
        }
        .data-table th {
            background: var(--bg-secondary);
            color: var(--neon-cyan);
            text-transform: uppercase;
            letter-spacing: 2px;
            padding: 0.7rem 0.75rem;
            border-bottom: 2px solid var(--border-dim);
            white-space: nowrap;
            font-size: 0.72rem;
            text-align: left;
        }
        .data-table td {
            padding: 0.65rem 0.75rem;
            border-bottom: 1px solid var(--border-dim);
            vertical-align: middle;
        }
        .data-table tbody tr { transition: background 0.15s; }
        .data-table tbody tr:hover { background: var(--bg-card-hover); cursor: pointer; }
        .data-table tbody tr.row-selected { background: #00f5ff0d; border-left: 3px solid var(--neon-cyan); }

        /* ---- Status Badges ---- */
        .badge {
            display: inline-block;
            padding: 0.25rem 0.6rem;
            font-size: 0.65rem;
            letter-spacing: 2px;
            font-weight: bold;
            border: 1px solid;
        }
        .badge-pending  { color: var(--neon-yellow); border-color: var(--neon-yellow); background: #ffcc0011; }
        .badge-verified { color: var(--neon-green);  border-color: var(--neon-green);  background: #00ff8811; }
        .badge-rejected { color: var(--neon-red);    border-color: var(--neon-red);    background: #ff005511; }

        /* Status dot (neon blinking) */
        .status-dot {
            display: inline-block;
            width: 8px; height: 8px;
            border-radius: 50%;
            margin-right: 6px;
        }
        .dot-pending  { background: var(--neon-yellow); animation: blink 1.5s infinite; }
        .dot-verified { background: var(--neon-green); }
        .dot-rejected { background: var(--neon-red); }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }

        /* ---- Modal ---- */
        .modal-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.85);
            z-index: 1000;
            justify-content: center;
            align-items: flex-start;
            padding: 2rem 1rem;
            overflow-y: auto;
        }
        .modal-overlay.active { display: flex; }

        .modal {
            background: var(--bg-card);
            border: 2px solid var(--neon-cyan);
            box-shadow: 0 0 40px #00f5ff33;
            width: 100%;
            max-width: 900px;
            padding: 1.5rem;
            position: relative;
        }
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border-dim);
            padding-bottom: 0.75rem;
            margin-bottom: 1rem;
        }
        .modal-title {
            font-size: 0.85rem;
            letter-spacing: 3px;
            color: var(--neon-cyan);
            text-transform: uppercase;
        }
        .modal-close {
            background: transparent;
            border: none;
            color: var(--text-secondary);
            font-size: 1.5rem;
            cursor: pointer;
            line-height: 1;
        }
        .modal-close:hover { color: var(--neon-red); }

        .modal-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
        }
        @media (max-width: 640px) { .modal-grid { grid-template-columns: 1fr; } }

        /* ---- Receipt image ---- */
        .receipt-box {
            background: var(--bg-secondary);
            border: 1px solid var(--border-dim);
            min-height: 250px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;
        }
        .receipt-box img {
            max-width: 100%;
            max-height: 400px;
            object-fit: contain;
        }
        .receipt-loading {
            color: var(--text-secondary);
            font-size: 0.8rem;
            letter-spacing: 2px;
            animation: blink 1s infinite;
        }

        /* ---- Info list ---- */
        .info-list { font-size: 0.82rem; }
        .info-list .info-row {
            display: flex;
            padding: 0.45rem 0;
            border-bottom: 1px solid var(--border-dim);
        }
        .info-list .info-key {
            width: 120px;
            min-width: 120px;
            color: var(--text-secondary);
            font-size: 0.72rem;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .info-list .info-val {
            color: var(--text-primary);
            word-break: break-all;
        }
        .utr-value {
            color: var(--neon-yellow);
            font-size: 1rem;
            font-weight: bold;
            letter-spacing: 2px;
        }

        /* ---- Filter bar ---- */
        .filter-bar {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
            align-items: flex-end;
            margin-bottom: 1rem;
        }
        .filter-bar .filter-group {
            display: flex;
            flex-direction: column;
            gap: 0.3rem;
            flex: 1;
            min-width: 120px;
        }
        .filter-bar label {
            font-size: 0.65rem;
            letter-spacing: 2px;
            color: var(--text-secondary);
            text-transform: uppercase;
        }

        /* ---- Spinner ---- */
        .spinner {
            display: inline-block;
            width: 14px; height: 14px;
            border: 2px solid transparent;
            border-top-color: currentColor;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ---- Toast notifications ---- */
        #toast-container {
            position: fixed;
            bottom: 1.5rem;
            right: 1.5rem;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            pointer-events: none;
        }
        .toast {
            background: var(--bg-card);
            border-left: 4px solid;
            padding: 0.75rem 1rem;
            font-size: 0.82rem;
            letter-spacing: 1px;
            max-width: 320px;
            animation: slideIn 0.3s ease;
            pointer-events: auto;
        }
        .toast-success { border-color: var(--neon-green); color: var(--neon-green); }
        .toast-error   { border-color: var(--neon-red);   color: var(--neon-red); }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

        /* ---- Export section ---- */
        .export-section { display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; }

        /* ---- Keyboard hint ---- */
        .kbd-hint {
            font-size: 0.65rem;
            color: var(--text-secondary);
            letter-spacing: 1px;
            margin-top: 0.5rem;
        }
        .kbd { display: inline-block; border: 1px solid var(--border-dim); padding: 0.1rem 0.35rem; border-radius: 2px; font-size: 0.65rem; }

        /* ---- Responsive ---- */
        @media (max-width: 768px) {
            .data-table th:nth-child(n+5),
            .data-table td:nth-child(n+5) { display: none; }
            .top-bar .logo { font-size: 0.9rem; }
        }
        @media (max-width: 480px) {
            .main-container { padding: 0.75rem; }
            .data-table th:nth-child(n+3),
            .data-table td:nth-child(n+3) { display: none; }
        }
    </style>
    @stack('styles')
</head>
<body>

@if(request()->session()->get('admin_authenticated'))
<header class="top-bar">
    <div class="logo">⚡ TECHURJA <span>ADMIN</span></div>
    <nav>
        <a href="{{ route('admin.dashboard') }}">DASHBOARD</a>
        <form action="{{ route('admin.logout') }}" method="POST" style="display:inline">
            @csrf
            <button type="submit" class="logout-btn">⏏ LOGOUT</button>
        </form>
    </nav>
</header>
@endif

<main class="main-container">
    @if(session('success'))
        <div class="alert alert-success">✔ {{ session('success') }}</div>
    @endif
    @if(session('error'))
        <div class="alert alert-danger">✘ {{ session('error') }}</div>
    @endif

    @yield('content')
</main>

<div id="toast-container"></div>

<script>
// Global CSRF token for AJAX
window.CSRF_TOKEN = '{{ csrf_token() }}';

// Toast utility
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.4s';
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}
</script>
@stack('scripts')
</body>
</html>
