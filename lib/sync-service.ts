import * as ftp from 'basic-ftp';
import { parse } from 'csv-parse/sync';
import { query, queryOne } from './db';

async function getFtpClient() {
  const client = new ftp.Client();
  await client.access({
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASS,
    port: parseInt(process.env.FTP_PORT || '21'),
    secure: false,
  });
  return client;
}

function parseRegistrationData(csvContent: string): Record<string, any> {
  try {
    const records = parse(csvContent, {
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
    });

    const result: Record<string, any> = {};

    if (records.length >= 2) {
      const headers = records[0];
      const data = records[1];

      headers.forEach((h: string, i: number) => {
        result[h] = data[i] || '';
      });
    }

    return result;
  } catch (error) {
    console.error('[PARSE_ERROR]', error);
    return {};
  }
}

export async function syncRegistrationToDb(registrationId: string, registrationData: Record<string, any>) {
  try {
    const eventName = registrationData['Event Name'] || registrationData['eventName'] || '';
    const eventSlug = eventName.toLowerCase().replace(/\s+/g, '-');

    const insertSql = `
      INSERT INTO registrations (
        id, teamName, leaderName, leaderEmail, leaderPhone,
        participant2, participant3, participant4, institution,
        eventName, eventSlug, transactionId, status, needsAccommodation,
        isAccepted, rawData
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        teamName = VALUES(teamName),
        leaderName = VALUES(leaderName),
        leaderEmail = VALUES(leaderEmail),
        leaderPhone = VALUES(leaderPhone),
        participant2 = VALUES(participant2),
        participant3 = VALUES(participant3),
        participant4 = VALUES(participant4),
        institution = VALUES(institution),
        eventName = VALUES(eventName),
        transactionId = VALUES(transactionId),
        status = VALUES(status),
        needsAccommodation = VALUES(needsAccommodation),
        isAccepted = VALUES(isAccepted),
        rawData = VALUES(rawData),
        updatedAt = CURRENT_TIMESTAMP
    `;

    const values = [
      registrationId,
      registrationData['Team Name'] || registrationData['teamName'] || '',
      registrationData['Leader Name'] || registrationData['leaderName'] || registrationData['Name'] || '',
      registrationData['Email'] || registrationData['leaderEmail'] || '',
      registrationData['Phone'] || registrationData['leaderPhone'] || '',
      registrationData['Participant 2'] || registrationData['participant2'] || '',
      registrationData['Participant 3'] || registrationData['participant3'] || '',
      registrationData['Participant 4'] || registrationData['participant4'] || '',
      registrationData['Institution'] || registrationData['institution'] || '',
      eventName,
      eventSlug,
      registrationData['UTR'] || registrationData['transactionId'] || registrationData['Transaction ID'] || '',
      registrationData['Status'] || registrationData['status'] || 'pending',
      registrationData['Needs Accommodation'] === 'Yes' ? 1 : 0,
      registrationData['Accepted'] === 'Yes' || registrationData['isAccepted'] === 'true' ? 1 : 0,
      JSON.stringify(registrationData),
    ];

    await query(insertSql, values);

    await query(
      'INSERT INTO sync_logs (registrationId, status, message) VALUES (?, ?, ?)',
      [registrationId, 'success', `Synced at ${new Date().toISOString()}`]
    );

    console.log(`[SYNC_SUCCESS] ${registrationId}`);
    return true;
  } catch (error) {
    console.error(`[SYNC_ERROR] ${registrationId}:`, error);
    return false;
  }
}

export async function syncAllRegistrationsFromFtp() {
  let client: ftp.Client | null = null;
  let syncedCount = 0;
  let errorCount = 0;

  try {
    client = await getFtpClient();
    console.log('[FTP_CONNECT] Connected to FTP server');

    const registrationFolders = await client.list(process.env.FTP_ROOT || '/registrations');
    console.log(`[FTP_LIST] Found ${registrationFolders.length} registration folders`);

    for (const folder of registrationFolders) {
      if (!folder.isDirectory) continue;

      const registrationId = folder.name;
      console.log(`[SYNC_START] Processing ${registrationId}`);

      try {
        // Download details.csv
        const csvPath = `${process.env.FTP_ROOT}/${registrationId}/details.csv`;
        const chunks: any[] = [];
        const { Writable } = await import('stream');
        const writable = new Writable({
          write(chunk, encoding, callback) {
            chunks.push(chunk);
            callback();
          }
        });
        
        await client.downloadTo(writable, csvPath);
        const csvContent = Buffer.concat(chunks).toString('utf-8');

        // Parse and sync
        const registrationData = parseRegistrationData(csvContent);
        const success = await syncRegistrationToDb(registrationId, registrationData);

        if (success) {
          syncedCount++;
        } else {
          errorCount++;
        }
      } catch (folderError) {
        console.error(`[SYNC_FOLDER_ERROR] ${registrationId}:`, folderError);
        errorCount++;
      }
    }

    console.log(`[SYNC_COMPLETE] Synced: ${syncedCount}, Errors: ${errorCount}`);
    return { syncedCount, errorCount };
  } catch (error) {
    console.error('[FTP_ERROR]', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log('[FTP_DISCONNECT] Disconnected from FTP server');
    }
  }
}

export async function getRegistrationsFromDb(filters?: Record<string, any>) {
  try {
    let sql = 'SELECT * FROM registrations';
    const values: any[] = [];

    if (filters) {
      const conditions: string[] = [];

      if (filters.eventName) {
        conditions.push('eventName = ?');
        values.push(filters.eventName);
      }

      if (filters.status) {
        conditions.push('status = ?');
        values.push(filters.status);
      }

      if (filters.search) {
        conditions.push('(teamName LIKE ? OR leaderName LIKE ? OR id LIKE ?)');
        const searchTerm = `%${filters.search}%`;
        values.push(searchTerm, searchTerm, searchTerm);
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
    }

    sql += ' ORDER BY updatedAt DESC LIMIT 1000';

    const results = await query(sql, values);
    return results;
  } catch (error) {
    console.error('[DB_QUERY_ERROR]', error);
    return [];
  }
}
