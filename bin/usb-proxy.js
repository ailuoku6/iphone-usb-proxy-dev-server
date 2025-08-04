#!/usr/bin/env node

const os = require('os');

// 默认端口
let LOCAL_TARGET_PORT = 3000;
let PROXY_PORT = 4000;

let customCandidates = '';

// 解析命令行参数
const args = process.argv.slice(2);
args.forEach((arg) => {
  if (arg.startsWith('--localPort=')) {
    LOCAL_TARGET_PORT = parseInt(arg.split('=')[1], 10);
  } else if (arg.startsWith('--proxyPort=')) {
    PROXY_PORT = parseInt(arg.split('=')[1], 10);
  } else if (arg.startsWith('--customCandidates=')) {
    customCandidates = arg.split('=')[1];
  }
});

// 获取 USB 网络 IP（通常为 bridge 接口）
function getUSBNetworkIP() {
  const interfaces = os.networkInterfaces();
  const usbCandidates = [customCandidates, 'bridge100', 'bridge0', 'en5', 'en7', 'en6', 'en11', 'en19'].filter(Boolean);
  const extraCandidates = [];
  // 获取所有 enX 接口，从 en8 到 en30
  for (let i = 8; i <= 30; i++) {
    extraCandidates.push(`en${i}`);
  }
  usbCandidates.push(...extraCandidates);

  const usbIp = [];

  for (const name of usbCandidates) {
    const iface = interfaces[name];
    if (!iface) continue;

    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal) {
        // return addr.address;
        usbIp.push(addr.address);
      }
    }
  }

  return usbIp;
}

const app = require('fastify')({ logger: false })
const proxy = require('@fastify/http-proxy')
app.register(proxy, {
  upstream: `http://localhost:${LOCAL_TARGET_PORT}`,
  prefix: '/',
  websocket: true
})
app.listen({ port: PROXY_PORT, host: '0.0.0.0' })

const ips = getUSBNetworkIP();
console.log(`🚀 Proxy 服务已启动`);
console.log(`🔁 正在转发到 127.0.0.1:${LOCAL_TARGET_PORT}`);
console.log(`📱 iPhone USB 访问地址:`);
(ips.length ? ips : ['未知 IP']).forEach((ip) => {
  console.log(`http://${ip}:${PROXY_PORT}`);
});

