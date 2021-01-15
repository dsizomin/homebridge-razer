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

async function getDevicesSerials(): Promise<string[]> {
  const dbusInterface: DBusInterface = await new Promise((res, rej) => {
    sessionBus.getInterface(
      'org.razer',
      '/org/razer',
      'razer.devices',
      (err, data) => err ? rej(err) : res(data),
    );
  });

  return new Promise((res, rej) => {
    dbusInterface.getDevices((err, data) => err ? rej(err) : res(data));
  });
}

async function getDeviceBySerial(serial: string): Promise<Device> {
  const dbusInterface: DBusInterface = await new Promise((res, rej) => {
    sessionBus.getInterface(
      'org.razer',
      `/org/razer/device/${serial}`,
      'razer.device.misc',
      (err, data) => err ? rej(err) : res(data),
    );
  });

  const typePromise = new Promise<string>((res, rej) => {
    dbusInterface.getDeviceType((err, data) => err ? rej(err) : res(data));
  });

  const vidPidPromise = new Promise<[string, string]>((res, rej) => {
    dbusInterface.getVidPid((err, data) => err ? rej(err) : res(data));
  });

  const [type, [vid, pid]] = await Promise.all([typePromise, vidPidPromise]);

  return {
    type,
    vid,
    pid,
    serial,
    displayName: `${type} ${serial}`,
  };
}

export async function getAllDevices(): Promise<Device[]> {
  const serials = await getDevicesSerials();
  return Promise.all(serials.map(s => getDeviceBySerial(s)));
}


