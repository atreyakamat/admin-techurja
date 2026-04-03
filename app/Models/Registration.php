<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Registration extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'teamName',
        'needsAccommodation',
        'participant1',
        'email1',
        'phone1',
        'participant2',
        'email2',
        'phone2',
        'participant3',
        'email3',
        'phone3',
        'participant4',
        'email4',
        'phone4',
        'name',
        'email',
        'phone',
        'college',
        'event',
        'category',
        'utr_number',
        'amount',
        'status',
        'admin_notes',
    ];

    /**
     * Attribute casts.
     */
    protected $casts = [
        'needsAccommodation' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Status constants.
     */
    const STATUS_PENDING  = 'pending';
    const STATUS_VERIFIED = 'verified';
    const STATUS_REJECTED = 'rejected';

    /**
     * Scope: filter by status.
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Check if payment is pending verification.
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Check if payment is verified.
     */
    public function isVerified(): bool
    {
        return $this->status === self::STATUS_VERIFIED;
    }

    /**
     * Check if payment is rejected.
     */
    public function isRejected(): bool
    {
        return $this->status === self::STATUS_REJECTED;
    }

    /**
     * Get the CSS badge class based on status.
     */
    public function getStatusBadgeClassAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_VERIFIED => 'badge-verified',
            self::STATUS_REJECTED => 'badge-rejected',
            default               => 'badge-pending',
        };
    }

    /**
     * Get the human-readable status label.
     */
    public function getStatusLabelAttribute(): string
    {
        return strtoupper($this->status);
    }

    /**
     * FTP directory path for this registration's receipt.
     */
    public function getFtpDirectoryAttribute(): string
    {
        return '/registrations/' . $this->id . '/';
    }
}
