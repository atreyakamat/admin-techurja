@extends('admin.layouts.app')

@section('title', 'Dashboard')

@section('content')

{{-- ===== STATS ===== --}}
<div class="stats-grid" id="stats-grid">
    <div class="stat-box stat-total">
        <div class="stat-num" id="stat-total">{{ $stats['total'] }}</div>
        <div class="stat-label">TOTAL</div>
    </div>
    <div class="stat-box stat-pending">
        <div class="stat-num" id="stat-pending">{{ $stats['pending'] }}</div>
        <div class="stat-label">PENDING</div>
    </div>
    <div class="stat-box stat-verified">
        <div class="stat-num" id="stat-verified">{{ $stats['verified'] }}</div>
        <div class="stat-label">VERIFIED</div>
    </div>
    <div class="stat-box stat-rejected">
        <div class="stat-num" id="stat-rejected">{{ $stats['rejected'] }}</div>
        <div class="stat-label">REJECTED</div>
    </div>
</div>

{{-- ===== LIVE REGISTRATION FEED ===== --}}
<div class="card">
    <div class="card-title">⬡ LIVE REGISTRATION FEED</div>

    {{-- Filters --}}
    <div class="filter-bar" id="filter-bar">
        <div class="filter-group" style="max-width:260px">
            <label>Search</label>
            <input type="search" id="filter-search" placeholder="Name, email, UTR, phone…">
        </div>
        <div class="filter-group" style="max-width:160px">
            <label>Status</label>
            <select id="filter-status">
                <option value="">ALL</option>
                <option value="pending">PENDING</option>
                <option value="verified">VERIFIED</option>
                <option value="rejected">REJECTED</option>
            </select>
        </div>
        <div class="filter-group" style="max-width:140px">
            <label>Accepted Status</label>
            <select id="filter-accepted">
                <option value="all">ALL</option>
                <option value="1">ACCEPTED</option>
                <option value="0">NOT ACCEPTED</option>
            </select>
        </div>
        <div class="filter-group" style="max-width:140px">
            <label>Category</label>
            <input type="text" id="filter-category" placeholder="e.g. technical">
        </div>
        <div class="filter-group" style="max-width:140px">
            <label>Institution</label>
            <input type="text" id="filter-institution" placeholder="College name…">
        </div>
        <div class="filter-group" style="max-width:160px">
            <label>Event</label>
            <input type="text" id="filter-event" placeholder="Event name…">
        </div>
        <div style="display:flex;gap:0.5rem;align-items:flex-end;flex-wrap:wrap">
            <button class="btn btn-cyan" id="refresh-btn" onclick="refreshGrid()">
                <span id="refresh-icon">⟳</span> REFRESH_GRID
            </button>
            <button class="btn btn-yellow btn-sm" onclick="clearFilters()">✕ CLEAR</button>
        </div>
    </div>

    <div class="kbd-hint">
        <span class="kbd">Space</span> Open selected receipt &nbsp;
        <span class="kbd">Enter</span> Verify selected &nbsp;
        <span class="kbd">R</span> Reject selected &nbsp;
        <span class="kbd">↑↓</span> Navigate rows
    </div>

    {{-- Table --}}
    <div style="overflow-x:auto;margin-top:1rem">
        <table class="data-table" id="registrations-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>TEAM NAME</th>
                    <th>NAME</th>
                    <th>EMAIL</th>
                    <th>PHONE</th>
                    <th>EVENT</th>
                    <th>TRANSACTION ID</th>
                    <th>STATUS</th>
                    <th>ACCOMM</th>
                    <th>ACTIONS</th>
                </tr>
            </thead>
            <tbody id="registrations-tbody">
                @forelse($registrations as $reg)
                <tr class="reg-row" data-id="{{ $reg->id }}" tabindex="0"
                    onclick="selectRow(this)" onkeydown="rowKeyHandler(event, this)">
                    <td>{{ $reg->id }}</td>
                    <td style="color:var(--neon-cyan);font-weight:bold">{{ $reg->teamName }}</td>
                    <td>{{ $reg->name }}</td>
                    <td style="font-size:0.75rem">{{ $reg->email }}</td>
                    <td>{{ $reg->phone }}</td>
                    <td>{{ $reg->eventName }}</td>
                    <td class="utr-value">{{ $reg->transactionId ?: '—' }}</td>
                    <td>
                        <span class="badge badge-{{ $reg->status }}">
                            <span class="status-dot dot-{{ $reg->status }}"></span>{{ $reg->status_label }}
                            @if($reg->isAccepted)
                                <span style="color:var(--neon-green);margin-left:5px">●</span>
                            @endif
                        </span>
                    </td>
                    <td>
                        @if($reg->needsAccommodation)
                        <span style="color:var(--neon-yellow);font-size:0.7rem">✔ YES</span>
                        @else
                        <span style="color:var(--text-secondary);font-size:0.7rem">—</span>
                        @endif
                    </td>
                    <td>
                        <div style="display:flex;gap:0.4rem;flex-wrap:wrap">
                            <button class="btn btn-cyan btn-sm" onclick="event.stopPropagation();openVerifyModal({{ $reg->id }})">
                                👁 VIEW
                            </button>
                            @if($reg->status !== 'verified')
                            <button class="btn btn-green btn-sm" onclick="event.stopPropagation();quickVerify({{ $reg->id }}, 'approve')">
                                ✔
                            </button>
                            @endif
                            @if($reg->status !== 'rejected')
                            <button class="btn btn-red btn-sm" onclick="event.stopPropagation();openRejectModal({{ $reg->id }})">
                                ✘
                            </button>
                            @endif
                        </div>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="10" style="text-align:center;color:var(--text-secondary);padding:2rem;letter-spacing:2px">
                        NO REGISTRATIONS FOUND
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div style="margin-top:0.75rem;font-size:0.72rem;color:var(--text-secondary);letter-spacing:1px">
        Showing <span id="row-count">{{ $registrations->count() }}</span> registration(s)
        <span id="last-refresh" style="float:right"></span>
    </div>
</div>

{{-- ===== FTP DATA MANAGEMENT ===== --}}
<div class="card">
    <div class="card-title">⬡ FTP DATA MANAGEMENT</div>
    <div class="export-section">
        <div class="filter-group" style="max-width:200px">
            <label>Category for ZIP Export</label>
            <input type="text" id="export-category" placeholder="e.g. technical">
        </div>
        <button class="btn btn-yellow" onclick="exportCategory()" style="align-self:flex-end">
            ⬇ BATCH EXPORT ZIP
        </button>
        <button class="btn btn-cyan" onclick="exportMasterCsv()" style="align-self:flex-end">
            📄 MASTER CSV
        </button>
        <span style="font-size:0.72rem;color:var(--text-secondary);align-self:flex-end">
            Exports full DB data or ZIP from FTP
        </span>
    </div>
</div>

{{-- ===== FTP IMAGE BROWSER ===== --}}
<div class="card" id="ftp-browser-card">
    <div class="card-title" style="display:flex;justify-content:space-between;align-items:center">
        <span>⬡ FTP IMAGE BROWSER (UNLINKED/ALL)</span>
        <button class="btn btn-cyan btn-sm" onclick="loadFtpBrowser()">⟳ SCAN FTP</button>
    </div>
    <div id="ftp-browser-loading" style="display:none;padding:2rem;text-align:center;color:var(--text-secondary)">
        <span class="spinner"></span> SCANNING FTP STORAGE...
    </div>
    <div class="ftp-gallery" id="ftp-gallery" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(150px, 1fr));gap:1rem;margin-top:1rem">
        <!-- Images injected here -->
    </div>
    <div id="ftp-browser-empty" style="padding:2rem;text-align:center;color:var(--text-secondary);font-size:0.8rem">
        Click "SCAN FTP" to browse files directly from storage nodes.
    </div>
</div>

{{-- ===================================================
     VERIFY / VIEW MODAL
     =================================================== --}}
<div class="modal-overlay" id="verify-modal">
    <div class="modal">
        <div class="modal-header">
            <span class="modal-title">⬡ PAYMENT VERIFICATION — <span id="modal-reg-id">#—</span></span>
            <button class="modal-close" onclick="closeModal('verify-modal')">×</button>
        </div>

        <div class="modal-grid">
            {{-- Left: Receipt image --}}
            <div>
                <div style="font-size:0.72rem;color:var(--text-secondary);letter-spacing:2px;margin-bottom:0.5rem">
                    UPLOADED RECEIPT
                </div>
                <div class="receipt-box" id="receipt-container">
                    <span class="receipt-loading" id="receipt-loading">LOADING RECEIPT…</span>
                    <img id="receipt-img" src="" alt="Payment Receipt" style="display:none"
                         onerror="receiptLoadError()">
                </div>
                <div id="receipt-error" style="display:none;color:var(--neon-red);font-size:0.72rem;margin-top:0.4rem;letter-spacing:1px"></div>
                <div style="margin-top:0.5rem;display:flex;gap:0.5rem">
                    <a id="receipt-open-link" href="#" target="_blank" class="btn btn-cyan btn-sm" style="display:none">
                        ↗ OPEN FULL SIZE
                    </a>
                </div>
            </div>

            {{-- Right: Registration info + actions --}}
            <div>
                <div class="info-list" id="modal-info">
                    <div class="info-row" style="border-bottom:2px solid var(--neon-cyan)">
                        <span class="info-key">TEAM NAME</span>
                        <span class="info-val" id="mi-teamName" style="font-size:1.1rem;font-weight:bold;color:var(--neon-cyan)">—</span>
                    </div>
                    <div class="info-row">
                        <span class="info-key">EVENT</span>
                        <span class="info-val" id="mi-event">—</span>
                    </div>
                    <div class="info-row" id="mi-accom-row">
                        <span class="info-key">ACCOMMODATION</span>
                        <span class="info-val" id="mi-accom">—</span>
                    </div>
                    
                    <div style="margin-top:1rem; border:1px solid var(--border-dim); padding:0.5rem">
                        <div style="font-size:0.65rem;color:var(--text-secondary);letter-spacing:2px;margin-bottom:0.5rem">TEAM PARTICIPANTS</div>
                        <div id="participant-list"></div>
                    </div>

                    <div class="info-row" style="background:#ffcc0011;margin-top:1rem">
                        <span class="info-key">TRANSACTION ID</span>
                        <span class="info-val utr-value" id="mi-utr">—</span>
                    </div>
                    <div class="info-row">
                        <span class="info-key">AMOUNT</span>
                        <span class="info-val" id="mi-amount">—</span>
                    </div>
                    <div class="info-row">
                        <span class="info-key">STATUS</span>
                        <span class="info-val" id="mi-status">—</span>
                    </div>
                    <div class="info-row" id="mi-notes-row" style="display:none">
                        <span class="info-key">NOTES</span>
                        <span class="info-val" id="mi-notes" style="color:var(--neon-red)">—</span>
                    </div>
                    <div class="info-row">
                        <span class="info-key">INSTITUTION</span>
                        <span class="info-val" id="mi-institution">—</span>
                    </div>
                </div>

                {{-- Actions --}}
                <div style="margin-top:1.25rem">
                    <div style="font-size:0.7rem;letter-spacing:2px;color:var(--text-secondary);margin-bottom:0.75rem">
                        VERIFICATION ACTION
                    </div>
                    <div style="display:flex;gap:0.75rem;flex-wrap:wrap">
                        <button class="btn btn-green" id="modal-approve-btn" onclick="modalVerify('approve')">
                            ✔ APPROVE
                        </button>
                        <button class="btn btn-red" id="modal-reject-btn" onclick="showRejectNotesInModal()">
                            ✘ REJECT
                        </button>
                        <button class="btn btn-yellow btn-sm" id="modal-reset-btn" onclick="modalReset()">
                            ⟳ RESET
                        </button>
                    </div>

                    {{-- Reject notes input (shown on reject) --}}
                    <div id="reject-notes-area" style="display:none;margin-top:0.75rem">
                        <label style="font-size:0.65rem;letter-spacing:2px;color:var(--text-secondary);display:block;margin-bottom:0.3rem">
                            REJECTION REASON (required)
                        </label>
                        <textarea id="reject-notes-input" rows="3"
                                  placeholder="e.g. Blurry screenshot, UTR mismatch, fake payment…"
                                  style="resize:vertical"></textarea>
                        <div style="display:flex;gap:0.5rem;margin-top:0.5rem">
                            <button class="btn btn-red btn-sm" onclick="modalVerify('reject')">✘ CONFIRM REJECT</button>
                            <button class="btn btn-yellow btn-sm" onclick="hideRejectNotes()">CANCEL</button>
                        </div>
                    </div>
                </div>

                {{-- CSV Preview --}}
                <div style="margin-top:1.25rem">
                    <button class="btn btn-cyan btn-sm" onclick="loadCsvPreview()">
                        📄 PREVIEW CSV
                    </button>
                    <div id="csv-preview-area" style="margin-top:0.75rem;display:none">
                        <div style="font-size:0.65rem;letter-spacing:2px;color:var(--text-secondary);margin-bottom:0.5rem">
                            FTP — details.csv
                        </div>
                        <div id="csv-table-wrap" style="overflow-x:auto;max-height:200px;overflow-y:auto"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="kbd-hint" style="margin-top:1rem">
            <span class="kbd">Enter</span> Approve &nbsp;
            <span class="kbd">R</span> Reject &nbsp;
            <span class="kbd">Esc</span> Close modal
        </div>
    </div>
</div>

{{-- ===================================================
     QUICK REJECT MODAL (from table row)
     =================================================== --}}
<div class="modal-overlay" id="reject-modal">
    <div class="modal" style="max-width:480px">
        <div class="modal-header">
            <span class="modal-title">✘ REJECT REGISTRATION — <span id="reject-modal-id">#—</span></span>
            <button class="modal-close" onclick="closeModal('reject-modal')">×</button>
        </div>
        <div>
            <label style="font-size:0.7rem;letter-spacing:2px;color:var(--text-secondary);display:block;margin-bottom:0.5rem">
                REJECTION REASON
            </label>
            <textarea id="quick-reject-notes" rows="4"
                      placeholder="e.g. Blurry screenshot, UTR mismatch, fake payment…"
                      style="resize:vertical"></textarea>
            <div style="display:flex;gap:0.75rem;margin-top:1rem">
                <button class="btn btn-red" onclick="submitQuickReject()">✘ CONFIRM REJECT</button>
                <button class="btn btn-yellow" onclick="closeModal('reject-modal')">CANCEL</button>
            </div>
        </div>
    </div>
</div>

@endsection

@push('scripts')
<script>
// ============================================================
// DATA STORE — populated server-side, updated via AJAX
// ============================================================
@php
$mappedRegistrations = $registrations->map(fn($r) => [
    'id'                 => $r->id,
    'teamName'           => $r->teamName,
    'needsAccommodation' => $r->needsAccommodation,
    'participant1'       => $r->participant1,
    'email1'             => $r->email1,
    'phone1'             => $r->phone1,
    'participant2'       => $r->participant2,
    'email2'             => $r->email2,
    'phone2'             => $r->phone2,
    'participant3'       => $r->participant3,
    'email3'             => $r->email3,
    'phone3'             => $r->phone3,
    'participant4'       => $r->participant4,
    'email4'             => $r->email4,
    'phone4'             => $r->phone4,
    'name'               => $r->name,
    'email'              => $r->email,
    'phone'              => $r->phone,
    'institution'        => $r->institution,
    'eventName'          => $r->eventName,
    'category'           => $r->category,
    'transactionId'      => $r->transactionId,
    'amount'             => $r->amount,
    'paymentScreenshot'  => $r->paymentScreenshot,
    'status'             => $r->status,
    'isAccepted'         => $r->isAccepted,
    'status_label'       => $r->status_label,
    'status_badge_class' => $r->status_badge_class,
    'adminNotes'         => $r->adminNotes,
    'createdAt'          => $r->createdAt?->format('d M Y, H:i'),
]);
@endphp
let registrationsData = @json($mappedRegistrations);

let currentModalId  = null;
let currentQuickId  = null;
let selectedRowEl   = null;
let refreshInterval = null;

// ============================================================
// REFRESH_GRID
// ============================================================
async function refreshGrid() {
    const btn  = document.getElementById('refresh-btn');
    const icon = document.getElementById('refresh-icon');
    btn.disabled = true;
    icon.innerHTML = '<span class="spinner"></span>';

    const params = buildFilterParams();

    try {
        const res  = await fetch('/api/admin/registrations?' + params, {
            headers: { 'X-CSRF-TOKEN': window.CSRF_TOKEN, 'Accept': 'application/json' }
        });
        const data = await res.json();
        registrationsData = data.registrations;
        renderTable(registrationsData);
        updateStats(data.stats);
        updateLastRefresh();
    } catch (e) {
        showToast('Grid refresh failed: ' + e.message, 'error');
    } finally {
        btn.disabled = false;
        icon.textContent = '⟳';
    }
}

// ============================================================
// FTP BROWSER
// ============================================================
async function loadFtpBrowser() {
    const gallery = document.getElementById('ftp-gallery');
    const loading = document.getElementById('ftp-browser-loading');
    const empty   = document.getElementById('ftp-browser-empty');

    gallery.innerHTML = '';
    loading.style.display = 'block';
    empty.style.display = 'none';

    try {
        const res = await fetch('/api/admin/ftp-list', {
            headers: { 'X-CSRF-TOKEN': window.CSRF_TOKEN, 'Accept': 'application/json' }
        });
        const data = await res.json();

        if (!data.files || data.files.length === 0) {
            empty.textContent = 'No files found on FTP.';
            empty.style.display = 'block';
            return;
        }

        // Filter for images
        const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        const images = data.files.filter(f => {
            const ext = f.path.split('.').pop().toLowerCase();
            return imageExts.includes(ext);
        });

        if (images.length === 0) {
            empty.textContent = 'No images found on FTP.';
            empty.style.display = 'block';
            return;
        }

        gallery.innerHTML = images.map(img => `
            <div class="ftp-item" onclick="openVerifyModal(${img.registrationId})" style="cursor:pointer;border:1px solid var(--border-dim);padding:0.5rem;background:#000;border-radius:4px;transition:0.2s">
                <div style="height:100px;overflow:hidden;background:#111;display:flex;align-items:center;justify-content:center;margin-bottom:0.5rem">
                    <img src="/api/admin/fetch-receipt/${img.registrationId}" style="max-width:100%;max-height:100%" loading="lazy">
                </div>
                <div style="font-size:0.6rem;color:var(--neon-cyan);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">ID: ${img.registrationId || 'Unknown'}</div>
                <div style="font-size:0.5rem;color:var(--text-secondary)">${img.path.split('/').pop()}</div>
            </div>
        `).join('');

        // Add hover effect style if not present
        if (!document.getElementById('ftp-hover-style')) {
            const style = document.createElement('style');
            style.id = 'ftp-hover-style';
            style.innerHTML = '.ftp-item:hover { border-color: var(--neon-cyan); transform: scale(1.05); box-shadow: 0 0 10px var(--neon-cyan-dim); }';
            document.head.appendChild(style);
        }

    } catch (e) {
        showToast('FTP Scan failed: ' + e.message, 'error');
        empty.textContent = 'Failed to scan FTP.';
        empty.style.display = 'block';
    } finally {
        loading.style.display = 'none';
    }
}

function buildFilterParams() {
    const p = new URLSearchParams();
    const s = document.getElementById('filter-search').value.trim();
    const st = document.getElementById('filter-status').value;
    const acc = document.getElementById('filter-accepted').value;
    const cat = document.getElementById('filter-category').value.trim();
    const ins = document.getElementById('filter-institution').value.trim();
    const ev = document.getElementById('filter-event').value.trim();

    if (s)   p.set('search', s);
    if (st)  p.set('status', st);
    if (acc) p.set('isAccepted', acc);
    if (cat) p.set('category', cat);
    if (ins) p.set('institution', ins);
    if (ev)  p.set('event', ev);

    return p.toString();
}

function clearFilters() {
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-accepted').value = 'all';
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-institution').value = '';
    document.getElementById('filter-event').value  = '';
    refreshGrid();
}

// ============================================================
// RENDER TABLE
// ============================================================
function renderTable(data) {
    const tbody = document.getElementById('registrations-tbody');

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:var(--text-secondary);padding:2rem;letter-spacing:2px">NO REGISTRATIONS FOUND</td></tr>`;
        document.getElementById('row-count').textContent = '0';
        return;
    }

    tbody.innerHTML = data.map(r => `
        <tr class="reg-row" data-id="${r.id}" tabindex="0"
            onclick="selectRow(this)" onkeydown="rowKeyHandler(event, this)">
            <td>${r.id}</td>
            <td style="color:var(--neon-cyan);font-weight:bold">${escHtml(r.teamName || '—')}</td>
            <td>${escHtml(r.name)}</td>
            <td style="font-size:0.75rem">${escHtml(r.email)}</td>
            <td>${escHtml(r.phone)}</td>
            <td>${escHtml(r.eventName)}</td>
            <td class="utr-value">${escHtml(r.transactionId || '—')}</td>
            <td>
                <span class="badge ${r.status_badge_class}">
                    <span class="status-dot dot-${r.status}"></span>${r.status_label}
                    ${r.isAccepted ? '<span style="color:var(--neon-green);margin-left:5px">●</span>' : ''}
                </span>
            </td>
            <td>
                ${r.needsAccommodation ? `<span style="color:var(--neon-yellow);font-size:0.7rem">✔ YES</span>` : `<span style="color:var(--text-secondary);font-size:0.7rem">—</span>`}
            </td>
            <td>
                <div style="display:flex;gap:0.4rem;flex-wrap:wrap">
                    <button class="btn btn-cyan btn-sm" onclick="event.stopPropagation();openVerifyModal(${r.id})">👁 VIEW</button>
                    ${r.status !== 'verified' ? `<button class="btn btn-green btn-sm" onclick="event.stopPropagation();quickVerify(${r.id}, 'approve')">✔</button>` : ''}
                    ${r.status !== 'rejected' ? `<button class="btn btn-red btn-sm" onclick="event.stopPropagation();openRejectModal(${r.id})">✘</button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');

    document.getElementById('row-count').textContent = data.length;
}

function updateStats(stats) {
    document.getElementById('stat-total').textContent    = stats.total;
    document.getElementById('stat-pending').textContent  = stats.pending;
    document.getElementById('stat-verified').textContent = stats.verified;
    document.getElementById('stat-rejected').textContent = stats.rejected;
}

function updateLastRefresh() {
    const now = new Date();
    document.getElementById('last-refresh').textContent =
        'LAST SYNC: ' + now.toLocaleTimeString('en-IN');
}

// ============================================================
// OPEN VERIFY MODAL
// ============================================================
function openVerifyModal(id) {
    const reg = registrationsData.find(r => r.id === id);
    if (!reg) return;

    currentModalId = id;

    document.getElementById('modal-reg-id').textContent = '#' + id;
    document.getElementById('mi-teamName').textContent = reg.teamName || '—';
    document.getElementById('mi-event').textContent   = reg.eventName;
    document.getElementById('mi-amount').textContent  = '₹' + Number(reg.amount || 0).toLocaleString('en-IN');
    document.getElementById('mi-utr').textContent     = reg.transactionId || '—';
    document.getElementById('mi-institution').textContent = reg.institution || '—';

    const statusEl = document.getElementById('mi-status');
    statusEl.innerHTML = `<span class="badge ${reg.status_badge_class}">${reg.status_label}</span> ${reg.isAccepted ? '<span style="color:var(--neon-green)">● ACCEPTED</span>' : ''}`;

    const accomEl = document.getElementById('mi-accom');
    accomEl.innerHTML = reg.needsAccommodation 
        ? '<span style="color:var(--neon-yellow)">✔ REQUESTED</span>' 
        : '<span style="color:var(--text-secondary)">NOT REQUESTED</span>';

    // Populate participants
    const pList = document.getElementById('participant-list');
    let pHtml = '';
    for(let i=1; i<=4; i++) {
        const name = reg[`participant${i}`];
        if(name) {
            pHtml += `
                <div style="font-size:0.75rem; margin-bottom:0.4rem; padding-bottom:0.4rem; border-bottom:1px solid #ffffff11">
                    <div style="color:var(--neon-cyan)">${i}. ${escHtml(name)}</div>
                    <div style="color:var(--text-secondary); font-size:0.65rem">${escHtml(reg[`email${i}`] || '—')} | ${escHtml(reg[`phone${i}`] || '—')}</div>
                </div>
            `;
        }
    }
    // If no participants found but we have name/email/phone from migration v1, show them
    if(!pHtml && reg.name) {
        pHtml = `
            <div style="font-size:0.75rem; margin-bottom:0.4rem; padding-bottom:0.4rem; border-bottom:1px solid #ffffff11">
                <div style="color:var(--neon-cyan)">1. ${escHtml(reg.name)}</div>
                <div style="color:var(--text-secondary); font-size:0.65rem">${escHtml(reg.email || '—')} | ${escHtml(reg.phone || '—')}</div>
            </div>
        `;
    }
    pList.innerHTML = pHtml || '<div style="color:var(--text-secondary); font-size:0.7rem">No participant details found.</div>';

    const notesRow = document.getElementById('mi-notes-row');
    if (reg.adminNotes) {
        notesRow.style.display = 'flex';
        document.getElementById('mi-notes').textContent = reg.adminNotes;
    } else {
        notesRow.style.display = 'none';
    }

    // Reset reject notes area
    hideRejectNotes();
    document.getElementById('csv-preview-area').style.display = 'none';

    // Load receipt image
    loadReceiptImage(id);

    openModal('verify-modal');
}

function loadReceiptImage(id) {
    const img      = document.getElementById('receipt-img');
    const loading  = document.getElementById('receipt-loading');
    const errDiv   = document.getElementById('receipt-error');
    const openLink = document.getElementById('receipt-open-link');

    img.style.display    = 'none';
    loading.style.display = 'block';
    errDiv.style.display = 'none';
    openLink.style.display = 'none';
    img.src = '';

    const url = `/api/admin/fetch-receipt/${id}`;

    img.onload = function() {
        loading.style.display = 'none';
        img.style.display = 'block';
        openLink.href = url;
        openLink.style.display = 'inline-flex';
    };
    img.onerror = function() {
        receiptLoadError();
    };

    // We load the image through the proxy route
    img.src = url;
}

function receiptLoadError() {
    document.getElementById('receipt-loading').style.display = 'none';
    document.getElementById('receipt-img').style.display = 'none';
    document.getElementById('receipt-error').style.display = 'block';
    document.getElementById('receipt-error').textContent = '✘ No receipt image found or FTP unavailable.';
}

// ============================================================
// VERIFICATION ACTIONS
// ============================================================
async function modalVerify(action) {
    if (!currentModalId) return;
    const notes = action === 'reject'
        ? document.getElementById('reject-notes-input').value.trim()
        : null;

    if (action === 'reject' && !notes) {
        showToast('Please enter a rejection reason.', 'error');
        return;
    }

    await submitVerify(currentModalId, action, notes);
    closeModal('verify-modal');
}

async function modalReset() {
    if (!currentModalId) return;
    await submitReset(currentModalId);
    closeModal('verify-modal');
}

async function quickVerify(id, action) {
    await submitVerify(id, action, null);
}

async function submitQuickReject() {
    if (!currentQuickId) return;
    const notes = document.getElementById('quick-reject-notes').value.trim();
    await submitVerify(currentQuickId, 'reject', notes);
    closeModal('reject-modal');
}

async function submitVerify(id, action, notes) {
    try {
        const body = { action };
        if (notes) body.admin_notes = notes;

        const res  = await fetch(`/api/admin/verify/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type':  'application/json',
                'X-CSRF-TOKEN':  window.CSRF_TOKEN,
                'Accept':        'application/json',
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Request failed');

        showToast(data.message, 'success');
        await refreshGrid();
    } catch (e) {
        showToast('Verification failed: ' + e.message, 'error');
    }
}

async function submitReset(id) {
    try {
        const res  = await fetch(`/api/admin/verify/${id}/reset`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': window.CSRF_TOKEN,
                'Accept':       'application/json',
            },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Reset failed');
        showToast(data.message, 'success');
        await refreshGrid();
    } catch (e) {
        showToast('Reset failed: ' + e.message, 'error');
    }
}

// ============================================================
// REJECT MODAL (quick from table)
// ============================================================
function openRejectModal(id) {
    currentQuickId = id;
    document.getElementById('reject-modal-id').textContent = '#' + id;
    document.getElementById('quick-reject-notes').value = '';
    openModal('reject-modal');
}

// ============================================================
// MODAL HELPERS
// ============================================================
function openModal(id) {
    document.getElementById(id).classList.add('active');
    // Trap focus in modal
    setTimeout(() => document.querySelector(`#${id} .modal`).focus?.(), 50);
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    currentModalId = null;
}

function showRejectNotesInModal() {
    document.getElementById('reject-notes-area').style.display = 'block';
    document.getElementById('reject-notes-input').focus();
}

function hideRejectNotes() {
    document.getElementById('reject-notes-area').style.display = 'none';
    document.getElementById('reject-notes-input').value = '';
}

// ============================================================
// CSV PREVIEW
// ============================================================
async function loadCsvPreview() {
    if (!currentModalId) return;

    const area = document.getElementById('csv-preview-area');
    const wrap = document.getElementById('csv-table-wrap');
    area.style.display = 'block';
    wrap.innerHTML = '<span style="color:var(--text-secondary);font-size:0.75rem;letter-spacing:2px">LOADING CSV…</span>';

    try {
        const res  = await fetch(`/api/admin/csv-preview/${currentModalId}`, {
            headers: { 'X-CSRF-TOKEN': window.CSRF_TOKEN, 'Accept': 'application/json' }
        });
        const data = await res.json();

        if (!data.rows || data.rows.length === 0) {
            wrap.innerHTML = '<span style="color:var(--text-secondary)">No CSV data found.</span>';
            return;
        }

        const headers = Object.keys(data.rows[0]);
        const table = `
            <table class="data-table" style="font-size:0.72rem">
                <thead><tr>${headers.map(h => `<th>${escHtml(h)}</th>`).join('')}</tr></thead>
                <tbody>
                    ${data.rows.map(row =>
                        `<tr>${headers.map(h => `<td>${escHtml(String(row[h] ?? ''))}</td>`).join('')}</tr>`
                    ).join('')}
                </tbody>
            </table>`;
        wrap.innerHTML = table;
    } catch (e) {
        wrap.innerHTML = `<span style="color:var(--neon-red)">✘ Failed to load CSV: ${escHtml(e.message)}</span>`;
    }
}

// ============================================================
// BATCH EXPORT
// ============================================================
async function exportCategory() {
    const category = document.getElementById('export-category').value.trim();
    if (!category) {
        showToast('Please enter a category name.', 'error');
        return;
    }

    showToast('Starting export for category: ' + category, 'success');

    // Trigger download via form submit (stream download)
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `/api/admin/export/${encodeURIComponent(category)}`;
    const csrf = document.createElement('input');
    csrf.type  = 'hidden';
    csrf.name  = '_token';
    csrf.value = window.CSRF_TOKEN;
    form.appendChild(csrf);
    document.body.appendChild(form);
    form.submit();
    setTimeout(() => document.body.removeChild(form), 1000);
}

async function exportMasterCsv() {
    showToast('Generating Master CSV Export (Applying current filters)...', 'success');

    const params = new URLSearchParams(buildFilterParams());
    
    // Trigger download via form submit to handle CSRF and POST if needed, 
    // but here we use the filters from the UI.
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `/api/admin/export-master?` + params.toString();
    
    const csrf = document.createElement('input');
    csrf.type  = 'hidden';
    csrf.name  = '_token';
    csrf.value = window.CSRF_TOKEN;
    form.appendChild(csrf);
    
    document.body.appendChild(form);
    form.submit();
    setTimeout(() => document.body.removeChild(form), 1000);
}

// ============================================================
// ROW SELECTION & KEYBOARD SHORTCUTS
// ============================================================
function selectRow(el) {
    if (selectedRowEl) selectedRowEl.classList.remove('row-selected');
    selectedRowEl = el;
    el.classList.add('row-selected');
}

function rowKeyHandler(e, el) {
    if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        const id = parseInt(el.dataset.id);
        openVerifyModal(id);
    }
}

document.addEventListener('keydown', function(e) {
    // Modal shortcuts
    const verifyModal = document.getElementById('verify-modal');
    const isModalOpen = verifyModal.classList.contains('active');

    if (isModalOpen) {
        if (e.key === 'Escape') { closeModal('verify-modal'); return; }
        if (e.key === 'Enter' && !e.target.matches('textarea,input')) {
            e.preventDefault();
            modalVerify('approve');
            return;
        }
        if ((e.key === 'r' || e.key === 'R') && !e.target.matches('textarea,input')) {
            e.preventDefault();
            showRejectNotesInModal();
            return;
        }
        return;
    }

    const rejectModalOpen = document.getElementById('reject-modal').classList.contains('active');
    if (rejectModalOpen) {
        if (e.key === 'Escape') { closeModal('reject-modal'); return; }
        return;
    }

    // Table navigation
    if (!selectedRowEl) {
        const firstRow = document.querySelector('.reg-row');
        if (firstRow && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            selectRow(firstRow);
            firstRow.focus();
        }
        return;
    }

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = selectedRowEl.nextElementSibling;
        if (next && next.classList.contains('reg-row')) { selectRow(next); next.focus(); }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = selectedRowEl.previousElementSibling;
        if (prev && prev.classList.contains('reg-row')) { selectRow(prev); prev.focus(); }
    } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        openVerifyModal(parseInt(selectedRowEl.dataset.id));
    } else if (e.key === 'Enter') {
        e.preventDefault();
        quickVerify(parseInt(selectedRowEl.dataset.id), 'approve');
    } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        openRejectModal(parseInt(selectedRowEl.dataset.id));
    }
});

// Close modals when clicking backdrop
document.getElementById('verify-modal').addEventListener('click', function(e) {
    if (e.target === this) closeModal('verify-modal');
});
document.getElementById('reject-modal').addEventListener('click', function(e) {
    if (e.target === this) closeModal('reject-modal');
});

// Debounce filter inputs for auto-refresh
let filterTimeout;
['filter-search', 'filter-status', 'filter-accepted', 'filter-category', 'filter-institution', 'filter-event'].forEach(id => {
    const el = document.getElementById(id);
    const event = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(event, () => {
        clearTimeout(filterTimeout);
        filterTimeout = setTimeout(refreshGrid, 600);
    });
});

// ============================================================
// UTILITIES
// ============================================================
function escHtml(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(String(str ?? '')));
    return d.innerHTML;
}

// Set last refresh timestamp on load
updateLastRefresh();
</script>
@endpush
