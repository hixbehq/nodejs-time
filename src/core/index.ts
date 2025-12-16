import { NTPClient } from './client.js';
import { NTPParser } from './parser.js';

export { NTPClient, NTPParser };
export type { NTPClientConfig, NTPQueryResult } from './client.js';
export type {
  RawNTPTimestamp,
  ParsedNTPTimestamp,
  NTPPacketHeader,
  NTPTimestamps,
  ParsedNTPPacket,
} from './parser.js';

// Default export with convenience functions
export default {
  async getTime(host = 'time.hixbe.com'): Promise<Date> {
    const client = new NTPClient({ host });
    return client.getTime();
  },

  async getOffset(host = 'time.hixbe.com'): Promise<number> {
    const client = new NTPClient({ host });
    return client.getOffset();
  },

  async query(host = 'time.hixbe.com') {
    const client = new NTPClient({ host });
    return client.query();
  },

  NTPClient,
  NTPParser,
};
