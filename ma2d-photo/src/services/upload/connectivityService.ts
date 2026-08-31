import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export async function isConnected(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return Boolean(state.isConnected && state.isInternetReachable !== false);
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
