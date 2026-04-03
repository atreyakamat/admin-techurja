<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Registration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Handles APPROVE / REJECT verification of registrations.
 */
class VerificationController extends Controller
{
    /**
     * Verify (approve or reject) a registration.
     *
     * POST /api/admin/verify/{id}
     *
     * Body:
     *   action      string  "approve" | "reject"
     *   admin_notes string  Optional rejection reason
     */
    public function verify(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'action'      => ['required', Rule::in(['approve', 'reject'])],
            'admin_notes' => ['nullable', 'string', 'max:500'],
        ]);

        $registration = Registration::findOrFail($id);

        $newStatus = $validated['action'] === 'approve'
            ? Registration::STATUS_VERIFIED
            : Registration::STATUS_REJECTED;

        $registration->update([
            'status'      => $newStatus,
            'admin_notes' => $validated['admin_notes'] ?? null,
        ]);

        return response()->json([
            'success'      => true,
            'id'           => $registration->id,
            'status'       => $registration->status,
            'status_label' => $registration->status_label,
            'status_badge_class' => $registration->status_badge_class,
            'admin_notes'  => $registration->admin_notes,
            'message'      => "Registration #{$id} has been " . strtoupper($newStatus) . '.',
        ]);
    }

    /**
     * Reset a registration back to pending.
     *
     * POST /api/admin/verify/{id}/reset
     */
    public function reset(Request $request, int $id): JsonResponse
    {
        $registration = Registration::findOrFail($id);

        $registration->update([
            'status'      => Registration::STATUS_PENDING,
            'admin_notes' => null,
        ]);

        return response()->json([
            'success'      => true,
            'id'           => $registration->id,
            'status'       => $registration->status,
            'status_label' => $registration->status_label,
            'status_badge_class' => $registration->status_badge_class,
            'message'      => "Registration #{$id} reset to PENDING.",
        ]);
    }
}
