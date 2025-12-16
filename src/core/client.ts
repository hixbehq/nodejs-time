import dgram from 'dgram';
import { NTPParser, ParsedNTPPacket } from './parser.js';

export interface NTPClientConfig {
  host?: string;
  port?: number;
  timeout?: number;
  fallbackServers?: string[];
}

export interface NTPQueryResult {
  buffer: Buffer;
  hexDump: string;
  parsed: ParsedNTPPacket;
  serverAddress: string;
  clientReceiveTime: Date;
  clientOriginateTime: Date;
  usedServer?: string;
}

/**
 * NTP Client - Sends NTP requests and retrieves responses
 */
export class NTPClient {
  private host: string;
  private port: number;
  private timeout: number;
  private fallbackServers: string[];

  constructor(config: NTPClientConfig = {}) {
    this.host = config.host || 'time.hixbe.com';
    this.port = config.port || 123;
    this.timeout = config.timeout || 5000;
    // Default fallback servers if none provided
    this.fallbackServers = config.fallbackServers || ['time.google.com', 'pool.ntp.org'];
  }

  /**
   * Send NTP request and receive response with automatic fallback
   */
  async query(): Promise<NTPQueryResult> {
    const servers = [this.host, ...this.fallbackServers];
    let lastError: Error | null = null;

    for (const server of servers) {
      try {
        return await this.queryServer(server);
      } catch (error) {
        lastError = error as Error;
        // Continue to next server
      }
    }

    // All servers failed
    throw new Error(
      `NTP query failed for all servers (${servers.join(', ')}): ${lastError?.message}`
    );
  }

  /**
   * Query a specific NTP server
   */
  private async queryServer(host: string): Promise<NTPQueryResult> {
    return new Promise((resolve, reject) => {
      const client = dgram.createSocket('udp4');
      const timeoutId = setTimeout(() => {
        client.close();
        reject(new Error(`NTP request timeout after ${this.timeout}ms to ${host}`));
      }, this.timeout);

      client.on('message', (buffer, rinfo) => {
        clearTimeout(timeoutId);
        client.close();

        try {
          const clientReceiveTime = new Date();
          const parsed = NTPParser.parsePacket(buffer);

          resolve({
            buffer,
            hexDump: this.hexDump(buffer),
            parsed,
            serverAddress: rinfo.address,
            clientReceiveTime,
            clientOriginateTime: new Date(Date.now() - this.timeout / 2),
            usedServer: host,
          });
        } catch (error) {
          reject(error);
        }
      });

      client.on('error', (error) => {
        clearTimeout(timeoutId);
        client.close();
        reject(error);
      });

      // Create NTP request packet
      const ntpPacket = this.createRequestPacket();

      try {
        client.send(ntpPacket, 0, ntpPacket.length, this.port, host, (error) => {
          if (error) {
            clearTimeout(timeoutId);
            client.close();
            reject(error);
          }
        });
      } catch (error) {
        clearTimeout(timeoutId);
        client.close();
        reject(error);
      }
    });
  }

  /**
   * Get current NTP time from server
   */
  async getTime(): Promise<Date> {
    const result = await this.query();
    return result.parsed.timestamps.transmit.date;
  }

  /**
   * Get time offset between local and NTP server
   */
  async getOffset(): Promise<number> {
    const result = await this.query();
    const serverTime = result.parsed.timestamps.transmit.date.getTime();
    const localTime = result.clientReceiveTime.getTime();
    return serverTime - localTime;
  }

  /**
   * Create NTP request packet (client mode)
   */
  private createRequestPacket(): Buffer {
    const packet = Buffer.alloc(48, 0);

    // First byte: LI (0), VN (3), Mode (3 = client)
    packet[0] = 0x23;

    // Add transmit timestamp (current time)
    const now = new Date();
    const unixSeconds = Math.floor(now.getTime() / 1000);
    const ntpSeconds = unixSeconds + 2208988800;
    const fraction = Math.random() * 0x100000000;

    packet.writeUInt32BE(ntpSeconds, 40);
    packet.writeUInt32BE(Math.floor(fraction), 44);

    return packet;
  }

  /**
   * Generate hex dump of buffer
   */
  private hexDump(buffer: Buffer): string {
    let dump = '';
    for (let i = 0; i < buffer.length; i += 16) {
      const hex = buffer
        .slice(i, i + 16)
        .toString('hex')
        .match(/.{1,2}/g)
        ?.join(' ');
      const ascii = buffer
        .slice(i, i + 16)
        .toString('ascii')
        .replace(/[^\x20-\x7E]/g, '.');
      dump += `${String(i).padStart(4, '0')}: ${hex?.padEnd(48)} ${ascii}\n`;
    }
    return dump;
  }
}
