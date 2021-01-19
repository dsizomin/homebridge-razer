import {ProxyObject} from 'dbus-next';
import {DBusClient} from './base';
import {Device} from './types';

export class CommonDBusClient extends DBusClient{

  // public async getAllDevices(): Promise<Device[]> {
  //   const serials = await this.getDevicesSerials();
  //   return Promise.all(serials.map(s => this.getDeviceBySerial(s)));
  // }

  public async getDevicesSerials(): Promise<string[]> {
    const dbusInterface = await this.getInterface('razer.devices');
    return dbusInterface.getDevices();
  }

  protected getProxyObject(): Promise<ProxyObject> {
    return this.dbus.getProxyObject('org.razer', '/org/razer');
  }
}