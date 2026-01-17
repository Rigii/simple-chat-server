export const channelNamingContract = {
  user: (id: string) => `u:${id}:c`, // u: user private channel, c: channel
  room: (id: string) => `r:${id}:c`, // r: chat room channel, c: channel

  system: {
    alerts: 'sys:a',
    broadcast: 'sys:b',
  },
};
