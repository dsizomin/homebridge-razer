import {ProxyObject} from 'dbus-next';
import {DBusClient} from './base';
import {Device} from './types';

export class CommonDBusClient extends DBusClient{

  public async getAllDevices(): Promise<Device[]> {
    const serials = await this.getDevicesSerials();
    return Promise.all(serials.map(s => this.getDeviceBySerial(s)));
  }

  private async getDevicesSerials(): Promise<string[]> {
    const dbusInterface = await this.getInterface('razer.devices');
    return dbusInterface.getDevices();
  }

  private async getDeviceBySerial(serial: string): Promise<Device> {
    const dbusInterface = await this.getInterface('razer.devices.misc');

    const namePromise = new Promise<string>((res, rej) => {
      dbusInterface.getDeviceName((err, data) => err ? rej(err) : res(data));
    });

    const typePromise = new Promise<string>((res, rej) => {
      dbusInterface.getDeviceType((err, data) => err ? rej(err) : res(data));
    });

    const vidPidPromise = new Promise<[string, string]>((res, rej) => {
      dbusInterface.getVidPid((err, data) => err ? rej(err) : res(data));
    });

    const [
      displayName,
      type,
      [vid, pid],
    ] = await Promise.all([namePromise, typePromise, vidPidPromise]);

    return {
      type,
      vid,
      pid,
      serial,
      displayName,
    };
  }

  protected getProxyObject(): Promise<ProxyObject> {
    return this.dbus.getProxyObject('org.razer', '/org/razer');
  }
}