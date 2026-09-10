import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export async function isConnected(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}

/** True only on Wi-Fi (or a wired/ethernet link), used by the data-saving setting. */
export async function isOnWifi(): Promise<boolean> {
  const state = await NetInfo.fetch();
  if (!state.isConnected || state.isInternetReachable === false) return false;
  return state.type === 'wifi' || state.type === 'ethernet';
}

/** Fires whenever connectivity transitions to "online". Returns an unsubscribe fn. */
export function subscribeOnReconnect(onReconnect: () => void): () => void {
  let wasOffline = false;
  const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    const online = Boolean(state.isConnected && state.isInternetReachable !== false);
    if (online && wasOffline) onReconnect();
    wasOffline = !online;
  });
  return unsubscribe;
}
