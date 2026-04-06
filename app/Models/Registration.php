<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Registration extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'registrations';

    /**
     * Constants for verification status.
     */
    const STATUS_PENDING  = 'pending';
    const STATUS_VERIFIED = 'verified';
    const STATUS_REJECTED = 'rejected';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name',
        'participant2',
        'email2',
        'phone2',
        'participant3',
        'email3',
        'phone3',
        'participant4',
        'email4',
        'phone4',
        'teamName',
        'email',
        'phone',
        'institution',
        'eventSlug',
        'eventName',
        'transactionId',
        'paymentScreenshot',
        'status',
        'isAccepted',
        'adminNotes',
        'needsAccommodation',
        'eventId',
        'createdAt',
    ];

    /**
     * Customize timestamp column names to match Prisma schema.
     */
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = null; // Registration model in Prisma doesn't have updatedAt

    /**
     * Attribute casts.
     */
    protected $casts = [
        'needsAccommodation' => 'boolean',
        'isAccepted'         => 'integer',
        'createdAt'          => 'datetime',
    ];

    /**
     * Get the event associated with the registration.
     */
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class, 'eventId');
    }

    /**
     * Human-readable status label.
     */
    public function getStatusLabelAttribute(): string
    {
        return strtoupper($this->status);
    }

    /**
     * CSS badge class based on status.
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
     * FTP directory path for this registration's receipt.
     */
    public function getFtpDirectoryAttribute(): string
    {
        return '/registrations/' . $this->id . '/';
    }
}
