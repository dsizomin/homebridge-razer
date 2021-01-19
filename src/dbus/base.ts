import {ClientInterface, MessageBus, ProxyObject} from 'dbus-next';

export abstract class DBusClient {
  constructor(protected readonly dbus: MessageBus) {
  }

  protected abstract getProxyObject(): Promise<ProxyObject>;

  protected async getInterface(interfaceName: string): Promise<ClientInterface> {
    const proxy = await this.getProxyObject();
    return proxy.getInterface(interfaceName);
  }
}
