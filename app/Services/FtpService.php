<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * FtpService: Wraps PHP's native FTP extension for secure,
 * server-side FTP access. Credentials never leave the server.
 */
class FtpService
{
    private $connection = null;

    private string $host;
    private string $username;
    private string $password;
    private int    $port;
    private bool   $passive;
    private bool   $ssl;
    private int    $timeout;

    public function __construct()
    {
        $this->host     = config('filesystems.disks.ftp.host', 'localhost');
        $this->username = config('filesystems.disks.ftp.username', '');
        $this->password = config('filesystems.disks.ftp.password', '');
        $this->port     = (int) config('filesystems.disks.ftp.port', 21);
        $this->passive  = (bool) config('filesystems.disks.ftp.passive', true);
        $this->ssl      = (bool) config('filesystems.disks.ftp.ssl', false);
        $this->timeout  = (int) config('filesystems.disks.ftp.timeout', 30);
    }

    /**
     * Open an FTP connection and log in.
     *
     * @throws RuntimeException
     */
    public function connect(): void
    {
        if ($this->connection !== null) {
            return;
        }

        $conn = $this->ssl
            ? @ftp_ssl_connect($this->host, $this->port, $this->timeout)
            : @ftp_connect($this->host, $this->port, $this->timeout);

        if ($conn === false) {
            throw new RuntimeException("FTP connection failed to {$this->host}:{$this->port}");
        }

        if (!@ftp_login($conn, $this->username, $this->password)) {
            ftp_close($conn);
            throw new RuntimeException('FTP login failed');
        }

        if ($this->passive) {
            ftp_pasv($conn, true);
        }

        $this->connection = $conn;
    }

    /**
     * Close the FTP connection if open.
     */
    public function disconnect(): void
    {
        if ($this->connection !== null) {
            ftp_close($this->connection);
            $this->connection = null;
        }
    }

    /**
     * List files in a remote directory.
     *
     * @param  string  $directory
     * @return array<string>
     * @throws RuntimeException
     */
    public function listFiles(string $directory): array
    {
        $this->connect();

        $files = ftp_nlist($this->connection, $directory);

        if ($files === false) {
            return [];
        }

        return array_values(array_filter($files, fn ($f) => $f !== '.' && $f !== '..'));
    }

    /**
     * Find the first image file in a registration directory.
     *
     * @param  int  $registrationId
     * @return string|null  Returns the remote path, or null if not found.
     */
    public function findReceiptImage(int $registrationId): ?string
    {
        $directory = "/registrations/{$registrationId}";

        try {
            $files = $this->listFiles($directory);
        } catch (RuntimeException $e) {
            Log::warning("FTP: could not list {$directory}: " . $e->getMessage());
            return null;
        }

        $imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

        foreach ($files as $file) {
            $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
            if (in_array($ext, $imageExtensions, true)) {
                return $file;
            }
        }

        return null;
    }

    /**
     * Download a file from FTP into a temporary local path.
     *
     * @param  string  $remotePath
     * @return string  Local temp file path
     * @throws RuntimeException
     */
    public function downloadToTemp(string $remotePath): string
    {
        $this->connect();

        $localPath = tempnam(sys_get_temp_dir(), 'ftp_receipt_');
        if ($localPath === false) {
            throw new RuntimeException('Could not create temporary file');
        }

        $ext = pathinfo($remotePath, PATHINFO_EXTENSION);
        if ($ext) {
            $withExt = $localPath . '.' . $ext;
            if (!rename($localPath, $withExt)) {
                @unlink($localPath);
                throw new RuntimeException("Could not rename temp file to add extension: {$ext}");
            }
            $localPath = $withExt;
        }

        if (!ftp_get($this->connection, $localPath, $remotePath, FTP_BINARY)) {
            @unlink($localPath);
            throw new RuntimeException("FTP download failed for: {$remotePath}");
        }

        return $localPath;
    }

    /**
     * Get the raw contents of a remote file.
     *
     * @param  string  $remotePath
     * @return string  File contents
     * @throws RuntimeException
     */
    public function getFileContents(string $remotePath): string
    {
        $localPath = $this->downloadToTemp($remotePath);

        try {
            $contents = file_get_contents($localPath);
            if ($contents === false) {
                throw new RuntimeException("Failed to read temp file: {$localPath}");
            }
            return $contents;
        } finally {
            @unlink($localPath);
        }
    }

    /**
     * Read and parse the details.csv from a registration's FTP directory.
     *
     * @param  int  $registrationId
     * @return array<array<string, string>>  Array of rows as associative arrays.
     */
    public function readRegistrationCsv(int $registrationId): array
    {
        $remotePath = "/registrations/{$registrationId}/details.csv";

        try {
            $contents = $this->getFileContents($remotePath);
        } catch (RuntimeException $e) {
            Log::warning("FTP: could not read CSV at {$remotePath}: " . $e->getMessage());
            return [];
        }

        $lines  = array_filter(explode("\n", str_replace("\r\n", "\n", $contents)));
        $rows   = [];
        $header = null;

        foreach ($lines as $line) {
            $cols = str_getcsv($line);
            if ($header === null) {
                $header = $cols;
                continue;
            }
            if (count($cols) === count($header)) {
                $rows[] = array_combine($header, $cols);
            }
        }

        return $rows;
    }

    /**
     * List all category-level directories under /registrations/.
     *
     * @return array<string>
     */
    public function listCategories(): array
    {
        try {
            $entries = $this->listFiles('/registrations');
        } catch (RuntimeException $e) {
            return [];
        }

        return array_filter($entries, function ($entry) {
            // Keep only directory-like entries (no extension = directory)
            return !str_contains($entry, '.');
        });
    }

    /**
     * Zip an entire category directory into a temp ZIP file.
     * Uses PHP's ZipArchive to build the archive server-side.
     *
     * @param  string  $category
     * @return string  Path to the temp .zip file
     * @throws RuntimeException
     */
    public function exportCategoryZip(string $category): string
    {
        $this->connect();

        $remoteBase  = "/registrations/{$category}";
        $zipBasePath = tempnam(sys_get_temp_dir(), 'ftp_export_');
        if ($zipBasePath === false) {
            throw new RuntimeException('Could not create temporary file for ZIP archive');
        }
        $zipPath = $zipBasePath . '.zip';
        // Remove the bare tempnam placeholder; we'll use the .zip-suffixed path
        @unlink($zipBasePath);
        $zip = new \ZipArchive();

        if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            throw new RuntimeException('Could not create ZIP archive');
        }

        $tempFiles = $this->addDirectoryToZip($zip, $remoteBase, $category);
        // Close archive before cleaning up temp files (ZipArchive holds file handles until close)
        $zip->close();

        foreach ($tempFiles as $tmp) {
            @unlink($tmp);
        }

        return $zipPath;
    }

    /**
     * Recursively add a remote FTP directory into a ZipArchive.
     * Returns the list of temp files created so they can be cleaned up.
     *
     * @return array<string>  Temp file paths to clean up after $zip->close()
     */
    private function addDirectoryToZip(\ZipArchive $zip, string $remoteDir, string $zipPrefix): array
    {
        $files     = $this->listFiles($remoteDir);
        $tempFiles = [];

        foreach ($files as $remoteFile) {
            $basename  = basename($remoteFile);
            $zipEntry  = $zipPrefix . '/' . $basename;
            $localTemp = $this->downloadToTemp($remoteFile);
            $tempFiles[] = $localTemp;
            $zip->addFile($localTemp, $zipEntry);
        }

        return $tempFiles;
    }

    /**
     * List all files under /registrations/ recursively (one level deep for IDs).
     *
     * @return array<array{path: string, registrationId: int|null}>
     */
    public function listAllRegistrationFiles(): array
    {
        $this->connect();
        $allFiles = [];

        try {
            $baseEntries = $this->listFiles('/registrations');
            
            foreach ($baseEntries as $entry) {
                // If it's a numeric directory (registration ID)
                $id = basename($entry);
                if (is_numeric($id)) {
                    $subFiles = $this->listFiles($entry);
                    foreach ($subFiles as $subFile) {
                        $allFiles[] = [
                            'path' => $subFile,
                            'registrationId' => (int)$id
                        ];
                    }
                } else {
                    // It's a category or other folder
                    $categoryFiles = $this->listFiles($entry);
                    foreach ($categoryFiles as $catFile) {
                        $subId = basename(dirname($catFile));
                        $allFiles[] = [
                            'path' => $catFile,
                            'registrationId' => is_numeric($subId) ? (int)$subId : null
                        ];
                    }
                }
            }
        } catch (RuntimeException $e) {
            Log::error("FTP: listAllRegistrationFiles failed: " . $e->getMessage());
        }

        return $allFiles;
    }

    public function __destruct()
    {
        $this->disconnect();
    }
}
