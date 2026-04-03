<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Registration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

/**
 * Admin dashboard: displays live registration feed.
 */
class DashboardController extends Controller
{
    /**
     * Main dashboard page (initial full-page load).
     */
    public function index(Request $request): View
    {
        $stats = [
            'total'    => Registration::count(),
            'pending'  => Registration::byStatus('pending')->count(),
            'verified' => Registration::byStatus('verified')->count(),
            'rejected' => Registration::byStatus('rejected')->count(),
        ];

        $registrations = $this->getRegistrations($request);

        return view('admin.dashboard', compact('registrations', 'stats'));
    }

    /**
     * REFRESH_GRID endpoint – returns JSON for the live feed AJAX call.
     */
    public function refresh(Request $request): JsonResponse
    {
        $registrations = $this->getRegistrations($request);

        return response()->json([
            'registrations' => $registrations->map(fn ($r) => [
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
                'college'            => $r->college,
                'event'              => $r->event,
                'category'           => $r->category,
                'utr_number'         => $r->utr_number,
                'amount'             => $r->amount,
                'status'             => $r->status,
                'status_label'       => $r->status_label,
                'status_badge_class' => $r->status_badge_class,
                'admin_notes'        => $r->admin_notes,
                'created_at'         => $r->created_at?->format('d M Y, H:i'),
            ]),
            'stats' => [
                'total'    => Registration::count(),
                'pending'  => Registration::byStatus('pending')->count(),
                'verified' => Registration::byStatus('verified')->count(),
                'rejected' => Registration::byStatus('rejected')->count(),
            ],
        ]);
    }

    /**
     * Shared query builder for registrations.
     */
    private function getRegistrations(Request $request)
    {
        $query = Registration::query()->latest();

        if ($status = $request->input('status')) {
            $query->byStatus($status);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('utr_number', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('teamName', 'like', "%{$search}%");
            });
        }

        if ($event = $request->input('event')) {
            $query->where('event', $event);
        }

        return $query->get();
    }
}
