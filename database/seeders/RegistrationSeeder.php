<?php

namespace Database\Seeders;

use App\Models\Registration;
use Illuminate\Database\Seeder;

class RegistrationSeeder extends Seeder
{
    public function run(): void
    {
        $events = ['Hackathon', 'Robo Race', 'Code Sprint', 'Treasure Hunt', 'Coding Contest'];

        $samples = [
            ['name' => 'Arjun Sharma',    'email' => 'arjun@example.com',   'phone' => '9876543210', 'college' => 'NITK Surathkal',       'utr_number' => 'UTR123456789', 'amount' => 500,  'status' => 'pending'],
            ['name' => 'Priya Nair',      'email' => 'priya@example.com',    'phone' => '8765432109', 'college' => 'MIT Manipal',           'utr_number' => 'UTR987654321', 'amount' => 300,  'status' => 'verified'],
            ['name' => 'Rahul Mehta',     'email' => 'rahul@example.com',    'phone' => '7654321098', 'college' => 'BITS Pilani',           'utr_number' => 'UTR456789012', 'amount' => 1000, 'status' => 'pending'],
            ['name' => 'Sneha Kamath',    'email' => 'sneha@example.com',    'phone' => '6543210987', 'college' => 'PESIT Bangalore',       'utr_number' => 'UTR321098765', 'amount' => 500,  'status' => 'rejected'],
            ['name' => 'Vijay Kumar',     'email' => 'vijay@example.com',    'phone' => '9988776655', 'college' => 'VTU Belgaum',           'utr_number' => 'UTR112233445', 'amount' => 300,  'status' => 'pending'],
            ['name' => 'Deepa Rao',       'email' => 'deepa@example.com',    'phone' => '8877665544', 'college' => 'SDM College Dharwad',   'utr_number' => 'UTR665544332', 'amount' => 500,  'status' => 'verified'],
            ['name' => 'Arun Patil',      'email' => 'arun@example.com',     'phone' => '7766554433', 'college' => 'KLE Tech Hubli',        'utr_number' => 'UTR998877665', 'amount' => 1000, 'status' => 'pending'],
            ['name' => 'Meera Shetty',    'email' => 'meera@example.com',    'phone' => '6655443322', 'college' => 'Manipal Institute',     'utr_number' => null,           'amount' => 300,  'status' => 'pending'],
            ['name' => 'Kiran Hegde',     'email' => 'kiran@example.com',    'phone' => '9900112233', 'college' => 'RVCE Bangalore',        'utr_number' => 'UTR101020304', 'amount' => 500,  'status' => 'verified'],
            ['name' => 'Pooja Desai',     'email' => 'pooja@example.com',    'phone' => '8811223344', 'college' => 'Dayananda Sagar',       'utr_number' => 'UTR505060708', 'amount' => 500,  'status' => 'rejected'],
        ];

        foreach ($samples as $i => $sample) {
            Registration::create(array_merge($sample, [
                'event'    => $events[$i % count($events)],
                'category' => $i % 2 === 0 ? 'technical' : 'non-technical',
                'admin_notes' => $sample['status'] === 'rejected'
                    ? 'Screenshot is blurry, UTR could not be verified.'
                    : null,
            ]));
        }
    }
}
