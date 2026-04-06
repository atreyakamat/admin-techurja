<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Registration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Admin dashboard: displays live registration feed.
 */
class DashboardController extends Controller
{
    /**
     * Export a master CSV of all registrations for coordinators.
     */
    public function exportMasterCsv(Request $request): StreamedResponse
    {
        $registrations = $this->getRegistrations($request);
        $filename = "techurja_master_registrations_" . date('Ymd_His') . ".csv";

        $headers = [
            'ID', 'TEAM NAME', 'NAME', 'EMAIL', 'PHONE', 'INSTITUTION', 'EVENT', 'CATEGORY', 
            'TRANSACTION ID', 'AMOUNT', 'STATUS', 'ACCEPTED', 'ACCOMMODATION', 'ADMIN NOTES', 
            'P1 NAME', 'P1 EMAIL', 'P1 PHONE',
            'P2 NAME', 'P2 EMAIL', 'P2 PHONE',
            'P3 NAME', 'P3 EMAIL', 'P3 PHONE',
            'P4 NAME', 'P4 EMAIL', 'P4 PHONE',
            'CREATED AT'
        ];

        return response()->streamDownload(function () use ($registrations, $headers) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, $headers);

            foreach ($registrations as $r) {
                fputcsv($handle, [
                    $r->id,
                    $r->teamName,
                    $r->name,
                    $r->email,
                    $r->phone,
                    $r->institution,
                    $r->eventName, // Using eventName from Prisma
                    $r->category,
                    $r->transactionId,
                    $r->amount,
                    $r->status,
                    $r->isAccepted ? 'YES' : 'NO',
                    $r->needsAccommodation ? 'YES' : 'NO',
                    $r->adminNotes,
                    $r->name, $r->email, $r->phone, // Mapping V1 fields for P1
                    $r->participant2, $r->email2, $r->phone2,
                    $r->participant3, $r->email3, $r->phone3,
                    $r->participant4, $r->email4, $r->phone4,
                    $r->createdAt?->toDateTimeString(),
                ]);
            }
            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Main dashboard page (initial full-page load).
     */
    public function index(Request $request): View
    {
        $stats = [
            'total'    => Registration::count(),
            'pending'  => Registration::where('status', 'pending')->count(),
            'verified' => Registration::where('status', 'verified')->count(),
            'rejected' => Registration::where('status', 'rejected')->count(),
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
                'name'               => $r->name,
                'email'              => $r->email,
                'phone'              => $r->phone,
                'participant2'       => $r->participant2,
                'email2'             => $r->email2,
                'phone2'             => $r->phone2,
                'participant3'       => $r->participant3,
                'email3'             => $r->email3,
                'phone3'             => $r->phone3,
                'participant4'       => $r->participant4,
                'email4'             => $r->email4,
                'phone4'             => $r->phone4,
                'institution'        => $r->institution,
                'event'              => $r->eventName,
                'category'           => $r->category,
                'transactionId'      => $r->transactionId,
                'amount'             => $r->amount,
                'paymentScreenshot'  => $r->paymentScreenshot,
                'status'             => $r->status,
                'isAccepted'         => $r->isAccepted,
                'status_label'       => $r->status_label,
                'status_badge_class' => $r->status_badge_class,
                'adminNotes'         => $r->adminNotes,
                'created_at'         => $r->createdAt?->format('d M Y, H:i'),
            ]),
            'stats' => [
                'total'    => Registration::count(),
                'pending'  => Registration::where('status', 'pending')->count(),
                'verified' => Registration::where('status', 'verified')->count(),
                'rejected' => Registration::where('status', 'rejected')->count(),
            ],
        ]);
    }

    /**
     * Shared query builder for registrations.
     */
    private function getRegistrations(Request $request)
    {
        $query = Registration::query()->orderBy('createdAt', 'desc');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($isAccepted = $request->input('isAccepted')) {
            if ($isAccepted !== 'all') {
                $query->where('isAccepted', $isAccepted === '1' ? 1 : 0);
            }
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('transactionId', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('teamName', 'like', "%{$search}%")
                  ->orWhere('institution', 'like', "%{$search}%");
            });
        }

        if ($event = $request->input('event')) {
            $query->where('eventName', 'like', "%{$event}%");
        }

        if ($category = $request->input('category')) {
            $query->where('category', 'like', "%{$category}%");
        }

        if ($institution = $request->input('institution')) {
            $query->where('institution', 'like', "%{$institution}%");
        }

        return $query->get();
    }
}
