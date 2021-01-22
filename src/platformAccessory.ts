import {CharacteristicGetCallback, CharacteristicSetCallback, CharacteristicValue, PlatformAccessory, Service} from 'homebridge';

import {HomebridgeRazerPlugin} from './platform';
import {DeviceDBusClient} from './dbus';
import color from 'color-convert';

const DefaultHSLLightLevel = 50;

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class ExamplePlatformAccessory {
  private service: Service;

  private isDeviceOn = false;

  private deviceHue = 0;
  private deviceSaturation = 0;

  constructor(
    private readonly platform: HomebridgeRazerPlugin,
    private readonly accessory: PlatformAccessory,
    private readonly dbusClient: DeviceDBusClient,
  ) {

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Razer')
      .setCharacteristic(this.platform.Characteristic.Model, accessory.context.device.type)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.device.serial);

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.displayName);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // register handlers for the On/Off Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .on('set', this.setOn.bind(this))
      .on('get', this.getOn.bind(this));

    // register handlers for the Brightness Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.Brightness)
      .on('set', this.setBrightness.bind(this))
      .on('get', this.getBrightness.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.Hue)
      .on('set', this.setHue.bind(this))
      .on('get', this.getHue.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.Saturation)
      .on('set', this.setSaturation.bind(this))
      .on('get', this.getSaturation.bind(this));
  }

  setOn(value: CharacteristicValue, callback: CharacteristicSetCallback) {

    const booleanValue = Boolean(value);
    const originalDeviceOn = booleanValue;

    this.isDeviceOn = booleanValue;

    this.dbusClient.setColor(booleanValue ? color.hsl.rgb([
      this.deviceHue,
      this.deviceSaturation,
      DefaultHSLLightLevel,
    ]) : null)
      .then(() => {
        this.platform.log.debug('Set Characteristic On ->', value);
        callback();
      })
      .catch(err => {
        this.isDeviceOn = originalDeviceOn;
        callback(err);
      });
  }

  getOn(callback: CharacteristicGetCallback) {
    this.platform.log.debug('Get Characteristic On -> ', this.isDeviceOn);
    callback(null, this.isDeviceOn);
  }

  getBrightness(callback: CharacteristicGetCallback) {
    this.dbusClient.getBrightness()
      .then(value => {
        this.platform.log.debug('Get Characteristic Brightness ->', value);
        callback(null, value);
      })
      .catch(err => callback(err));
  }

  setBrightness(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    this.dbusClient.setBrightness(Number(value))
      .then(() => {
        this.platform.log.debug('Set Characteristic Brightness -> ', value);
        callback(null);
      })
      .catch(err => callback(err));
  }

  getHue(callback: CharacteristicGetCallback) {
    this.platform.log.debug('Get Characteristic Hue -> ', this.deviceHue);
    callback(null, this.deviceHue);
  }

  setHue(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    const numberValue = Number(value);
    const originalHue = this.deviceHue;

    this.deviceHue = numberValue;
    const newRGB = color.hsl.rgb([
      numberValue,
      this.deviceSaturation,
      DefaultHSLLightLevel,
    ]);

    this.dbusClient.setColor(newRGB)
      .then(() => {
        this.platform.log.debug('Set Characteristic Hue -> ', value);
        callback(null);
      })
      .catch(err => {
        this.deviceHue = originalHue;
        callback(err);
      });
  }

  getSaturation(callback: CharacteristicGetCallback) {
    this.platform.log.debug('Get Characteristic Saturation -> ', this.deviceSaturation);
    callback(null, this.deviceSaturation);
  }

  setSaturation(value: CharacteristicValue, callback: CharacteristicSetCallback) {
    const numberValue = Number(value);

    const originalSaturation = this.deviceSaturation;

    const newRGB = color.hsl.rgb([
      this.deviceHue,
      numberValue,
      DefaultHSLLightLevel,
    ]);

    this.dbusClient.setColor(newRGB)
      .then(() => {
        this.platform.log.debug('Set Characteristic Saturation -> ', value);
        callback(null);
      })
      .catch(err => {
        this.deviceSaturation = originalSaturation;
        callback(err);
      });
  }
}
