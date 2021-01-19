import {MessageBus, ProxyObject} from 'dbus-next';
import {DBusClient} from './base';
import {Device} from './types';

export class DeviceDBusClient extends DBusClient{
  constructor(
    dbus: MessageBus,
    private readonly device: Device,
  ) {
    super(dbus);
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

  async getOn(): Promise<boolean> {
    const brightness = await this.getBrightness();
    return Boolean(brightness);
  }

  protected getProxyObject(): Promise<ProxyObject> {
    return this.dbus.getProxyObject('org.razer', `/org/razer/device/${this.device.serial}`);
  }
}