import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'me.slnko.app',
  appName: 'Slinkto',
  webDir: 'out',
  server: {
    url: 'https://www.slnko.me',
    cleartext: false
  }
};

export default config;
