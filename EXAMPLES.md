# Example Usage of @hixbe/time

## CLI Examples

### 1. Get Current Time
```bash
hixbe-time
```

### 2. Verbose Output with Raw Bytes
```bash
hixbe-time --verbose
```

### 3. JSON Output for Scripting
```bash
hixbe-time --json
```

### 4. Get Offset Only
```bash
hixbe-time --offset
```

### 5. Continuous Synchronization
```bash
hixbe-time --continuous --interval 2000
```

## Code Examples

### Basic Usage

```typescript
import { NTPClient } from '@hixbe/time';

async function main() {
  const client = new NTPClient();
  const result = await client.query();
  
  console.log('Server time:', result.parsed.timestamps.transmit.iso);
  console.log('Local time:', new Date().toISOString());
  console.log('Offset:', result.parsed.timestamps.transmit.timestamp - Date.now(), 'ms');
}

main();
```

### Get Current Time

```typescript
import { NTPClient } from '@hixbe/time';

const client = new NTPClient();
const time = await client.getTime();
console.log(time); // Date object
```

### Check System Clock Accuracy

```typescript
import { NTPClient } from '@hixbe/time';

const client = new NTPClient();
const offsetMs = await client.getOffset();

if (Math.abs(offsetMs) > 500) {
  console.warn(`⚠️  Your system clock is off by ${offsetMs}ms`);
} else {
  console.log(`✅ Your system clock is accurate (±${Math.abs(offsetMs)}ms)`);
}
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

### Raw Packet Analysis

```typescript
import { NTPClient } from '@hixbe/time';

const client = new NTPClient();
const result = await client.query();

// Hex dump
console.log(result.hexDump);

// Header info
console.log('Stratum:', result.parsed.header.stratum);
console.log('Version:', result.parsed.header.versionNumber);
console.log('Mode:', result.parsed.header.mode);

// All timestamps
const { reference, originate, receive, transmit } = result.parsed.timestamps;
console.log('Reference:', reference.iso);
console.log('Transmit:', transmit.iso);
```

### Clock Synchronization Daemon

```typescript
import { NTPClient } from '@hixbe/time';

async function syncClock() {
  try {
    const client = new NTPClient();
    const offsetMs = await client.getOffset();
    
    console.log(`[${new Date().toISOString()}] Offset: ${offsetMs}ms`);
    
    if (Math.abs(offsetMs) > 2000) {
      console.warn('Large offset detected!');
      // Could trigger system time adjustment here
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Sync every 60 seconds
setInterval(syncClock, 60 * 1000);
```

### Monitor Multiple Servers

```typescript
import { NTPClient } from '@hixbe/time';

const servers = [
  'time.hixbe.com',
  'pool.ntp.org',
  'time.google.com'
];

async function checkAllServers() {
  for (const server of servers) {
    try {
      const client = new NTPClient({ host: server });
      const time = await client.getTime();
      console.log(`✅ ${server}: ${time.toISOString()}`);
    } catch (error) {
      console.log(`❌ ${server}: Failed`);
    }
  }
}

checkAllServers();
```

### Default Export Usage

```typescript
import time from '@hixbe/time';

// Using default export convenience functions
const currentTime = await time.getTime();
const offset = await time.getOffset('pool.ntp.org');
const result = await time.query();
```
