<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\FtpController;
use App\Http\Controllers\Admin\VerificationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes – all protected by admin.auth middleware
|--------------------------------------------------------------------------
*/

Route::prefix('admin')->middleware(['web', 'admin.auth'])->group(function () {

    // Live registration feed (REFRESH_GRID)
    Route::get('/registrations', [DashboardController::class, 'refresh'])
         ->name('api.admin.registrations');

    // Payment verification
    Route::post('/verify/{id}',       [VerificationController::class, 'verify'])
         ->name('api.admin.verify');
    Route::post('/verify/{id}/reset', [VerificationController::class, 'reset'])
         ->name('api.admin.verify.reset');

    // FTP proxy – fetch receipt image (streamed securely)
    Route::get('/fetch-receipt/{id}', [FtpController::class, 'fetchReceipt'])
         ->name('api.admin.fetch-receipt');

    // FTP CSV preview
    Route::get('/csv-preview/{id}', [FtpController::class, 'csvPreview'])
         ->name('api.admin.csv-preview');

    // Batch export (ZIP download)
    Route::post('/export/{category}', [FtpController::class, 'exportCategory'])
         ->name('api.admin.export');

    // Master CSV export
    Route::post('/export-master', [DashboardController::class, 'exportMasterCsv'])
         ->name('api.admin.export-master');
});
