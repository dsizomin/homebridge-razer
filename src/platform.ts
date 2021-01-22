import {API, Characteristic, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service} from 'homebridge';

import {PLATFORM_NAME, PLUGIN_NAME} from './settings';
import {ExamplePlatformAccessory} from './platformAccessory';

import {CommonDBusClient, DeviceDBusClient} from './dbus';
import DBus, {MessageBus} from 'dbus-next';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class HomebridgeRazerPlugin implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];

  private readonly dbus: MessageBus;
  private readonly dbusClient: CommonDBusClient;

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);

    this.log.debug('Connecting to System DBus...');
    this.dbus = DBus.systemBus();
    this.dbusClient = new CommonDBusClient(this.dbus);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      // run the method to discover / register your devices as accessories
      this.discoverDevices().catch(err => {
        log.error('Failed to discover devices ->', err);
      });
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  async discoverDevices() {
    const devices: string[] = await this.dbusClient.getDevicesSerials();
    return Promise.all(devices.map(d => this.processSerial(d)));
  }

  private async processSerial(serial: string): Promise<void> {
    const uuid = this.api.hap.uuid.generate(serial);

    const deviceDBusClient = new DeviceDBusClient(this.dbus, serial);

    const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

    if (existingAccessory) {
      // the accessory already exists
      if (serial) {
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
        existingAccessory.context.device = await deviceDBusClient.getDevice();
        new ExamplePlatformAccessory(this, existingAccessory, deviceDBusClient);
        this.api.updatePlatformAccessories([existingAccessory]);
      } else if (!serial) {
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
        this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
      }
    } else {
      // the accessory does not yet exist, so we need to create it
      this.log.info('Adding new accessory:', serial);

      const accessory = new this.api.platformAccessory(serial, uuid);

      accessory.context.device = await deviceDBusClient.getDevice();

      new ExamplePlatformAccessory(this, accessory, deviceDBusClient);

      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
  }
}
