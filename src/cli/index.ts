#!/usr/bin/env node

import { NTPClient } from '../core/client.js';

interface CLIOptions {
  server: string;
  json: boolean;
  verbose: boolean;
  offset: boolean;
  continuous: boolean;
  interval: number;
}

class HixbeTimeCLI {
  private options: CLIOptions = {
    server: 'time.hixbe.com',
    json: false,
    verbose: false,
    offset: false,
    continuous: false,
    interval: 5000,
  };

  async run(): Promise<void> {
    this.parseArgs();

    if (this.options.continuous) {
      await this.continuousMode();
    } else {
      await this.singleQuery();
    }
  }

  private parseArgs(): void {
    const args = process.argv.slice(2);

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch (arg) {
        case '-s':
        case '--server':
          this.options.server = args[++i];
          break;
        case '-j':
        case '--json':
          this.options.json = true;
          break;
        case '-v':
        case '--verbose':
          this.options.verbose = true;
          break;
        case '-o':
        case '--offset':
          this.options.offset = true;
          break;
        case '-c':
        case '--continuous':
          this.options.continuous = true;
          break;
        case '-i':
        case '--interval':
          this.options.interval = parseInt(args[++i], 10);
          break;
        case '-h':
        case '--help':
          this.printHelp();
          process.exit(0);
          break;
        case '--version':
          this.printVersion();
          process.exit(0);
          break;
      }
    }
  }

  private async singleQuery(): Promise<void> {
    try {
      const client = new NTPClient({ host: this.options.server });
      const result = await client.query();

      if (this.options.json) {
        this.outputJSON(result);
      } else if (this.options.offset) {
        this.outputOffset(result);
      } else if (this.options.verbose) {
        this.outputVerbose(result);
      } else {
        this.outputDefault(result);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  private async continuousMode(): Promise<void> {
    let count = 0;

    console.log(`⏱️  Starting continuous sync (will fallback to time.google.com if needed)`);
    console.log(`📊 Interval: ${this.options.interval}ms (${(this.options.interval / 1000).toFixed(1)}s)`);
    console.log('Press Ctrl+C to stop\n');

    const displayBars = () => {
      process.stdout.write('');
    };

    while (true) {
      try {
        const client = new NTPClient({ host: this.options.server });
        const result = await client.query();
        const offset = result.parsed.timestamps.transmit.date.getTime() - result.clientReceiveTime.getTime();

        count++;
        const time = result.parsed.timestamps.transmit.date;
        const status = offset > 500 ? '⚠️ ' : offset < -500 ? '⚠️ ' : '✅';
        const server = result.usedServer || this.options.server;

        console.log(`[${count}] ${status} ${time.toISOString()} | Server: ${server} | Offset: ${offset > 0 ? '+' : ''}${offset.toFixed(0)}ms`);

        await this.sleep(this.options.interval);
      } catch (error) {
        console.error(`❌ Error: ${(error as Error).message}`);
        await this.sleep(this.options.interval);
      }
    }
  }

  private outputDefault(result: any): void {
    const tx = result.parsed.timestamps.transmit;
    const offset = result.parsed.timestamps.transmit.timestamp - result.clientReceiveTime.getTime();

    console.log('═'.repeat(70));
    console.log('🕐 HIXBE TIME SYNC');
    console.log('═'.repeat(70));
    console.log(`\nServer:        ${result.serverAddress} (${result.usedServer || this.options.server})`);
    console.log(`UTC Time:      ${tx.iso}`);
    console.log(`Local Time:    ${tx.local}`);
    console.log(`Offset:        ${offset > 0 ? '+' : ''}${(offset / 1000).toFixed(3)} seconds`);
    console.log(`Precision:     ±${result.parsed.header.precision} (2^x sec)`);
    console.log(`Stratum:       ${result.parsed.header.stratum}`);
    console.log('═'.repeat(70) + '\n');
  }

  private outputOffset(result: any): void {
    const offset = result.parsed.timestamps.transmit.timestamp - result.clientReceiveTime.getTime();
    console.log(offset > 0 ? '+' : '');
    console.log(offset);
  }

  private outputJSON(result: any): void {
    const output = {
      timestamp: result.parsed.timestamps.transmit.timestamp,
      iso: result.parsed.timestamps.transmit.iso,
      server: {
        address: result.serverAddress,
        hostname: result.usedServer || this.options.server,
        stratum: result.parsed.header.stratum,
        referenceId: result.parsed.header.referenceId,
      },
      offset: result.parsed.timestamps.transmit.timestamp - result.clientReceiveTime.getTime(),
      precision: result.parsed.header.precision,
      version: result.parsed.header.versionNumber,
    };
    console.log(JSON.stringify(output, null, 2));
  }

  private outputVerbose(result: any): void {
    const tx = result.parsed.timestamps.transmit;
    const h = result.parsed.header;

    console.log('═'.repeat(70));
    console.log('🕐 HIXBE TIME - DETAILED REPORT');
    console.log('═'.repeat(70));

    // Timestamps
    console.log('\n📡 TIMESTAMPS:');
    console.log(`  Reference: ${result.parsed.timestamps.reference.iso}`);
    console.log(`  Transmit:  ${tx.iso}`);
    console.log(`  Receive:   ${result.parsed.timestamps.receive.iso}`);

    // Raw bytes
    console.log('\n💾 RAW TRANSMIT TIMESTAMP (Bytes 40-47):');
    const txOffset = 40;
    const txBuffer = result.buffer.slice(txOffset, txOffset + 8);
    console.log(`  Hex: ${txBuffer.toString('hex').toUpperCase()}`);
    const ntpSeconds = txBuffer.readUInt32BE(0);
    const fraction = txBuffer.readUInt32BE(4);
    const unixSeconds = ntpSeconds - 2208988800;
    const fracMs = (fraction / 0x100000000) * 1000;
    console.log(`  Seconds (NTP): ${ntpSeconds} → Unix: ${unixSeconds}`);
    console.log(`  Fraction: 0x${fraction.toString(16).toUpperCase()} = ${fracMs.toFixed(3)}ms`);

    // Header
    console.log('\n📋 PACKET HEADER:');
    console.log(`  Leap Indicator: ${h.leapIndicator}`);
    console.log(`  Version:        ${h.versionNumber}`);
    console.log(`  Mode:           ${h.mode}`);
    console.log(`  Stratum:        ${h.stratum}`);
    console.log(`  Poll Interval:  2^${h.pollInterval}`);
    console.log(`  Precision:      2^${h.precision}`);
    console.log(`  Root Delay:     ${h.rootDelay / 65536} ms`);
    console.log(`  Root Dispersion: ${h.rootDispersion / 65536} ms`);
    console.log(`  Reference ID:   ${h.referenceId}`);

    console.log('\n═'.repeat(70) + '\n');
  }

  private handleError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error: ${message}`);
    process.exit(1);
  }

  private printHelp(): void {
    console.log(`
@hixbe/time - High-precision NTP Time Synchronization

USAGE:
  hixbe-time [OPTIONS]

OPTIONS:
  -s, --server <host>    NTP server (default: time.hixbe.com)
  -j, --json             Output as JSON
  -v, --verbose          Detailed output with raw bytes
  -o, --offset           Output only the offset in milliseconds
  -c, --continuous       Continuous sync mode
  -i, --interval <ms>    Interval between syncs (default: 5000ms)
  -h, --help             Show this help
  --version              Show version

EXAMPLES:
  hixbe-time
  hixbe-time --verbose
  hixbe-time --json
  hixbe-time --continuous --interval 1000
  hixbe-time --offset
  hixbe-time --server pool.ntp.org

Learn more: https://github.com/hixbehq/nodejs-time
    `);
  }

  private printVersion(): void {
    console.log('@hixbe/time v1.0.0');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Run CLI
const cli = new HixbeTimeCLI();
cli.run().catch((error) => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
