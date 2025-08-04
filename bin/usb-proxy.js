#!/usr/bin/env node

const http = require('http');
const httpProxy = require('http-proxy');
const os = require('os');
const WebSocket = require('ws');

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

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  // 代理 HTTP 请求
  proxy.web(req, res, { target: `http://localhost:${LOCAL_TARGET_PORT}` });
});

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ noServer: true });

// 处理 WebSocket 连接
wss.on('connection', (ws, req) => {
  // 获取 WebSocket 请求的完整 URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname; // WebSocket 的路径
  const queryParams = url.search; // WebSocket 的查询参数
  
  // 构建目标 WebSocket 地址
  const wsProxyUrl = `ws://localhost:${LOCAL_TARGET_PORT}${path}${queryParams}`;
  
  const wsProxy = new WebSocket(wsProxyUrl);

  wsProxy.on('open', () => {
    console.log('WebSocket 连接成功');
  });

  wsProxy.on('error', (err) => {
    console.error('WebSocket 代理连接失败:', err.message);
    ws.close();
  });

  ws.on('message', (message) => {
    wsProxy.send(message);
  });

  wsProxy.on('message', (message) => {
    ws.send(message);
  });

  ws.on('close', () => wsProxy.close());
  wsProxy.on('close', () => ws.close());
});

// 将 WebSocket 升级到 WebSocket 服务器
server.on('upgrade', (request, socket, head) => {
  if (request.headers.upgrade === 'websocket') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

// 启动监听
server.listen(PROXY_PORT, '0.0.0.0', () => {
  const ip = getUSBNetworkIP() || '未知 IP';
  console.log(`🚀 Proxy 服务已启动`);
  console.log(`🧭 本地访问: http://localhost:${PROXY_PORT}`);
  console.log(`📱 iPhone USB 访问: http://${ip}:${PROXY_PORT}`);
  console.log(`🔁 正在转发到 127.0.0.1:${LOCAL_TARGET_PORT}`);
});
