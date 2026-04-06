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
                'phone' => '9876543210', 'institution' => 'NITK Surathkal', 'transactionId' => 'UTR123456789',
                'status' => 'pending', 'isAccepted' => 0, 'needsAccommodation' => false,
                'participant2' => 'Vikram Singh', 'email2' => 'vikram@example.com', 'phone2' => '9876543211',
            ],
            [
                'teamName' => 'Metal Smashers', 'name' => 'Priya Nair', 'email' => 'priya@example.com',
                'phone' => '8765432109', 'institution' => 'MIT Manipal', 'transactionId' => 'UTR987654321',
                'status' => 'verified', 'isAccepted' => 1, 'needsAccommodation' => true,
                'participant2' => 'Anish Hegde', 'email2' => 'anish@example.com', 'phone2' => '8765432110',
                'participant3' => 'Rohan Das', 'email3' => 'rohan@example.com', 'phone3' => '8765432111',
            ],
            [
                'teamName' => 'Code Crusaders', 'name' => 'Rahul Mehta', 'email' => 'rahul@example.com',
                'phone' => '7654321098', 'institution' => 'BITS Pilani', 'transactionId' => 'UTR456789012',
                'status' => 'pending', 'isAccepted' => 0, 'needsAccommodation' => false,
            ],
            [
                'teamName' => 'Sky High', 'name' => 'Sneha Kamath', 'email' => 'sneha@example.com',
                'phone' => '6543210987', 'institution' => 'PESIT Bangalore', 'transactionId' => 'UTR321098765',
                'status' => 'rejected', 'isAccepted' => 0, 'needsAccommodation' => false,
                'adminNotes' => 'Screenshot is blurry, UTR could not be verified.',
            ],
            [
                'teamName' => 'Robo Rangers', 'name' => 'Vijay Kumar', 'email' => 'vijay@example.com',
                'phone' => '9988776655', 'institution' => 'VTU Belgaum', 'transactionId' => 'UTR112233445',
                'status' => 'pending', 'isAccepted' => 0, 'needsAccommodation' => true,
                'participant2' => 'Suresh Raina', 'email2' => 'suresh@example.com', 'phone2' => '9988776656',
            ],
            [
                'teamName' => 'Matrix Runners', 'name' => 'Kiran Hegde', 'email' => 'kiran@example.com',
                'phone' => '9900112233', 'institution' => 'RVCE Bangalore', 'transactionId' => 'UTR101020304',
                'status' => 'verified', 'isAccepted' => 1, 'needsAccommodation' => false,
            ],
        ];

        foreach ($samples as $i => $sample) {
            $eventIndex = $i % count($eventsList);
            Registration::create(array_merge($sample, [
                'eventName' => $eventsList[$eventIndex],
                'eventSlug' => strtolower(str_replace(' ', '-', $eventsList[$eventIndex])),
            ]));
        }
    }
}
