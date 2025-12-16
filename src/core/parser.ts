/**
 * NTP Timestamp Parser
 * Handles conversion between NTP timestamps and JavaScript Date objects
 */

export interface RawNTPTimestamp {
  seconds: number;
  fraction: number;
}

export interface ParsedNTPTimestamp {
  raw: RawNTPTimestamp;
  unix: {
    seconds: number;
    milliseconds: number;
  };
  date: Date;
  iso: string;
  local: string;
  timestamp: number;
}

export interface NTPPacketHeader {
  leapIndicator: number;
  versionNumber: number;
  mode: number;
  stratum: number;
  pollInterval: number;
  precision: number;
  rootDelay: number;
  rootDispersion: number;
  referenceId: string;
}

export interface NTPTimestamps {
  reference: ParsedNTPTimestamp;
  originate: ParsedNTPTimestamp;
  receive: ParsedNTPTimestamp;
  transmit: ParsedNTPTimestamp;
}

export interface ParsedNTPPacket {
  header: NTPPacketHeader;
  timestamps: NTPTimestamps;
  roundTripDelay: number | null;
  clockOffset: number | null;
}

export class NTPParser {
  /**
   * NTP epoch starts on January 1, 1900
   * Unix epoch starts on January 1, 1970
   * The difference is 2,208,988,800 seconds
   */
  private static readonly NTP_EPOCH_OFFSET = 2208988800;

  /**
   * Parse raw NTP response buffer (48 bytes)
   *
   * Packet structure:
   * - Bytes 0-3: LI, VN, Mode, Stratum, Poll, Precision
   * - Bytes 4-7: Root Delay
   * - Bytes 8-11: Root Dispersion
   * - Bytes 12-15: Reference ID
   * - Bytes 16-23: Reference Timestamp
   * - Bytes 24-31: Originate Timestamp
   * - Bytes 32-39: Receive Timestamp
   * - Bytes 40-47: Transmit Timestamp
   */
  static parsePacket(buffer: Buffer): ParsedNTPPacket {
    if (buffer.length < 48) {
      throw new Error('Invalid NTP packet: minimum 48 bytes required');
    }

    // Parse header
    const firstByte = buffer[0];
    const leapIndicator = (firstByte >> 6) & 0b11;
    const versionNumber = (firstByte >> 3) & 0b111;
    const mode = firstByte & 0b111;
    const stratum = buffer[1];
    const pollInterval = buffer[2];
    const precision = buffer[3];

    // Parse timestamps
    const referenceTimestamp = this.parseNTPTimestamp(buffer, 16);
    const originateTimestamp = this.parseNTPTimestamp(buffer, 24);
    const receiveTimestamp = this.parseNTPTimestamp(buffer, 32);
    const transmitTimestamp = this.parseNTPTimestamp(buffer, 40);

    // Parse root delay and dispersion
    const rootDelay = buffer.readUInt32BE(4);
    const rootDispersion = buffer.readUInt32BE(8);
    const referenceId = buffer.readUInt32BE(12);

    return {
      header: {
        leapIndicator,
        versionNumber,
        mode,
        stratum,
        pollInterval,
        precision,
        rootDelay,
        rootDispersion,
        referenceId: this.formatReferenceId(referenceId, stratum),
      },
      timestamps: {
        reference: referenceTimestamp,
        originate: originateTimestamp,
        receive: receiveTimestamp,
        transmit: transmitTimestamp,
      },
      roundTripDelay: null,
      clockOffset: null,
    };
  }

  /**
   * Parse 8-byte NTP timestamp (64-bit fixed-point: 32-bit seconds, 32-bit fraction)
   */
  private static parseNTPTimestamp(buffer: Buffer, offset: number): ParsedNTPTimestamp {
    const seconds = buffer.readUInt32BE(offset);
    const fraction = buffer.readUInt32BE(offset + 4);

    // Convert fraction to milliseconds (32-bit fraction / 2^32 * 1000)
    const milliseconds = (fraction / 0x100000000) * 1000;

    // Convert NTP timestamp to Unix timestamp
    const unixSeconds = seconds - this.NTP_EPOCH_OFFSET;
    const date = new Date((unixSeconds * 1000) + milliseconds);

    return {
      raw: { seconds, fraction },
      unix: {
        seconds: unixSeconds,
        milliseconds,
      },
      date,
      iso: date.toISOString(),
      local: date.toString(),
      timestamp: date.getTime(),
    };
  }

  /**
   * Format reference ID based on stratum
   */
  private static formatReferenceId(id: number, stratum: number): string {
    if (stratum === 0) return 'KISS';
    if (stratum === 1) {
      // First 4 bytes are ASCII
      const bytes = Buffer.alloc(4);
      bytes.writeUInt32BE(id);
      return bytes.toString('ascii').replace(/\x00/g, '');
    }
    return `0x${id.toString(16).toUpperCase().padStart(8, '0')}`;
  }

  /**
   * Calculate round-trip delay and clock offset
   */
  static calculateMetrics(
    parsed: ParsedNTPPacket,
    clientOriginateTime: Date,
    clientReceiveTime: Date
  ): { roundTripDelay: number; clockOffset: number; roundTripDelayMs: number; clockOffsetMs: number } {
    const t1 = clientOriginateTime.getTime() / 1000;
    const t2 = parsed.timestamps.receive.unix.seconds + parsed.timestamps.receive.unix.milliseconds / 1000;
    const t3 = parsed.timestamps.transmit.unix.seconds + parsed.timestamps.transmit.unix.milliseconds / 1000;
    const t4 = clientReceiveTime.getTime() / 1000;

    const roundTripDelay = (t4 - t1) - (t3 - t2);
    const clockOffset = ((t2 - t1) + (t3 - t4)) / 2;

    return {
      roundTripDelay,
      clockOffset,
      roundTripDelayMs: roundTripDelay * 1000,
      clockOffsetMs: clockOffset * 1000,
    };
  }
}
