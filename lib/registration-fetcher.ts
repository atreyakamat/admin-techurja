import * as ftp from 'basic-ftp';
import { parseCsvContent, getVal, normalizeEventName, parseRegistrationDate } from './csv-utils';

export const EMPTY_STATS = { total: 0, pending: 0, verified: 0, rejected: 0 };

export async function downloadTextFile(client: ftp.Client, path: string): Promise<string> {
  const chunks: Buffer[] = [];
  const { Writable } = await import('stream');
  const writable = new Writable({
    write(chunk, encoding, callback) {
      chunks.push(chunk);
      callback();
    }
  });
  await client.downloadTo(writable, path);
  return Buffer.concat(chunks).toString('utf-8');
}

export async function fetchRegistrationsFromMasterCache(client: ftp.Client): Promise<any[] | null> {
  try {
    const masterPath = '/registrations_master.json';
    const data = JSON.parse(await downloadTextFile(client, masterPath));
    return Array.isArray(data.registrations) ? data.registrations : null;
  } catch (e) {
    return null;
  }
}

export async function fetchRegistrationsFromFolders(client: ftp.Client): Promise<any[]> {
  const registrationsPath = '/registrations/';
  let folders: ftp.FileInfo[] = [];
  
  try {
    folders = await client.list(registrationsPath);
  } catch (e) {
    return [];
  }

  const targetFolders = folders.filter(f => f.isDirectory);
  const registrations: any[] = [];

  for (const folder of targetFolders) {
    const folderName = folder.name;
    const csvPath = `${registrationsPath}${folderName}/details.csv`;

    try {
      const csvContent = await downloadTextFile(client, csvPath);
      const record = parseCsvContent(csvContent);
      
      if (Object.keys(record).length === 0) continue;

      const reg: any = { _raw: { ...record } };
      reg.id = folderName;
      reg.name = getVal(record, ['name']) || '—';
      reg.email = getVal(record, ['email']) || '—';
      reg.phone = getVal(record, ['phone']) || '—';
      
      const rawEventName = getVal(record, ['event_name', 'eventName', 'Event Name', 'Event']) || '—';
      reg.eventName = normalizeEventName(rawEventName);
      
      reg.teamName = getVal(record, ['team_name', 'teamName', 'Team Name', 'Team']) || '—';
      reg.transactionId = getVal(record, ['transaction_id', 'transactionId', 'UTR', 'Transaction ID']) || '—';
      reg.institution = getVal(record, ['institution', 'college', 'College', 'Institution Name']) || '—';
      
      // Store individual participants
      reg.participant2 = getVal(record, ['participant2', 'Participant 2 Name']) || '—';
      reg.participant3 = getVal(record, ['participant3', 'Participant 3 Name']) || '—';
      reg.participant4 = getVal(record, ['participant4', 'Participant 4 Name']) || '—';

      let count = 1;
      for (let i = 2; i <= 4; i++) {
        const pName = getVal(record, [`participant${i}`, `Participant ${i} Name`]);
        if (pName) count++;
      }
      reg.participantCount = count;

      const status = getVal(record, ['status', 'Status']) || 'pending';
      reg.status = status.toLowerCase();
      reg.isAccepted = parseInt(getVal(record, ['isAccepted', 'accepted']) || (reg.status === 'verified' ? '1' : '0'));
      
      const accom = String(getVal(record, ['needs_accommodation', 'needsAccommodation', 'Accommodation']) || '').toUpperCase();
      reg.needsAccommodation = ['YES', 'TRUE', '1', 'NEEDED'].includes(accom);
      
      const rawDate = getVal(record, ['timestamp', 'createdAt', 'Date', 'date']);
      reg.createdAt = rawDate ? parseRegistrationDate(rawDate).toISOString() : new Date().toISOString();

      registrations.push(reg);
    } catch (e) {
      // Skip
    }
  }

  return registrations;
}

export async function getRegistrations(client: ftp.Client): Promise<any[]> {
  let registrations = await fetchRegistrationsFromMasterCache(client);
  
  if (!registrations || registrations.length === 0) {
    registrations = await fetchRegistrationsFromFolders(client);
  }
  
  return registrations;
}
