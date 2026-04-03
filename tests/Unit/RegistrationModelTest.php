<?php

namespace Tests\Unit;

use App\Models\Registration;
use PHPUnit\Framework\TestCase;

class RegistrationModelTest extends TestCase
{
    private function makeRegistration(string $status): Registration
    {
        $reg = new Registration();
        $reg->status = $status;
        return $reg;
    }

    public function test_is_pending_returns_true_for_pending_status(): void
    {
        $reg = $this->makeRegistration('pending');
        $this->assertTrue($reg->isPending());
        $this->assertFalse($reg->isVerified());
        $this->assertFalse($reg->isRejected());
    }

    public function test_is_verified_returns_true_for_verified_status(): void
    {
        $reg = $this->makeRegistration('verified');
        $this->assertFalse($reg->isPending());
        $this->assertTrue($reg->isVerified());
        $this->assertFalse($reg->isRejected());
    }

    public function test_is_rejected_returns_true_for_rejected_status(): void
    {
        $reg = $this->makeRegistration('rejected');
        $this->assertFalse($reg->isPending());
        $this->assertFalse($reg->isVerified());
        $this->assertTrue($reg->isRejected());
    }

    public function test_status_badge_class_for_pending(): void
    {
        $reg = $this->makeRegistration('pending');
        $this->assertEquals('badge-pending', $reg->status_badge_class);
    }

    public function test_status_badge_class_for_verified(): void
    {
        $reg = $this->makeRegistration('verified');
        $this->assertEquals('badge-verified', $reg->status_badge_class);
    }

    public function test_status_badge_class_for_rejected(): void
    {
        $reg = $this->makeRegistration('rejected');
        $this->assertEquals('badge-rejected', $reg->status_badge_class);
    }

    public function test_status_label_is_uppercase(): void
    {
        foreach (['pending', 'verified', 'rejected'] as $status) {
            $reg = $this->makeRegistration($status);
            $this->assertEquals(strtoupper($status), $reg->status_label);
        }
    }

    public function test_ftp_directory_includes_id(): void
    {
        $reg = new Registration();
        $reg->id = 42;
        $this->assertEquals('/registrations/42/', $reg->ftp_directory);
    }

    public function test_status_constants(): void
    {
        $this->assertEquals('pending',  Registration::STATUS_PENDING);
        $this->assertEquals('verified', Registration::STATUS_VERIFIED);
        $this->assertEquals('rejected', Registration::STATUS_REJECTED);
    }
}
