# @hixbe/time - Quick Start Guide

## Installation

### Local Project
```bash
npm install @hixbe/time
```

### Global (for CLI use everywhere)
```bash
npm install -g @hixbe/time
```

## CLI Usage

### Get Current Time
```bash
$ hixbe-time
══════════════════════════════════════════════════════════════════════
🕐 HIXBE TIME SYNC
══════════════════════════════════════════════════════════════════════

Server:        154.26.137.94 (time.hixbe.com)
UTC Time:      2025-12-16T04:27:07.341Z
Local Time:    Tue Dec 16 2025 10:27:07 GMT+0600
Offset:        +0.480 seconds
Precision:     ±231 (2^x sec)
Stratum:       2
══════════════════════════════════════════════════════════════════════
```

### JSON Format (for scripts)
```bash
$ hixbe-time --json
{
  "timestamp": 1765859251781,
  "iso": "2025-12-16T04:27:31.781Z",
  "server": {
    "address": "154.26.137.94",
    "stratum": 2,
    "referenceId": "0xD8EF230C"
  },
  "offset": 524,
  "precision": 231,
  "version": 4
}
```

### Detailed Analysis
```bash
$ hixbe-time --verbose
═══════════════════════════════════════════════════════════════════════
🕐 HIXBE TIME - DETAILED REPORT
═══════════════════════════════════════════════════════════════════════

📡 TIMESTAMPS:
  Reference: 2025-12-16T04:27:15.229Z
  Transmit:  2025-12-16T04:27:22.765Z
  Receive:   2025-12-16T04:27:22.764Z

💾 RAW TRANSMIT TIMESTAMP (Bytes 40-47):
  Hex: ECEB5E2AC3DA6422
  Seconds (NTP): 3974848042 → Unix: 1765859242
  Fraction: 0xC3DA6422 = 765.051ms

📋 PACKET HEADER:
  Leap Indicator: 0
  Version:        4
  Mode:           4
  Stratum:        2
  Poll Interval:  2^1
  Precision:      2^231
  Root Delay:     0.002 ms
  Root Dispersion: 0.012 ms
  Reference ID:   0xD8EF230C
```

### Offset Only (useful for scripting)
```bash
$ hixbe-time --offset
+486
```

### Continuous Monitoring
```bash
$ hixbe-time --continuous --interval 2000
⏱️  Starting continuous sync with time.hixbe.com
📊 Interval: 2000ms (2.0s)
Press Ctrl+C to stop

[1] ✅ 2025-12-16T04:27:09.201Z | Offset: +468ms
[2] ✅ 2025-12-16T04:27:11.205Z | Offset: +456ms
[3] ✅ 2025-12-16T04:27:13.210Z | Offset: +442ms
```

## Code Usage

### TypeScript/ES Module

```typescript
import { NTPClient } from '@hixbe/time';

// Get server time
const client = new NTPClient();
const time = await client.getTime();
console.log(time.toISOString());

// Get offset
const offsetMs = await client.getOffset();
console.log(`Your clock is ${offsetMs > 0 ? 'slow' : 'fast'} by ${Math.abs(offsetMs)}ms`);

// Full packet analysis
const result = await client.query();
console.log(result.parsed.timestamps.transmit.iso);
console.log(result.parsed.header.stratum);
```

### Using Default Export

```typescript
import time from '@hixbe/time';

const currentTime = await time.getTime();
const offset = await time.getOffset();
const fullResult = await time.query();
```

### Custom Server

```typescript
import { NTPClient } from '@hixbe/time';

const client = new NTPClient({
  host: 'pool.ntp.org',
  timeout: 3000
});

const time = await client.getTime();
```

## Supported Servers

```
✨ Hixbe (recommended)
   host: time.hixbe.com

🌍 Public Pools
   host: pool.ntp.org
   host: time.nist.gov
   host: time.google.com
   host: time.cloudflare.com
   host: time.apple.com
```

## Understanding the Output

### Offset
- Positive = Your system is **slow** (behind the server)
- Negative = Your system is **fast** (ahead of the server)
- Small variations (±500ms) are normal

### Stratum
- 1 = Primary reference (GPS, atomic clock)
- 2 = Synced from stratum 1
- 3+ = Synced from other sources
- 16 = Unsynchronized

### Leap Indicator
- 0 = Normal (no leap second pending)
- 1 = Leap second added at end of day
- 2 = Leap second removed at end of day
- 3 = Unsynchronized

## Common Commands

```bash
# Simple time check
hixbe-time

# Check time offset in milliseconds
hixbe-time --offset

# Get machine-readable JSON
hixbe-time --json | jq '.offset'

# Monitor every second
hixbe-time --continuous --interval 1000

# Check different server
hixbe-time --server pool.ntp.org --verbose

# Show version
hixbe-time --version

# Show help
hixbe-time --help
```

## Troubleshooting

**Q: "NTP request timeout"**
A: Server is unreachable. Try `--server pool.ntp.org`

**Q: Offset seems large**
A: Run `--verbose` to check stratum. Normal variation is ±1 second.

**Q: "Invalid NTP packet"**
A: Server may not respond with valid NTP. Try a different server.

**Q: Permission denied**
A: Windows Firewall may be blocking UDP 123. Add exception or use different server.

## Advanced Scripts

### Shell Script - Automatic Time Sync Check
```bash
#!/bin/bash
OFFSET=$(hixbe-time --offset)
if [ $OFFSET -lt -1000 ] || [ $OFFSET -gt 1000 ]; then
  echo "⚠️ Clock is off by ${OFFSET}ms - consider sync"
else
  echo "✅ Clock is accurate"
fi
```

### Node.js - Continuous Monitoring
```javascript
import { NTPClient } from '@hixbe/time';

const client = new NTPClient();
setInterval(async () => {
  const offset = await client.getOffset();
  console.log(`${new Date().toISOString()} | Offset: ${offset}ms`);
}, 30000);
```

## Documentation

- Full API: [README.md](./README.md)
- Examples: [EXAMPLES.md](./EXAMPLES.md)
- GitHub: https://github.com/hixbehq/time

---

**Made with ❤️ by Hixbe**
