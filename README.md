# @hixbe/time

**High-precision NTP time synchronization package with powerful CLI tools**

A professional-grade TypeScript package for querying NTP servers and synchronizing system time with network time servers. Built with Hixbe's primary server `time.hixbe.com` for ultra-reliable time synchronization.

[![npm version](https://img.shields.io/npm/v/@hixbe/time.svg)](https://www.npmjs.com/package/@hixbe/time)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

✨ **Rich Feature Set**
- 🚀 High-performance NTP client
- 📊 Raw packet inspection & analysis
- ⏱️ Precise timestamp conversion (NTP to Unix)
- 🔄 Continuous sync mode with configurable intervals
- 📡 Multiple server support (Hixbe, pool.ntp.org, etc.)
- 📋 Detailed verbose reporting
- 🎨 Beautiful CLI with multiple output formats
- 🔐 Type-safe TypeScript implementation
- ⚡ Zero external dependencies (uses Node.js built-ins)

## Installation

```bash
npm install @hixbe/time
```

### Global CLI Installation

```bash
npm install -g @hixbe/time
hixbe-time --help
```

## Quick Start

### CLI Usage

```bash
# Get current time from Hixbe server
hixbe-time

# Verbose mode with raw packet details
hixbe-time --verbose

# Output as JSON
hixbe-time --json

# Get time offset (useful for scripts)
hixbe-time --offset

# Continuous synchronization (every 5 seconds)
hixbe-time --continuous

# Custom interval (every 2 seconds)
hixbe-time --continuous --interval 2000

# Query different server
hixbe-time --server pool.ntp.org --verbose

# Show only the offset
hixbe-time --offset
```

### Programmatic Usage

```typescript
import { NTPClient } from '@hixbe/time';

// Basic usage
const client = new NTPClient();
const result = await client.query();
console.log(result.parsed.timestamps.transmit.date);

// Get current time
const time = await client.getTime();
console.log(time); // Date object

// Get offset between local and server time
const offsetMs = await client.getOffset();
console.log(`System is ${offsetMs > 0 ? 'slow' : 'fast'} by ${Math.abs(offsetMs)}ms`);

// Custom server
const customClient = new NTPClient({ 
  host: 'time.google.com',
  timeout: 3000 
});
const time = await customClient.getTime();
```

## API Reference

### `NTPClient`

Main class for NTP queries.

```typescript
class NTPClient {
  constructor(config?: NTPClientConfig);
  async query(): Promise<NTPQueryResult>;
  async getTime(): Promise<Date>;
  async getOffset(): Promise<number>;
}
```

#### `NTPClientConfig`

```typescript
interface NTPClientConfig {
  host?: string;      // Default: 'time.hixbe.com'
  port?: number;      // Default: 123
  timeout?: number;   // Default: 5000ms
}
```

#### `NTPQueryResult`

```typescript
interface NTPQueryResult {
  buffer: Buffer;                    // Raw NTP packet
  hexDump: string;                   // Formatted hex dump
  parsed: ParsedNTPPacket;          // Parsed packet
  serverAddress: string;            // Server IP
  clientReceiveTime: Date;          // When response arrived
  clientOriginateTime: Date;        // When request sent
}
```

### `ParsedNTPPacket`

```typescript
interface ParsedNTPPacket {
  header: NTPPacketHeader;
  timestamps: NTPTimestamps;
  roundTripDelay: number | null;
  clockOffset: number | null;
}
```

#### `NTPPacketHeader`

```typescript
interface NTPPacketHeader {
  leapIndicator: number;      // 0-3: Normal, +1sec, -1sec, unsync
  versionNumber: number;      // NTP version (3 or 4)
  mode: number;               // Client/Server mode
  stratum: number;            // Clock distance from reference
  pollInterval: number;       // Poll interval (2^x seconds)
  precision: number;          // Precision (2^x seconds)
  rootDelay: number;          // Root delay in milliseconds
  rootDispersion: number;     // Root dispersion in milliseconds
  referenceId: string;        // Reference clock identifier
}
```

#### `NTPTimestamps`

```typescript
interface NTPTimestamps {
  reference: ParsedNTPTimestamp;   // Reference time
  originate: ParsedNTPTimestamp;   // Client's transmit time
  receive: ParsedNTPTimestamp;     // Server's receive time
  transmit: ParsedNTPTimestamp;    // Server's transmit time
}
```

#### `ParsedNTPTimestamp`

```typescript
interface ParsedNTPTimestamp {
  raw: {
    seconds: number;        // NTP seconds (since 1900)
    fraction: number;       // Fraction (32-bit fixed-point)
  };
  unix: {
    seconds: number;        // Unix seconds (since 1970)
    milliseconds: number;   // Fractional milliseconds
  };
  date: Date;               // JavaScript Date object
  iso: string;              // ISO 8601 string
  local: string;            // Local timezone string
  timestamp: number;        // Unix timestamp in ms
}
```

## Understanding NTP Timestamps

### The Conversion Process

NTP uses a unique timestamp format:
- **NTP Epoch**: January 1, 1900
- **Unix Epoch**: January 1, 1970
- **Offset**: 2,208,988,800 seconds

Each timestamp is 8 bytes (64-bit):
- **First 4 bytes**: Seconds since 1900
- **Last 4 bytes**: Fractional seconds (32-bit fixed-point)

### Example Conversion

```
Raw NTP packet (Bytes 40-47, Transmit):
  Hex:     EC EB 5C 3D 33 88 C9 16
  
Breakdown:
  Seconds (bytes 0-3):   0xECEB5C3D = 3,974,847,549
  Fraction (bytes 4-7):  0x3388C916 = 864,602,390
  
Conversion:
  NTP → Unix:  3,974,847,549 - 2,208,988,800 = 1,765,858,749 sec
  Fraction:    864,602,390 ÷ 0x100000000 = 0.201306 sec = 201.306 ms
  
Result:
  Unix timestamp: 1,765,858,749.201 seconds
  Date: 2025-12-16T04:19:09.201Z
```

## CLI Examples

### Default Output
```bash
$ hixbe-time
======================================================================
🕐 HIXBE TIME SYNC
======================================================================

Server:        154.26.137.94 (time.hixbe.com)
UTC Time:      2025-12-16T04:19:09.201Z
Local Time:    Tue Dec 16 2025 10:19:09 GMT+0600
Offset:        +0.468 seconds
Precision:     ±231 (2^x sec)
Stratum:       2
======================================================================
```

### Verbose Mode
```bash
$ hixbe-time --verbose
📡 TIMESTAMPS:
  Reference: 2025-12-16T04:18:37.660Z
  Transmit:  2025-12-16T04:19:09.201Z
  Receive:   2025-12-16T04:19:09.200Z

💾 RAW TRANSMIT TIMESTAMP (Bytes 40-47):
  Hex: ECEB5C3D3388C916
  Seconds (NTP): 3974847549 → Unix: 1765858749
  Fraction: 0x3388C916 = 201.306ms
```

### JSON Output
```bash
$ hixbe-time --json
{
  "timestamp": 1765858749201,
  "iso": "2025-12-16T04:19:09.201Z",
  "server": {
    "address": "154.26.137.94",
    "stratum": 2,
    "referenceId": "0xD8EF230C"
  },
  "offset": 468,
  "precision": -23,
  "version": 4
}
```

### Continuous Sync
```bash
$ hixbe-time --continuous --interval 1000
⏱️  Starting continuous sync with time.hixbe.com
📊 Interval: 1000ms (1.0s)
Press Ctrl+C to stop

[1] ✅ 2025-12-16T04:19:09.201Z | Offset: +468ms
[2] ✅ 2025-12-16T04:19:10.205Z | Offset: +456ms
[3] ✅ 2025-12-16T04:19:11.210Z | Offset: +442ms
```

## Advanced Usage

### Creating a Time Sync Daemon

```typescript
import { NTPClient } from '@hixbe/time';

async function syncClock() {
  const client = new NTPClient({ host: 'time.hixbe.com' });
  const offsetMs = await client.getOffset();
  
  if (Math.abs(offsetMs) > 1000) {
    console.warn(`⚠️ Large offset detected: ${offsetMs}ms`);
    // Could trigger system time adjustment
  }
  
  console.log(`Clock offset: ${offsetMs}ms`);
}

// Sync every 60 seconds
setInterval(syncClock, 60000);
```

### Monitoring Multiple Servers

```typescript
import { NTPClient } from '@hixbe/time';

const servers = [
  'time.hixbe.com',
  'pool.ntp.org',
  'time.google.com'
];

for (const server of servers) {
  const client = new NTPClient({ host: server });
  try {
    const time = await client.getTime();
    console.log(`${server}: ${time.toISOString()}`);
  } catch (error) {
    console.error(`${server}: Failed`);
  }
}
```

### Raw Packet Analysis

```typescript
import { NTPClient, NTPParser } from '@hixbe/time';

const client = new NTPClient();
const result = await client.query();

// Access raw bytes
console.log(result.hexDump);

// Parse header
const header = result.parsed.header;
console.log(`Stratum: ${header.stratum}`);
console.log(`Reference ID: ${header.referenceId}`);

// Access all timestamps
const ts = result.parsed.timestamps;
console.log(`Server said time is: ${ts.transmit.iso}`);
```

## Supported NTP Servers

```typescript
// Hixbe (recommended)
new NTPClient({ host: 'time.hixbe.com' })

// Public pools and servers
new NTPClient({ host: 'pool.ntp.org' })
new NTPClient({ host: 'time.nist.gov' })
new NTPClient({ host: 'time.google.com' })
new NTPClient({ host: 'time.cloudflare.com' })
new NTPClient({ host: 'time.apple.com' })
```

## Performance & Reliability

- ⚡ **Fast**: < 100ms typical response time
- 🔒 **Reliable**: Works with standard NTP servers
- 📊 **Accurate**: Microsecond precision
- 🌐 **Network Safe**: Standard UDP port 123
- 💾 **Lightweight**: No dependencies beyond Node.js

## Troubleshooting

### "NTP request timeout"
- Server may be unreachable
- Firewall blocking UDP port 123
- Try a different server: `--server pool.ntp.org`

### Offset seems large
- Normal variation can be several hundred milliseconds
- Check with `--verbose` for server stratum
- Try lower latency server

### "Invalid NTP packet"
- Packet may be corrupted
- Server may not be responding with valid NTP
- Try different server

## FAQ

**Q: Can I use this in production?**
A: Yes! This is a robust, type-safe implementation suitable for production clock synchronization.

**Q: What's the precision?**
A: Typically ±50-200ms depending on network latency and server stratum.

**Q: Can I set system time?**
A: This package only queries and reports time. OS permissions are needed for actual system time adjustment.

**Q: Why is my offset negative?**
A: Your system time is ahead of the NTP server time.

**Q: Can I use IPv6 servers?**
A: Currently uses UDP4. IPv6 support coming in v2.0.

## Security

- No authentication required for NTP (protocol design)
- Uses standard UDP port 123
- Validates packet structure
- TypeScript type safety prevents injection attacks

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode
npm run dev

# Run tests
npm test
```

## License

MIT © 2025 Hixbe

## Contributing

Contributions welcome! Please submit pull requests to improve:
- IPv6 support
- Performance optimizations
- Additional time servers
- Better documentation

## Support

- GitHub Issues: https://github.com/hixbehq/nodejs-time/issues
- Documentation: https://github.com/hixbehq/nodejs-time#readme
- Contact: support@hixbe.com

---

Made with ❤️ by **Hixbe** - Precision Time Solutions
