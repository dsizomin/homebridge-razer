import { getBus } from 'dbus';

import type { DBusInterface, AnyInterfaceMethod } from 'dbus';

const sessionBus = getBus('session');

export type PrimaryDBusInterface = DBusInterface<AnyInterfaceMethod>;
export type DeviceDBusInterface = DBusInterface<AnyInterfaceMethod>;

export type DeviceDescriptor = {
  type: string;
  vid: string;
  pid: string;
};

// TODO type it better
export function getPrimaryInterface(): Promise<PrimaryDBusInterface> {
  return new Promise((res, rej) => {
    sessionBus.getInterface(
      'org.razer',
      '/org/razer',
      'razer.devices',
      (err, data) => err ? rej(err) : res(data),
    );
  });
}

export function getDevices(dbusInterface: PrimaryDBusInterface): Promise<string[]> {
  return new Promise((res, rej) => {
    dbusInterface.getDevices((err, data) => err ? rej(err) : res(data));
  });
}

export function getDeviceInterface(serial: string): Promise<DeviceDBusInterface> {
  return new Promise((res, rej) => {
    sessionBus.getInterface(
      'org.razer',
      `/org/razer/device/${serial}`,
      'razer.device.misc',
      (err, data) => err ? rej(err) : res(data),
    );
  });
}

export function getDeviceDescriptor(dbusInterface: DeviceDBusInterface): Promise<DeviceDescriptor> {
  const typePromise = new Promise<string>((res, rej) => {
    dbusInterface.getDeviceType((err, data) => err ? rej(err) : res(data));
  });

  const vidPidPromise = new Promise<[string, string]>((res, rej) => {
    dbusInterface.getVidPid((err, data) => err ? rej(err) : res(data));
  });

  return Promise.all([typePromise, vidPidPromise])
    .then(([type, [vid, pid]]) => ({
      type,
      vid,
      pid,
    }));
}


