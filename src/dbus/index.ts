import { getBus } from 'dbus';

import type { DBusConnection, DBusInterface } from 'dbus';

const sessionBus: DBusConnection = getBus('session');

export type Device = {
  serial: string;
  type: string;
  vid: string;
  pid: string;
  displayName: string;
};

async function getDBusInterface(interfaceName: string, serial: string | null = null): Promise<DBusInterface> {
  return new Promise((res, rej) => {
    sessionBus.getInterface(
      'org.razer',
      serial ? `/org/razer/device/${serial}` : '/org/razer',
      interfaceName,
      (err, data) => err ? rej(err) : res(data),
    );
  });
}

async function getDevicesSerials(): Promise<string[]> {
  const dbusInterface: DBusInterface = await getDBusInterface('razer.devices');

  return new Promise((res, rej) => {
    dbusInterface.getDevices((err, data) => err ? rej(err) : res(data));
  });
}

async function getDeviceBySerial(serial: string): Promise<Device> {
  const dbusInterface: DBusInterface = await getDBusInterface('razer.device.misc', serial);

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

export async function getAllDevices(): Promise<Device[]> {
  const serials = await getDevicesSerials();
  return Promise.all(serials.map(s => getDeviceBySerial(s)));
}

export async function setBrightness(device: Device, value: number): Promise<void> {
  const dbusInterface: DBusInterface = await getDBusInterface('razer.device.lighting.brightness', device.serial);

  return new Promise((res, rej) => {
    dbusInterface.setBrightness(value, (err) => err ? rej(err) : res());
  });
}

export async function getBrightness(device: Device): Promise<number> {
  const dbusInterface: DBusInterface = await getDBusInterface('razer.device.lighting.brightness', device.serial);

  return new Promise((res, rej) => {
    dbusInterface.getBrightness((err, value) => err ? rej(err) : res(Number(value)));
  });
}

export async function setOn(device: Device, value: boolean): Promise<void> {
  return setBrightness(device, value ? 100 : 0);
}

export async function getOn(device: Device): Promise<boolean> {
  const brightness = await getBrightness(device);
  return Boolean(brightness);
}


