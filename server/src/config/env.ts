export const env = {
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  // Trust only local proxies by default. Set a specific proxy IP/CIDR in production.
  trustedProxies: process.env.TRUSTED_PROXY_IPS || 'loopback',
};
