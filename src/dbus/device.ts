import {MessageBus, ProxyObject} from 'dbus-next';
import {DBusClient} from './base';
import {Device} from './types';
import {RGB} from 'color-convert/conversions';

export class DeviceDBusClient extends DBusClient{
  constructor(
    dbus: MessageBus,
    private readonly serial: string,
  ) {
    super(dbus);
  }

  async getDevice(): Promise<Device> {
    const dbusInterface = await this.getInterface('razer.device.misc');

    const namePromise = dbusInterface.getDeviceName();
    const typePromise = dbusInterface.getDeviceType();
    const vidPidPromise = dbusInterface.getVidPid();

    const [
      displayName,
      type,
      [vid, pid],
    ] = await Promise.all([namePromise, typePromise, vidPidPromise]);

    return {
      type,
      vid,
      pid,
      displayName,
      serial: this.serial,
    };
  }

  async setBrightness(value: number): Promise<void> {
    const brightnessDbusInterface = await this.getInterface('razer.device.lighting.brightness');
    return brightnessDbusInterface.setBrightness(value);
  }

  async getBrightness(): Promise<number> {
    const brightnessDbusInterface = await this.getInterface('razer.device.lighting.brightness');
    return brightnessDbusInterface.getBrightness();
  }

  async setOn(value: boolean): Promise<void> {
    const brightness = await this.getBrightness();
    if (value && brightness === 0) {
      return this.setBrightness(100);
    } else if (!value && brightness > 0) {
      return this.setBrightness(0);
    }
  }

  async setColor(value: RGB | null): Promise<void> {
    const dbusInterface = await this.getInterface('razer.device.lighting.chroma');
    if (value) {
      return dbusInterface.setStatic(...value);
    } else {
      return dbusInterface.setNone();
    }
  }

  async getOn(): Promise<boolean> {
    const brightness = await this.getBrightness();
    return Boolean(brightness);
  }

  protected getProxyObject(): Promise<ProxyObject> {
    return this.dbus.getProxyObject('org.razer', `/org/razer/device/${this.serial}`);
  }
}