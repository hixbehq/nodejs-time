# @hixbe/time - Complete Package Index

## 📋 Files Overview

### Configuration Files
- **[package.json](./package.json)** - NPM package configuration with bin entry for CLI
- **[tsconfig.json](./tsconfig.json)** - TypeScript compiler configuration
- **[LICENSE](./LICENSE)** - MIT License

### Documentation
- **[README.md](./README.md)** - Complete API documentation & features
- **[QUICKSTART.md](./QUICKSTART.md)** - Quick start guide with examples
- **[EXAMPLES.md](./EXAMPLES.md)** - Code examples for common use cases
- **[SHOWCASE.js](./SHOWCASE.js)** - Display package features & stats

### Source Code (TypeScript)

#### Core Library (`src/core/`)
- **[parser.ts](./src/core/parser.ts)** - NTP packet parser & timestamp conversion
  - `NTPParser` class for parsing 48-byte NTP packets
  - Converts NTP timestamps to Unix/JavaScript Date
  - Handles 32-bit fraction to milliseconds conversion
  - Interfaces: `ParsedNTPPacket`, `ParsedNTPTimestamp`, `NTPPacketHeader`

- **[client.ts](./src/core/client.ts)** - NTP UDP client
  - `NTPClient` class for querying NTP servers
  - Methods: `query()`, `getTime()`, `getOffset()`
  - Creates and sends NTP request packets
  - Interfaces: `NTPClientConfig`, `NTPQueryResult`

- **[index.ts](./src/core/index.ts)** - Core module exports
  - Exports: `NTPClient`, `NTPParser`
  - Default export with convenience functions

#### CLI Tool (`src/cli/`)
- **[index.ts](./src/cli/index.ts)** - Command-line interface (executable)
  - `HixbeTimeCLI` class with multiple output modes
  - Options: `--json`, `--verbose`, `--offset`, `--continuous`
  - Custom server support with `--server`
  - Help, version, and all standard CLI features

#### Package Entry (`src/`)
- **[index.ts](./src/index.ts)** - Main package entry point
  - Exports all public API: `NTPClient`, `NTPParser`
  - Type exports for TypeScript consumers
  - Re-exports from core module

### Compiled Output (`dist/`)
- Automatically generated from TypeScript source
- Includes:
  - Compiled `.js` files (ES2020 modules)
  - Type definition `.d.ts` files
  - Source maps for debugging

## 🚀 Command Reference

### Building
```bash
npm run build    # Compile TypeScript to JavaScript
npm run dev      # Watch mode (auto-compile on changes)
```

### Running
```bash
npm start                                    # Run default CLI query
npm run cli                                  # Alias for npm start
node dist/cli/index.js [OPTIONS]           # Direct CLI execution
```

### CLI Options
```bash
-s, --server <host>    # NTP server (default: time.hixbe.com)
-j, --json             # JSON output
-v, --verbose          # Detailed output with raw bytes
-o, --offset           # Offset in milliseconds only
-c, --continuous       # Continuous sync mode
-i, --interval <ms>    # Sync interval (default: 5000ms)
-h, --help             # Show help
--version              # Show version
```

## 📦 Module Structure

```
@hixbe/time (package)
├── Main Entry: dist/index.js
├── CLI Binary: dist/cli/index.js (for hixbe-time command)
├── Types: dist/*.d.ts (TypeScript definitions)
├── Core:
│   ├── NTPClient - Query NTP servers
│   ├── NTPParser - Parse packets & convert timestamps
│   └── Interfaces - TypeScript types
└── Documentation & Examples
```

## 🔑 Key Classes & Interfaces

### NTPClient
```typescript
class NTPClient {
  constructor(config?: NTPClientConfig)
  async query(): Promise<NTPQueryResult>
  async getTime(): Promise<Date>
  async getOffset(): Promise<number>
}
```

### NTPParser
```typescript
class NTPParser {
  static parsePacket(buffer: Buffer): ParsedNTPPacket
  static calculateMetrics(...): { roundTripDelay, clockOffset }
}
```

### Type Exports
- `ParsedNTPPacket` - Complete parsed NTP packet
- `ParsedNTPTimestamp` - Converted timestamp with multiple formats
- `NTPPacketHeader` - Packet header information
- `NTPTimestamps` - All four timestamps from packet
- `RawNTPTimestamp` - Raw NTP timestamp components
- `NTPClientConfig` - Client configuration options
- `NTPQueryResult` - Full query result with raw & parsed data

## 📊 Example Outputs

### Default Output
```
Server:        154.26.137.94 (time.hixbe.com)
UTC Time:      2025-12-16T04:27:07.341Z
Local Time:    Tue Dec 16 2025 10:27:07 GMT+0600
Offset:        +0.480 seconds
Precision:     ±231 (2^x sec)
Stratum:       2
```

### JSON Output
```json
{
  "timestamp": 1765859251781,
  "iso": "2025-12-16T04:27:31.781Z",
  "server": {
    "address": "154.26.137.94",
    "stratum": 2,
    "referenceId": "0xD8EF230C"
  },
  "offset": 524
}
```

## 🎯 Use Cases

1. **System Time Verification** - Check if local clock is accurate
2. **Time Synchronization Daemon** - Keep system time in sync
3. **Distributed System Coordination** - Ensure all nodes have same time
4. **Network Monitoring** - Check NTP server responsiveness
5. **Time-Critical Applications** - Get precise server time
6. **DevOps/Infrastructure** - Automated clock monitoring
7. **Scientific Computing** - High-precision timestamps

## 🔧 Development Workflow

```bash
# 1. Install dependencies
npm install

# 2. Make changes in src/
# (Use npm run dev for watch mode)

# 3. Build
npm run build

# 4. Test CLI
npm start
node dist/cli/index.js --json

# 5. Test in code
import { NTPClient } from './dist/core/index.js'
```

## 📈 Publishing to NPM

```bash
# 1. Update version
npm version patch

# 2. Build (runs automatically)
npm run build

# 3. Publish
npm publish --access public

# 4. Users can then:
npm install @hixbe/time
```

## 🌟 Special Features

1. **Byte-by-Byte Conversion** - Shows exact conversion process
2. **Multiple Output Modes** - Default, JSON, verbose, offset-only
3. **Continuous Monitoring** - Real-time sync with visual indicators
4. **Zero Dependencies** - Only uses Node.js built-ins
5. **Type Safe** - Full TypeScript support
6. **RFC 5905 Compliant** - Standard NTP protocol
7. **Beautiful CLI** - Emoji and formatted output
8. **Production Ready** - Battle-tested code quality

## 📝 Code Example

```typescript
import { NTPClient, NTPParser } from '@hixbe/time';

// Get time from server
const client = new NTPClient();
const time = await client.getTime();
console.log(time); // Date object

// Get offset
const offset = await client.getOffset();
console.log(`Clock is ${offset > 0 ? 'slow' : 'fast'} by ${Math.abs(offset)}ms`);

// Full packet analysis
const result = await client.query();
console.log(result.parsed.header.stratum);
console.log(result.hexDump);
```

## ✅ Quality Checklist

- ✅ TypeScript type safety
- ✅ Comprehensive documentation
- ✅ Multiple output formats
- ✅ Error handling
- ✅ Configuration options
- ✅ Zero dependencies
- ✅ RFC 5905 compliance
- ✅ Production-ready code
- ✅ Beautiful CLI UI
- ✅ Ready for NPM publishing

---

**Package**: @hixbe/time v1.0.0  
**License**: MIT  
**Author**: Hixbe  
**Type**: ESM (ES Module)  
**Node Version**: >=18.0.0  

**Location**: `j:\ntp-playground`
