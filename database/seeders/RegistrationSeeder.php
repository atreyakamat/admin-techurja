<?php

namespace Database\Seeders;

use App\Models\Registration;
use Illuminate\Database\Seeder;

class RegistrationSeeder extends Seeder
{
    public function run(): void
    {
        $eventsList = [
            'ROBOWAR (15KG)', 'ROBOWAR (8KGS)', 'ROBOWAR (3LBS)', 'ROBO NEXUS (Sumo)',
            'CYBER STRIKE (Soccer)', 'SANTO DOMINGO RACE', 'KABUKI ROUNDABOUT (Maze)',
            'GRID RUNNER (LFR)', 'CYBER TUG (Tug of War)', 'ESCAPE THE MATRIX (Coding)',
            'INNOVIBE (Project Expo)', 'NEON SPAN (Bridge)', 'GHOSTGRID (CTF)',
            'CIRCUIT BREACH', 'WAR ROOM PROTOCOL', 'PIXEL PLAY (FIFA)',
            'CLASHPUNK (Royale)', 'CYBER SMASHERS (Cricket)', 'TECHYOTHON (Hackathon)',
            'THE CYPHER HEIST', 'STRUCTOMAT (HSS)', 'SYMMETRY ART (HSS)'
        ];

        $samples = [
            [
                'teamName' => 'Binary Beasts', 'name' => 'Arjun Sharma', 'email' => 'arjun@example.com',
                'phone' => '9876543210', 'college' => 'NITK Surathkal', 'transactionId' => 'UTR123456789',
                'amount' => 500, 'status' => 'pending', 'needsAccommodation' => false,
                'participant1' => 'Arjun Sharma', 'email1' => 'arjun@example.com', 'phone1' => '9876543210',
                'participant2' => 'Vikram Singh', 'email2' => 'vikram@example.com', 'phone2' => '9876543211',
            ],
            [
                'teamName' => 'Metal Smashers', 'name' => 'Priya Nair', 'email' => 'priya@example.com',
                'phone' => '8765432109', 'college' => 'MIT Manipal', 'transactionId' => 'UTR987654321',
                'amount' => 1000, 'status' => 'verified', 'needsAccommodation' => true,
                'participant1' => 'Priya Nair', 'email1' => 'priya@example.com', 'phone1' => '8765432109',
                'participant2' => 'Anish Hegde', 'email2' => 'anish@example.com', 'phone2' => '8765432110',
                'participant3' => 'Rohan Das', 'email3' => 'rohan@example.com', 'phone3' => '8765432111',
            ],
            [
                'teamName' => 'Code Crusaders', 'name' => 'Rahul Mehta', 'email' => 'rahul@example.com',
                'phone' => '7654321098', 'college' => 'BITS Pilani', 'transactionId' => 'UTR456789012',
                'amount' => 300, 'status' => 'pending', 'needsAccommodation' => false,
                'participant1' => 'Rahul Mehta', 'email1' => 'rahul@example.com', 'phone1' => '7654321098',
            ],
            [
                'teamName' => 'Sky High', 'name' => 'Sneha Kamath', 'email' => 'sneha@example.com',
                'phone' => '6543210987', 'college' => 'PESIT Bangalore', 'transactionId' => 'UTR321098765',
                'amount' => 750, 'status' => 'rejected', 'needsAccommodation' => false,
                'participant1' => 'Sneha Kamath', 'email1' => 'sneha@example.com', 'phone1' => '6543210987',
            ],
            [
                'teamName' => 'Robo Rangers', 'name' => 'Vijay Kumar', 'email' => 'vijay@example.com',
                'phone' => '9988776655', 'college' => 'VTU Belgaum', 'transactionId' => 'UTR112233445',
                'amount' => 1000, 'status' => 'pending', 'needsAccommodation' => true,
                'participant1' => 'Vijay Kumar', 'email1' => 'vijay@example.com', 'phone1' => '9988776655',
                'participant2' => 'Suresh Raina', 'email2' => 'suresh@example.com', 'phone2' => '9988776656',
            ],
            [
                'teamName' => 'Matrix Runners', 'name' => 'Kiran Hegde', 'email' => 'kiran@example.com',
                'phone' => '9900112233', 'college' => 'RVCE Bangalore', 'transactionId' => 'UTR101020304',
                'amount' => 500, 'status' => 'verified', 'needsAccommodation' => false,
                'participant1' => 'Kiran Hegde', 'email1' => 'kiran@example.com', 'phone1' => '9900112233',
            ],
        ];

        foreach ($samples as $i => $sample) {
            // Assign a random event from the user's provided list
            $eventIndex = $i % count($eventsList);
            Registration::create(array_merge($sample, [
                'event'    => $eventsList[$eventIndex],
                'category' => (stripos($eventsList[$eventIndex], 'Robo') !== false || stripos($eventsList[$eventIndex], 'Cyber') !== false) ? 'technical' : 'general',
                'admin_notes' => $sample['status'] === 'rejected'
                    ? 'Screenshot is blurry, UTR could not be verified.'
                    : null,
            ]));
        }
    }
}
