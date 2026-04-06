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
     *   adminNotes  string  Optional rejection reason
     */
    public function verify(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'action'     => ['required', Rule::in(['approve', 'reject'])],
            'adminNotes' => ['nullable', 'string', 'max:500'],
        ]);

        $registration = Registration::findOrFail($id);

        $isApprove = $validated['action'] === 'approve';
        $newStatus = $isApprove ? Registration::STATUS_VERIFIED : Registration::STATUS_REJECTED;

        $registration->update([
            'status'     => $newStatus,
            'isAccepted' => $isApprove ? 1 : 0,
            'adminNotes' => $validated['adminNotes'] ?? null,
        ]);

        return response()->json([
            'success'            => true,
            'id'                 => $registration->id,
            'status'             => $registration->status,
            'isAccepted'         => $registration->isAccepted,
            'status_label'       => $registration->status_label,
            'status_badge_class' => $registration->status_badge_class,
            'adminNotes'         => $registration->adminNotes,
            'message'            => "Registration #{$id} has been " . strtoupper($newStatus) . '.',
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
            'status'     => Registration::STATUS_PENDING,
            'isAccepted' => 0,
            'adminNotes' => null,
        ]);

        return response()->json([
            'success'            => true,
            'id'                 => $registration->id,
            'status'             => $registration->status,
            'isAccepted'         => $registration->isAccepted,
            'status_label'       => $registration->status_label,
            'status_badge_class' => $registration->status_badge_class,
            'message'            => "Registration #{$id} reset to PENDING.",
        ]);
    }
}
