import {Service, PlatformAccessory, CharacteristicValue, CharacteristicSetCallback, CharacteristicGetCallback} from 'homebridge';

import {HomebridgeRazerPlugin} from './platform';
import {getBrightness, getOn, setBrightness, setOn} from './dbus';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class ExamplePlatformAccessory {
  private service: Service;

  constructor(
    private readonly platform: HomebridgeRazerPlugin,
    private readonly accessory: PlatformAccessory,
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
      .on('set', this.setOn.bind(this))                // SET - bind to the `setOn` method below
      .on('get', this.getOn.bind(this));               // GET - bind to the `getOn` method below

    // register handlers for the Brightness Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.Brightness)
      .on('set', this.setBrightness.bind(this))        // SET - bind to the 'setBrightness` method below
      .on('get', this.getBrightness.bind(this));       // GET - bind to the 'setBrightness` method below
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  setOn(value: CharacteristicValue, callback: CharacteristicSetCallback) {

    setOn(this.accessory.context.device, Boolean(value))
      .then(() => {
        this.platform.log.debug('Set Characteristic On ->', value);
        callback();
      })
      .catch(err => callback(err));
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  getOn(callback: CharacteristicGetCallback) {
    getOn(this.accessory.context.device)
      .then(value => {
        this.platform.log.debug('Get Characteristic On ->', value);
        callback(null, value);
      })
      .catch(err => callback(err));
  }

  getBrightness(callback: CharacteristicGetCallback) {
    getBrightness(this.accessory.context.device)
      .then(value => {
        this.platform.log.debug('Get Characteristic Brightness ->', value);
        callback(null, value);
      })
      .catch(err => callback(err));
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, changing the Brightness
   */
  setBrightness(value: CharacteristicValue, callback: CharacteristicSetCallback) {

    setBrightness(this.accessory.context.device, Number(value))
      .then((value) => {
        this.platform.log.debug('Set Characteristic Brightness -> ', value);
        callback(null);
      })
      .catch(err => callback(err));
  }
}
