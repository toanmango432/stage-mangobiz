# Device Discovery

> Zero-config device connection using cloud-assisted local discovery

---

## Overview

Mango POS provides **zero-config device setup** - users simply download apps and connect without manual IP configuration. This is achieved through **cloud-assisted local discovery**:

1. Store App starts Mosquitto broker and registers its local IP with Supabase
2. Other devices query Supabase to find the local MQTT broker
3. Devices connect directly via local network using MQTT protocol

---

## User Experience

### Setup Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     ZERO-CONFIG SETUP                            │
│                                                                  │
│   1. User downloads Store App on main computer                  │
│      └── Store App starts Mosquitto broker, registers IP        │
│                                                                  │
│   2. User downloads Check-In App on tablet                      │
│      └── Check-In App queries cloud for local hub IP            │
│      └── Connects to Store App automatically                    │
│                                                                  │
│   3. User downloads Mango Pad on iPad                           │
│      └── Same automatic discovery and connection                │
│                                                                  │
│   ✓ No manual IP entry required                                 │
│   ✓ Works across different network configurations               │
│   ✓ Automatic reconnection on network changes                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### salon_devices Table

```sql
CREATE TABLE salon_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES stores(id),
  device_id TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT NOT NULL CHECK (device_type IN (
    'store-app',
    'check-in',
    'mango-pad',
    'staff-tablet',
    'display'
  )),

  -- Network discovery (MQTT)
  local_ip TEXT,
  mqtt_port INTEGER DEFAULT 1883,
  is_local_hub BOOLEAN DEFAULT false,

  -- Status
  is_online BOOLEAN DEFAULT true,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_ip_change TIMESTAMP WITH TIME ZONE,

  -- Metadata
  app_version TEXT,
  os_type TEXT,
  os_version TEXT,
  capabilities TEXT[], -- ['signatures', 'payments', 'printing']

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  UNIQUE(salon_id, device_id)
);

-- Index for quick hub lookup
CREATE INDEX idx_salon_devices_hub ON salon_devices(salon_id, is_local_hub, is_online);

-- Index for heartbeat updates
CREATE INDEX idx_salon_devices_last_seen ON salon_devices(last_seen);
```

### Row Level Security

```sql
-- Devices can only see devices from their own salon
ALTER TABLE salon_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Devices can view salon devices"
  ON salon_devices FOR SELECT
  USING (salon_id IN (
    SELECT salon_id FROM device_tokens WHERE device_id = current_setting('app.device_id')
  ));

CREATE POLICY "Devices can update their own record"
  ON salon_devices FOR UPDATE
  USING (device_id = current_setting('app.device_id'));

CREATE POLICY "Devices can insert their own record"
  ON salon_devices FOR INSERT
  WITH CHECK (device_id = current_setting('app.device_id'));
```

---

## Discovery Flow

### Step 1: Store App Registration

When Store App starts, it launches Mosquitto broker and registers as the local hub:

```typescript
// apps/store-app/src/services/hubRegistration.ts

async function registerAsLocalHub(): Promise<void> {
  // Start local Mosquitto broker first
  await startMosquittoBroker();

  const localIp = await getLocalIpAddress();

  await supabase.from('salon_devices').upsert({
    salon_id: config.salonId,
    device_id: config.deviceId,
    device_name: 'Front Desk',
    device_type: 'store-app',
    local_ip: localIp,
    mqtt_port: 1883,
    is_local_hub: true,
    is_online: true,
    last_seen: new Date().toISOString(),
    app_version: APP_VERSION,
    os_type: process.platform,
    capabilities: ['appointments', 'tickets', 'payments', 'printing']
  }, {
    onConflict: 'salon_id,device_id'
  });

  // Start heartbeat
  startHeartbeat();
}

function getLocalIpAddress(): string {
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      // Skip internal and IPv6
      if (iface.internal || iface.family !== 'IPv4') continue;

      // Prefer common local network ranges
      if (iface.address.startsWith('192.168.') ||
          iface.address.startsWith('10.') ||
          iface.address.startsWith('172.')) {
        return iface.address;
      }
    }
  }

  return '127.0.0.1';
}
```

### Step 2: Device Discovery

When Check-In App or Mango Pad starts:

```typescript
// packages/mqtt-client/src/discovery.ts

interface LocalBroker {
  ip: string;
  port: number;
  deviceId: string;
  lastSeen: Date;
}

async function discoverLocalBroker(salonId: string): Promise<LocalBroker | null> {
  const { data, error } = await supabase
    .from('salon_devices')
    .select('local_ip, mqtt_port, device_id, last_seen')
    .eq('salon_id', salonId)
    .eq('is_local_hub', true)
    .eq('is_online', true)
    .order('last_seen', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  // Check if hub was seen recently (within 2 minutes)
  const lastSeen = new Date(data.last_seen);
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

  if (lastSeen < twoMinutesAgo) {
    console.warn('Local broker last seen too long ago:', lastSeen);
    return null;
  }

  return {
    ip: data.local_ip,
    port: data.mqtt_port,
    deviceId: data.device_id,
    lastSeen: lastSeen
  };
}
```

### Step 3: Connection Attempt

```typescript
// packages/mqtt-client/src/MangoMqtt.ts
import mqtt, { MqttClient } from 'mqtt';

class MangoMqtt {
  private client: MqttClient | null = null;
  private connectionType: 'local' | 'cloud' = 'cloud';

  async connect(): Promise<void> {
    // Step 1: Try local discovery
    const localBroker = await discoverLocalBroker(this.config.salonId);

    if (localBroker) {
      const localUrl = `mqtt://${localBroker.ip}:${localBroker.port}`;

      // Step 2: Verify local broker is reachable
      const isReachable = await this.pingBroker(localUrl, 2000);

      if (isReachable) {
        this.client = mqtt.connect(localUrl, this.getMqttOptions());
        this.connectionType = 'local';
        console.log(`Connected to local broker at ${localUrl}`);
        return;
      }

      console.warn('Local broker not reachable, falling back to cloud');
    }

    // Step 3: Fallback to cloud broker
    this.client = mqtt.connect(CLOUD_MQTT_URL, {
      ...this.getMqttOptions(),
      protocol: 'mqtts',
      port: 8883
    });
    this.connectionType = 'cloud';
    console.log('Connected to cloud broker');
  }

  private async pingBroker(url: string, timeout: number): Promise<boolean> {
    return new Promise((resolve) => {
      const testClient = mqtt.connect(url, {
        connectTimeout: timeout,
        reconnectPeriod: 0  // Don't auto-reconnect for ping
      });

      testClient.on('connect', () => {
        testClient.end();
        resolve(true);
      });

      testClient.on('error', () => {
        testClient.end();
        resolve(false);
      });

      setTimeout(() => {
        testClient.end();
        resolve(false);
      }, timeout);
    });
  }
}
```

---

## Heartbeat Mechanism

### Store App Heartbeat

The Store App sends regular heartbeats to indicate it's online:

```typescript
// apps/store-app/src/services/heartbeat.ts

const HEARTBEAT_INTERVAL = 30_000; // 30 seconds

function startHeartbeat(): void {
  setInterval(async () => {
    const localIp = getLocalIpAddress();

    await supabase.from('salon_devices').update({
      is_online: true,
      last_seen: new Date().toISOString(),
      local_ip: localIp // Update in case IP changed
    }).eq('device_id', config.deviceId);

  }, HEARTBEAT_INTERVAL);
}

// Mark offline on shutdown
process.on('beforeExit', async () => {
  await supabase.from('salon_devices').update({
    is_online: false
  }).eq('device_id', config.deviceId);
});
```

### Stale Device Cleanup

Edge function to mark stale devices as offline:

```typescript
// supabase/functions/cleanup-stale-devices/index.ts

Deno.serve(async () => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  await supabase
    .from('salon_devices')
    .update({ is_online: false })
    .lt('last_seen', fiveMinutesAgo)
    .eq('is_online', true);

  return new Response('OK');
});

// Scheduled via cron: every 5 minutes
```

---

## IP Change Handling

When the local network IP changes:

```typescript
// apps/store-app/src/services/networkMonitor.ts

import { networkInterfaces } from 'os';

let lastKnownIp: string | null = null;

function startNetworkMonitor(): void {
  setInterval(async () => {
    const currentIp = getLocalIpAddress();

    if (currentIp !== lastKnownIp) {
      console.log(`IP changed: ${lastKnownIp} -> ${currentIp}`);

      // Update Supabase
      await supabase.from('salon_devices').update({
        local_ip: currentIp,
        last_ip_change: new Date().toISOString()
      }).eq('device_id', config.deviceId);

      // Notify connected devices to reconnect
      io.emit('hub:ip-changed', { newIp: currentIp });

      lastKnownIp = currentIp;
    }
  }, 10_000); // Check every 10 seconds
}
```

---

## Device Status UI

Show connection status in apps:

```typescript
// packages/ui/src/components/ConnectionStatus.tsx

function ConnectionStatus() {
  const { connectionType, isConnected } = useSocket();

  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "w-2 h-2 rounded-full",
        isConnected ? "bg-green-500" : "bg-red-500"
      )} />
      <span className="text-sm text-muted-foreground">
        {isConnected
          ? connectionType === 'local'
            ? 'Connected (Local)'
            : 'Connected (Cloud)'
          : 'Disconnected'
        }
      </span>
    </div>
  );
}
```

---

## Troubleshooting

### Device Not Discovering Local Broker

1. **Check Store App is running** - Must be open on main computer
2. **Same network** - All devices must be on same WiFi/LAN
3. **Firewall** - Port 1883 must be open on Store App computer
4. **Recent heartbeat** - Store App heartbeat within 2 minutes
5. **Mosquitto running** - Check broker process is active

### Manual Override

For edge cases, allow manual IP entry:

```typescript
// Settings screen
function ManualBrokerConfig() {
  const [manualIp, setManualIp] = useState('');

  const connect = async () => {
    localStorage.setItem('manual_broker_ip', manualIp);
    await mqttClient.connect({ forceIp: manualIp, port: 1883 });
  };

  return (
    <div>
      <Input
        placeholder="192.168.1.100"
        value={manualIp}
        onChange={(e) => setManualIp(e.target.value)}
      />
      <Button onClick={connect}>Connect</Button>
    </div>
  );
}
```

---

## Security Considerations

1. **Local network only** - Local Mosquitto broker binds to local network interfaces
2. **Same salon validation** - Devices can only discover brokers from their salon
3. **Username/password auth** - All MQTT connections require valid credentials
4. **TLS for cloud** - Cloud broker uses port 8883 with TLS encryption
5. **Topic ACL** - Devices can only pub/sub to their salon's topics

---

## Related Documentation

- [Real-time Communication](./REALTIME_COMMUNICATION.md) - Socket.io architecture
- [Data Storage Strategy](./DATA_STORAGE_STRATEGY.md) - Database patterns
- [Technical Documentation](./TECHNICAL_DOCUMENTATION.md) - Overall architecture

---

*Last updated: January 2025*
