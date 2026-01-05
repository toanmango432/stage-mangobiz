# Mosquitto Binaries

This folder contains platform-specific Mosquitto MQTT broker binaries.

## Directory Structure

```
bin/
├── darwin/
│   ├── arm64/mosquitto    # macOS Apple Silicon
│   └── x64/mosquitto      # macOS Intel
├── win32/
│   └── x64/mosquitto.exe  # Windows 64-bit
└── linux/
    ├── arm64/mosquitto    # Linux ARM64
    └── x64/mosquitto      # Linux 64-bit
```

## Downloading Binaries

### macOS (Homebrew)

```bash
# Install on Apple Silicon Mac
brew install mosquitto

# Copy binary
cp /opt/homebrew/sbin/mosquitto darwin/arm64/

# For Intel Mac
cp /usr/local/sbin/mosquitto darwin/x64/
```

### Windows

1. Download from: https://mosquitto.org/download/
2. Extract mosquitto.exe to `win32/x64/`

### Linux

```bash
# Ubuntu/Debian
sudo apt-get install mosquitto

# Copy binary
cp /usr/sbin/mosquitto linux/x64/

# For ARM64
cp /usr/sbin/mosquitto linux/arm64/
```

## Notes

- Binaries are NOT included in git (add to .gitignore)
- Each platform needs its native binary for Electron packaging
- Development mode will look for system-installed mosquitto if binary not found
- Production builds MUST include the appropriate binary

## Version Requirements

- Mosquitto 2.0.x or later recommended
- Must support WebSocket listeners (protocol websockets)
