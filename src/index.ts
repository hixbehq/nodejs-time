export { default, NTPClient, NTPParser } from './core/index.js';
export type { NTPClientConfig, NTPQueryResult } from './core/client.js';
export type {
  RawNTPTimestamp,
  ParsedNTPTimestamp,
  NTPPacketHeader,
  NTPTimestamps,
  ParsedNTPPacket,
} from './core/parser.js';
