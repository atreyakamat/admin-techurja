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
        <div class="filter-group" style="min-width:200px">
            <label>Search</label>
            <input type="search" id="filter-search" placeholder="Name, email, UTR, phone…">
        </div>
        <div class="filter-group" style="max-width:140px">
            <label>Status</label>
            <select id="filter-status">
                <option value="">ALL</option>
                <option value="pending">PENDING</option>
                <option value="verified">VERIFIED</option>
                <option value="rejected">REJECTED</option>
            </select>
        </div>
        <div class="filter-group" style="max-width:120px">
            <label>Accepted</label>
            <select id="filter-accepted">
                <option value="all">ALL</option>
                <option value="1">YES</option>
                <option value="0">NO</option>
            </select>
        </div>
        <div class="filter-group" style="max-width:140px">
            <label>Event Name</label>
            <input type="text" id="filter-event" placeholder="Event…">
        </div>
        <div class="filter-group" style="max-width:120px">
            <label>Category</label>
            <input type="text" id="filter-category" placeholder="Cat…">
        </div>
        
        {{-- Date Ranges --}}
        <div class="filter-group" style="max-width:130px">
            <label>Reg From</label>
            <input type="date" id="filter-reg-from">
        </div>
        <div class="filter-group" style="max-width:130px">
            <label>Reg To</label>
            <input type="date" id="filter-reg-to">
        </div>
        <div class="filter-group" style="max-width:130px">
            <label>Event From</label>
            <input type="date" id="filter-event-from">
        </div>
        <div class="filter-group" style="max-width:130px">
            <label>Event To</label>
            <input type="date" id="filter-event-to">
        </div>

        <div style="display:flex;gap:0.5rem;align-items:flex-end;flex-wrap:wrap">
            <button class="btn btn-cyan" id="refresh-btn" onclick="refreshGrid()">
                <span id="refresh-icon">⟳</span> REFRESH
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
                        <span class="info-key">STATUS</span>
                        <span class="info-val" id="mi-status">—</span>
                    </div>
                    <div class="info-row" id="mi-notes-row" style="display:none">
                        <span class="info-key">NOTES</span>
                        <span class="info-val" id="mi-notes" style="color:var(--neon-red)">—</span>
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
// DATA STORE
// ============================================================
@php
$mappedRegistrations = $registrations->map(fn($r) => [
    'id'                 => $r->id,
    'teamName'           => $r->teamName,
    'needsAccommodation' => $r->needsAccommodation,
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
    'category'           => $r->event?->category ?? 'N/A',
    'transactionId'      => $r->transactionId,
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

// ============================================================
// CORE AJAX
// ============================================================
async function refreshGrid() {
    const btn = document.getElementById('refresh-btn');
    const icon = document.getElementById('refresh-icon');
    btn.disabled = true;
    icon.innerHTML = '<span class="spinner"></span>';

    const params = buildFilterParams();
    try {
        const res = await fetch('/api/admin/registrations?' + params, {
            headers: { 'X-CSRF-TOKEN': window.CSRF_TOKEN, 'Accept': 'application/json' }
        });
        const data = await res.json();
        registrationsData = data.registrations;
        renderTable(registrationsData);
        updateStats(data.stats);
        updateLastRefresh();
    } catch (e) {
        showToast('Grid refresh failed', 'error');
    } finally {
        btn.disabled = false;
        icon.textContent = '⟳';
    }
}

function buildFilterParams() {
    const p = new URLSearchParams();
    const s = document.getElementById('filter-search').value.trim();
    const st = document.getElementById('filter-status').value;
    const acc = document.getElementById('filter-accepted').value;
    const cat = document.getElementById('filter-category').value.trim();
    const ev = document.getElementById('filter-event').value.trim();
    const rf = document.getElementById('filter-reg-from').value;
    const rt = document.getElementById('filter-reg-to').value;
    const ef = document.getElementById('filter-event-from').value;
    const et = document.getElementById('filter-event-to').value;

    if (s)   p.set('search', s);
    if (st)  p.set('status', st);
    if (acc) p.set('isAccepted', acc);
    if (cat) p.set('category', cat);
    if (ev)  p.set('event', ev);
    if (rf)  p.set('reg_from', rf);
    if (rt)  p.set('reg_to', rt);
    if (ef)  p.set('event_from', ef);
    if (et)  p.set('event_to', et);
    return p.toString();
}

function clearFilters() {
    ['filter-search','filter-category','filter-event','filter-reg-from','filter-reg-to','filter-event-from','filter-event-to'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-accepted').value = 'all';
    refreshGrid();
}

function renderTable(data) {
    const tbody = document.getElementById('registrations-tbody');
    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:var(--text-secondary);padding:2rem">NO REGISTRATIONS FOUND</td></tr>`;
        document.getElementById('row-count').textContent = '0';
        return;
    }
    tbody.innerHTML = data.map(r => `
        <tr class="reg-row" data-id="${r.id}" tabindex="0" onclick="selectRow(this)" onkeydown="rowKeyHandler(event, this)">
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
            <td>${r.needsAccommodation ? '<span style="color:var(--neon-yellow);font-size:0.7rem">✔ YES</span>' : '—'}</td>
            <td>
                <div style="display:flex;gap:0.4rem">
                    <button class="btn btn-cyan btn-sm" onclick="event.stopPropagation();openVerifyModal(${r.id})">👁</button>
                    ${r.status !== 'verified' ? `<button class="btn btn-green btn-sm" onclick="event.stopPropagation();quickVerify(${r.id}, 'approve')">✔</button>` : ''}
                    ${r.status !== 'rejected' ? `<button class="btn btn-red btn-sm" onclick="event.stopPropagation();openRejectModal(${r.id})">✘</button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
    document.getElementById('row-count').textContent = data.length;
}

// ============================================================
// VERIFICATION
// ============================================================
function openVerifyModal(id) {
    const reg = registrationsData.find(r => r.id === id);
    if (!reg) return;
    currentModalId = id;
    document.getElementById('modal-reg-id').textContent = '#' + id;
    document.getElementById('mi-teamName').textContent = reg.teamName || '—';
    document.getElementById('mi-event').textContent = reg.eventName;
    document.getElementById('mi-utr').textContent = reg.transactionId || '—';
    document.getElementById('mi-status').innerHTML = `<span class="badge ${reg.status_badge_class}">${reg.status_label}</span>`;
    
    let pHtml = `
        <div style="font-size:0.75rem; margin-bottom:0.4rem">
            <div style="color:var(--neon-cyan)">1. ${escHtml(reg.name)}</div>
            <div style="color:var(--text-secondary); font-size:0.65rem">${escHtml(reg.email)} | ${escHtml(reg.phone)}</div>
        </div>`;
    for(let i=2; i<=4; i++) {
        if(reg['participant'+i]) pHtml += `<div style="font-size:0.75rem; margin-bottom:0.4rem"><div style="color:var(--neon-cyan)">${i}. ${escHtml(reg['participant'+i])}</div></div>`;
    }
    document.getElementById('participant-list').innerHTML = pHtml;

    const notesRow = document.getElementById('mi-notes-row');
    if (reg.adminNotes) { notesRow.style.display = 'flex'; document.getElementById('mi-notes').textContent = reg.adminNotes; }
    else { notesRow.style.display = 'none'; }

    loadReceiptImage(id);
    hideRejectNotes();
    openModal('verify-modal');
}

async function submitVerify(id, action, notes) {
    try {
        const body = { action };
        if (notes) body.adminNotes = notes;
        const res = await fetch(\`/api/admin/verify/\${id}\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': window.CSRF_TOKEN, 'Accept': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        showToast(data.message);
        refreshGrid();
    } catch (e) { showToast(e.message, 'error'); }
}

async function quickVerify(id, action) { await submitVerify(id, action, null); }
async function modalVerify(action) {
    if (!currentModalId) return;
    const notes = action === 'reject' ? document.getElementById('reject-notes-input').value.trim() : null;
    if (action === 'reject' && !notes) { showToast('Reason required', 'error'); return; }
    await submitVerify(currentModalId, action, notes);
    closeModal('verify-modal');
}

// ============================================================
// FTP & EXPORTS
// ============================================================
function loadReceiptImage(id) {
    const img = document.getElementById('receipt-img'), loading = document.getElementById('receipt-loading'), err = document.getElementById('receipt-error'), link = document.getElementById('receipt-open-link');
    img.style.display = 'none'; loading.style.display = 'block'; err.style.display = 'none'; link.style.display = 'none';
    const url = `/api/admin/fetch-receipt/${id}`;
    img.onload = () => { loading.style.display = 'none'; img.style.display = 'block'; link.href = url; link.style.display = 'inline-flex'; };
    img.onerror = () => { loading.style.display = 'none'; err.style.display = 'block'; err.textContent = 'Receipt not found on FTP'; };
    img.src = url;
}

async function exportMasterCsv() {
    const params = buildFilterParams();
    const form = document.createElement('form');
    form.method = 'POST'; form.action = '/api/admin/export-master?' + params;
    const csrf = document.createElement('input'); csrf.type = 'hidden'; csrf.name = '_token'; csrf.value = window.CSRF_TOKEN;
    form.appendChild(csrf); document.body.appendChild(form); form.submit();
}

// ============================================================
// UTILS
// ============================================================
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); currentModalId = null; }
function selectRow(el) { if (selectedRowEl) selectedRowEl.classList.remove('row-selected'); selectedRowEl = el; el.classList.add('row-selected'); }
function showToast(m, t='success') {
    const c = document.getElementById('toast-container'), toast = document.createElement('div');
    toast.className = `toast toast-\${t}`; toast.textContent = m;
    c.appendChild(toast); setTimeout(() => toast.remove(), 3000);
}
function updateStats(s) { ['total','pending','verified','rejected'].forEach(k => document.getElementById('stat-'+k).textContent = s[k]); }
function updateLastRefresh() { document.getElementById('last-refresh').textContent = 'SYNCED: ' + new Date().toLocaleTimeString(); }
function escHtml(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
function showRejectNotesInModal() { document.getElementById('reject-notes-area').style.display = 'block'; }
function hideRejectNotes() { document.getElementById('reject-notes-area').style.display = 'none'; document.getElementById('reject-notes-input').value = ''; }

// Listeners
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal('verify-modal'); closeModal('reject-modal'); }
});

['filter-search','filter-status','filter-accepted'].forEach(id => document.getElementById(id).addEventListener('change', refreshGrid));
</script>
@endpush
