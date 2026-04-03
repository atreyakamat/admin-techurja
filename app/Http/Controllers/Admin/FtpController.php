<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Registration;
use App\Services\FtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\StreamedResponse;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * FtpController: Proxies FTP requests server-side.
 * FTP credentials are never exposed to the browser.
 */
class FtpController extends Controller
{
    public function __construct(private readonly FtpService $ftp) {}

    /**
     * Fetch and stream a registration payment receipt from FTP.
     *
     * GET /api/admin/fetch-receipt/{id}
     */
    public function fetchReceipt(int $id): Response|JsonResponse
    {
        $registration = Registration::findOrFail($id);

        try {
            // Priority 1: Use the path stored in paymentScreenshot if it looks like a file path
            $remotePath = $registration->paymentScreenshot;

            // If not a path (e.g. 'pending', 'UPLOADED_TO_FTP', etc), search the directory
            if (!$remotePath || !str_contains($remotePath, '.')) {
                $remotePath = $this->ftp->findReceiptImage($id);
            }

            if ($remotePath === null) {
                return response()->json(['error' => 'No receipt image found for this registration.'], 404);
            }

            $contents  = $this->ftp->getFileContents($remotePath);
            $extension = strtolower(pathinfo($remotePath, PATHINFO_EXTENSION));
            $mimeType  = $this->extensionToMime($extension);

            return response($contents, 200, [
                'Content-Type'        => $mimeType,
                'Content-Disposition' => "inline; filename=\"receipt_{$id}.{$extension}\"",
                'Cache-Control'       => 'no-store, no-cache, must-revalidate',
                'X-Content-Type-Options' => 'nosniff',
            ]);
        } catch (RuntimeException $e) {
            Log::error("FTP receipt fetch failed for ID {$id}: " . $e->getMessage());
            return response()->json(['error' => 'Unable to retrieve receipt from FTP storage.'], 502);
        } finally {
            $this->ftp->disconnect();
        }
    }

    /**
     * Preview the details.csv for a registration from FTP.
     *
     * GET /api/admin/csv-preview/{id}
     */
    public function csvPreview(int $id): JsonResponse
    {
        Registration::findOrFail($id);

        try {
            $rows = $this->ftp->readRegistrationCsv($id);
            return response()->json(['rows' => $rows]);
        } catch (RuntimeException $e) {
            Log::error("FTP CSV preview failed for ID {$id}: " . $e->getMessage());
            return response()->json(['error' => 'Unable to retrieve CSV from FTP.'], 502);
        } finally {
            $this->ftp->disconnect();
        }
    }

    /**
     * Batch export: zip an entire category's FTP folders.
     *
     * POST /api/admin/export/{category}
     */
    public function exportCategory(Request $request, string $category): StreamedResponse|JsonResponse
    {
        // Sanitize category to prevent path traversal
        $category = preg_replace('/[^a-zA-Z0-9_\-]/', '', $category);

        if (empty($category)) {
            return response()->json(['error' => 'Invalid category name.'], 400);
        }

        try {
            $zipPath  = $this->ftp->exportCategoryZip($category);
            $filename = "techurja_{$category}_export_" . date('Ymd_His') . '.zip';

            return response()->streamDownload(function () use ($zipPath) {
                $handle = fopen($zipPath, 'rb');
                while (!feof($handle)) {
                    echo fread($handle, 8192);
                    flush();
                }
                fclose($handle);
                @unlink($zipPath);
            }, $filename, [
                'Content-Type'        => 'application/zip',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            ]);
        } catch (RuntimeException $e) {
            Log::error("FTP export failed for category {$category}: " . $e->getMessage());
            return response()->json(['error' => 'Export failed: ' . $e->getMessage()], 502);
        } finally {
            $this->ftp->disconnect();
        }
    }

    /**
     * Map a file extension to a MIME type (images only).
     */
    private function extensionToMime(string $ext): string
    {
        return match ($ext) {
            'jpg', 'jpeg' => 'image/jpeg',
            'png'         => 'image/png',
            'gif'         => 'image/gif',
            'webp'        => 'image/webp',
            'bmp'         => 'image/bmp',
            default       => 'application/octet-stream',
        };
    }
}
