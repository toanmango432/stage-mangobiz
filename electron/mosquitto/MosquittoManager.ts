/**
 * Mosquitto Broker Manager
 * Manages the lifecycle of the embedded Mosquitto MQTT broker
 *
 * Part of: MQTT Architecture Implementation (Phase 2)
 */

import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';
import { app } from 'electron';
import { EventEmitter } from 'events';

// =============================================================================
// Types
// =============================================================================

export interface MosquittoBrokerInfo {
  isRunning: boolean;
  port: number;
  pid: number | null;
  startedAt: Date | null;
  configPath: string;
  binaryPath: string;
}

export interface MosquittoConfig {
  port?: number;
  maxConnections?: number;
  persistenceEnabled?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_PORT = 1883;
const DEFAULT_MAX_CONNECTIONS = 50;
const STARTUP_TIMEOUT_MS = 10000;
const SHUTDOWN_TIMEOUT_MS = 5000;

// =============================================================================
// MosquittoManager Class
// =============================================================================

export class MosquittoManager extends EventEmitter {
  private process: ChildProcess | null = null;
  private port: number;
  private startedAt: Date | null = null;
  private binaryPath: string;
  private configPath: string;
  private isShuttingDown = false;

  constructor(config: MosquittoConfig = {}) {
    super();
    this.port = config.port || DEFAULT_PORT;
    this.binaryPath = this.getBinaryPath();
    this.configPath = this.getConfigPath();
  }

  // ===========================================================================
  // Path Resolution
  // ===========================================================================

  /**
   * Get the path to the Mosquitto binary for the current platform
   */
  private getBinaryPath(): string {
    const platform = process.platform;
    const arch = process.arch;
    const isDev = !app.isPackaged;

    let basePath: string;
    if (isDev) {
      // Development: binaries in electron/mosquitto/bin/ from project root
      // __dirname is out/main/, so go up to project root then into electron/mosquitto/bin
      basePath = join(app.getAppPath(), 'electron', 'mosquitto', 'bin');
    } else {
      // Production: binaries in resources/mosquitto/
      basePath = join(process.resourcesPath, 'mosquitto');
    }

    // Platform-specific binary
    let binaryName: string;
    switch (platform) {
      case 'darwin':
        binaryName = 'mosquitto';
        break;
      case 'win32':
        binaryName = 'mosquitto.exe';
        break;
      case 'linux':
        binaryName = 'mosquitto';
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    const binaryPath = isDev
      ? join(basePath, platform, arch, binaryName)
      : join(basePath, binaryName);

    return binaryPath;
  }

  /**
   * Get the path to the Mosquitto config file
   */
  private getConfigPath(): string {
    const isDev = !app.isPackaged;

    if (isDev) {
      // Development: config in electron/mosquitto/config/ from project root
      return join(app.getAppPath(), 'electron', 'mosquitto', 'config', 'mosquitto.conf');
    } else {
      return join(process.resourcesPath, 'mosquitto-config', 'mosquitto.conf');
    }
  }

  // ===========================================================================
  // Lifecycle Management
  // ===========================================================================

  /**
   * Start the Mosquitto broker
   */
  async start(): Promise<void> {
    if (this.process) {
      console.log('[MosquittoManager] Broker already running');
      return;
    }

    // Check if binary exists
    if (!existsSync(this.binaryPath)) {
      const error = new Error(
        `Mosquitto binary not found at: ${this.binaryPath}`
      );
      console.error('[MosquittoManager]', error.message);
      console.log(
        '[MosquittoManager] Please download Mosquitto binaries for your platform'
      );
      this.emit('error', error.message);
      throw error;
    }

    // Check if config exists
    if (!existsSync(this.configPath)) {
      console.warn(
        `[MosquittoManager] Config not found at: ${this.configPath}, using defaults`
      );
    }

    return new Promise((resolve, reject) => {
      const args = existsSync(this.configPath)
        ? ['-c', this.configPath, '-p', String(this.port), '-v']
        : ['-p', String(this.port), '-v'];

      console.log(
        `[MosquittoManager] Starting: ${this.binaryPath} ${args.join(' ')}`
      );

      this.process = spawn(this.binaryPath, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      // Set up timeout for startup
      const startupTimeout = setTimeout(() => {
        reject(new Error('Mosquitto startup timeout'));
      }, STARTUP_TIMEOUT_MS);

      // Handle stdout
      this.process.stdout?.on('data', (data: Buffer) => {
        const output = data.toString();
        console.log('[Mosquitto]', output.trim());

        // Check for successful startup message
        if (
          output.includes('mosquitto version') ||
          output.includes('Opening ipv4 listen socket')
        ) {
          clearTimeout(startupTimeout);
          this.startedAt = new Date();
          this.emit('started', this.getBrokerInfo());
          resolve();
        }
      });

      // Handle stderr
      this.process.stderr?.on('data', (data: Buffer) => {
        const output = data.toString();
        console.error('[Mosquitto Error]', output.trim());

        // Some startup messages go to stderr
        if (output.includes('mosquitto version')) {
          clearTimeout(startupTimeout);
          this.startedAt = new Date();
          this.emit('started', this.getBrokerInfo());
          resolve();
        }
      });

      // Handle process exit
      this.process.on('exit', (code, signal) => {
        clearTimeout(startupTimeout);
        console.log(
          `[MosquittoManager] Process exited with code ${code}, signal ${signal}`
        );

        if (!this.isShuttingDown) {
          this.emit('stopped', { code, signal });
          this.process = null;
          this.startedAt = null;
        }
      });

      // Handle process error
      this.process.on('error', (error) => {
        clearTimeout(startupTimeout);
        console.error('[MosquittoManager] Process error:', error);
        this.emit('error', error.message);
        reject(error);
      });
    });
  }

  /**
   * Stop the Mosquitto broker
   */
  async stop(): Promise<void> {
    if (!this.process) {
      console.log('[MosquittoManager] Broker not running');
      return;
    }

    this.isShuttingDown = true;

    return new Promise((resolve) => {
      const shutdownTimeout = setTimeout(() => {
        console.log('[MosquittoManager] Force killing process');
        this.process?.kill('SIGKILL');
        resolve();
      }, SHUTDOWN_TIMEOUT_MS);

      this.process?.on('exit', () => {
        clearTimeout(shutdownTimeout);
        this.process = null;
        this.startedAt = null;
        this.isShuttingDown = false;
        console.log('[MosquittoManager] Broker stopped gracefully');
        resolve();
      });

      // Send SIGTERM for graceful shutdown
      console.log('[MosquittoManager] Sending SIGTERM');
      this.process?.kill('SIGTERM');
    });
  }

  /**
   * Restart the Mosquitto broker
   */
  async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  // ===========================================================================
  // Status Methods
  // ===========================================================================

  /**
   * Check if the broker is running
   */
  isRunning(): boolean {
    return this.process !== null && !this.isShuttingDown;
  }

  /**
   * Get the broker port
   */
  getPort(): number {
    return this.port;
  }

  /**
   * Get the process ID
   */
  getPid(): number | null {
    return this.process?.pid || null;
  }

  /**
   * Get broker information
   */
  getBrokerInfo(): MosquittoBrokerInfo {
    return {
      isRunning: this.isRunning(),
      port: this.port,
      pid: this.getPid(),
      startedAt: this.startedAt,
      configPath: this.configPath,
      binaryPath: this.binaryPath,
    };
  }
}

export default MosquittoManager;
