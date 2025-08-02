# usb-proxy-dev-server

通过 USB 将 iPhone 连接到 Mac 时，在 Mac 上创建一个可被 iPhone 访问的代理服务器。实现无侵入式的iphone->usb->proxyserver->mac->server的调试链路

## 用途

Mac打开网络共享后，让 iPhone 通过Mac的usb网络ip访问 Mac 上本地运行的服务。并展示Mac的usb网络ip

## 安装

```bash
npm install -g usb-proxy-dev-server
```

## 使用

```bash
usb-proxy --localPort=8082 --proxyPort=7082
```

默认：
- 监听 `0.0.0.0:4000`
- 转发到 `127.0.0.1:3000`

## 注意事项

- iPhone 必须通过 USB 使用「Internet共享」连接 Mac。
