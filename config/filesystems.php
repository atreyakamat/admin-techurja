<?php

return [

    'default' => env('FILESYSTEM_DISK', 'local'),

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root'   => storage_path('app'),
            'throw'  => false,
        ],

        'public' => [
            'driver'     => 'local',
            'root'       => storage_path('app/public'),
            'url'        => env('APP_URL').'/storage',
            'visibility' => 'public',
            'throw'      => false,
        ],

        'ftp' => [
            'driver'   => 'ftp',
            'host'     => env('FTP_HOST', 'ftp.example.com'),
            'username' => env('FTP_USERNAME'),
            'password' => env('FTP_PASSWORD'),
            'port'     => env('FTP_PORT', 21),
            'root'     => env('FTP_ROOT', '/'),
            'passive'  => env('FTP_PASSIVE', true),
            'ssl'      => env('FTP_SSL', false),
            'timeout'  => env('FTP_TIMEOUT', 30),
        ],

    ],

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
