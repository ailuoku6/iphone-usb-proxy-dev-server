#!/usr/bin/env node

const http = require('http');
const httpProxy = require('http-proxy');
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
  const usbCandidates = [customCandidates, 'bridge100', 'bridge0', 'en5', 'en7', 'en6'].filter(Boolean);

  for (const name of usbCandidates) {
    const iface = interfaces[name];
    if (!iface) continue;

    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal) {
        return addr.address;
      }
    }
  }

  return null;
}

// 创建代理服务器
const proxy = httpProxy.createProxyServer({});
const server = http.createServer((req, res) => {
  // proxy.web(req, res, { target: `http://127.0.0.1:${LOCAL_TARGET_PORT}` });
  proxy.web(req, res, { target: `http://localhost:${LOCAL_TARGET_PORT}` });
});

// 启动监听
server.listen(PROXY_PORT, '0.0.0.0', () => {
  const ip = getUSBNetworkIP() || '未知 IP';
  console.log(`🚀 Proxy 服务已启动`);
  console.log(`🧭 本地访问: http://localhost:${PROXY_PORT}`);
  console.log(`📱 iPhone USB 访问: http://${ip}:${PROXY_PORT}`);
  console.log(`🔁 正在转发到 127.0.0.1:${LOCAL_TARGET_PORT}`);
});
