<?php

namespace Database\Seeders;

use App\Models\Registration;
use Illuminate\Database\Seeder;

class RegistrationSeeder extends Seeder
{
    public function run(): void
    {
        $events = ['Hackathon', 'Robowar', 'Code Sprint', 'Treasure Hunt', 'Drone Race'];

        $samples = [
            [
                'teamName' => 'Binary Beasts',
                'name' => 'Arjun Sharma',
                'email' => 'arjun@example.com',
                'phone' => '9876543210',
                'college' => 'NITK Surathkal',
                'utr_number' => 'UTR123456789',
                'amount' => 500,
                'status' => 'pending',
                'needsAccommodation' => false,
                'participant1' => 'Arjun Sharma', 'email1' => 'arjun@example.com', 'phone1' => '9876543210',
                'participant2' => 'Vikram Singh', 'email2' => 'vikram@example.com', 'phone2' => '9876543211',
            ],
            [
                'teamName' => 'Metal Smashers',
                'name' => 'Priya Nair',
                'email' => 'priya@example.com',
                'phone' => '8765432109',
                'college' => 'MIT Manipal',
                'utr_number' => 'UTR987654321',
                'amount' => 1000,
                'status' => 'verified',
                'needsAccommodation' => true,
                'participant1' => 'Priya Nair', 'email1' => 'priya@example.com', 'phone1' => '8765432109',
                'participant2' => 'Anish Hegde', 'email2' => 'anish@example.com', 'phone2' => '8765432110',
                'participant3' => 'Rohan Das', 'email3' => 'rohan@example.com', 'phone3' => '8765432111',
            ],
            [
                'teamName' => 'Code Crusaders',
                'name' => 'Rahul Mehta',
                'email' => 'rahul@example.com',
                'phone' => '7654321098',
                'college' => 'BITS Pilani',
                'utr_number' => 'UTR456789012',
                'amount' => 300,
                'status' => 'pending',
                'needsAccommodation' => false,
                'participant1' => 'Rahul Mehta', 'email1' => 'rahul@example.com', 'phone1' => '7654321098',
            ],
            [
                'teamName' => 'Sky High',
                'name' => 'Sneha Kamath',
                'email' => 'sneha@example.com',
                'phone' => '6543210987',
                'college' => 'PESIT Bangalore',
                'utr_number' => 'UTR321098765',
                'amount' => 750,
                'status' => 'rejected',
                'needsAccommodation' => false,
                'participant1' => 'Sneha Kamath', 'email1' => 'sneha@example.com', 'phone1' => '6543210987',
                'participant2' => 'Kavya Rao', 'email2' => 'kavya@example.com', 'phone2' => '6543210988',
            ],
            [
                'teamName' => 'Robo Rangers',
                'name' => 'Vijay Kumar',
                'email' => 'vijay@example.com',
                'phone' => '9988776655',
                'college' => 'VTU Belgaum',
                'utr_number' => 'UTR112233445',
                'amount' => 1000,
                'status' => 'pending',
                'needsAccommodation' => true,
                'participant1' => 'Vijay Kumar', 'email1' => 'vijay@example.com', 'phone1' => '9988776655',
                'participant2' => 'Suresh Raina', 'email2' => 'suresh@example.com', 'phone2' => '9988776656',
                'participant3' => 'Manoj Bajpai', 'email3' => 'manoj@example.com', 'phone3' => '9988776657',
                'participant4' => 'Pankaj Tripathi', 'email4' => 'pankaj@example.com', 'phone4' => '9988776658',
            ],
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
