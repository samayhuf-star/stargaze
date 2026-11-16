import Purchases, { LOG_LEVEL, type CustomerInfo } from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert, Platform } from 'react-native';

/** Entitlement identifier configured in the RevenueCat dashboard. */
export const PRO_ENTITLEMENT = 'premium';

const IOS_KEY = process.env.EXPO_PUBLIC_RC_IOS_KEY ?? '';

type ProContextValue = {
  isPro: boolean;
  ready: boolean;
  /** True when no RevenueCat key is set: purchases are disabled and a dev toggle is shown. */
  unconfigured: boolean;
  openPaywall: () => Promise<boolean>;
  restore: () => Promise<void>;
  manageSubscription: () => Promise<void>;
  /** Development only: flips Pro on and off so gated UI can be tested before RevenueCat is set up. */
  devTogglePro: () => void;
};

const ProContext = createContext<ProContextValue | null>(null);

const hasPro = (info: CustomerInfo) => info.entitlements.active[PRO_ENTITLEMENT] !== undefined;

export function ProProvider({ children }: { children: ReactNode }) {
  const unconfigured = Platform.OS !== 'ios' || IOS_KEY.length === 0;
  const [isPro, setIsPro] = useState(false);
  const [ready, setReady] = useState(unconfigured);

  useEffect(() => {
    if (unconfigured) return;
    let active = true;
    (async () => {
      try {
        if (__DEV__) await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        Purchases.configure({ apiKey: IOS_KEY });
        // Apple Search Ads attribution uses AdServices, which needs no tracking permission.
        Purchases.enableAdServicesAttributionTokenCollection().catch(() => {});
        Purchases.addCustomerInfoUpdateListener((info) => active && setIsPro(hasPro(info)));
        const info = await Purchases.getCustomerInfo();
        if (active) setIsPro(hasPro(info));
      } catch (e) {
        console.warn('RevenueCat setup failed', e);
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [unconfigured]);

  const openPaywall = useCallback(async () => {
    if (unconfigured) {
      Alert.alert('Stargaze Pro is not available yet', 'Purchases are not switched on in this test build. Everything in the free version works.');
      return false;
    }
    try {
      const result = await RevenueCatUI.presentPaywall();
      return result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED;
    } catch (e) {
      console.warn('Paywall failed', e);
      return false;
    }
  }, [unconfigured]);

  const restore = useCallback(async () => {
    if (unconfigured) return;
    try {
      setIsPro(hasPro(await Purchases.restorePurchases()));
    } catch (e) {
      console.warn('Restore failed', e);
    }
  }, [unconfigured]);

  const manageSubscription = useCallback(async () => {
    if (unconfigured) return;
    try {
      await RevenueCatUI.presentCustomerCenter();
    } catch (e) {
      console.warn('Customer Center failed', e);
    }
  }, [unconfigured]);

  const value = useMemo<ProContextValue>(
    () => ({ isPro, ready, unconfigured, openPaywall, restore, manageSubscription, devTogglePro: () => setIsPro((p) => !p) }),
    [isPro, ready, unconfigured, openPaywall, restore, manageSubscription],
  );
  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
}

export function usePro(): ProContextValue {
  const ctx = useContext(ProContext);
  if (!ctx) throw new Error('usePro must be used inside ProProvider');
  return ctx;
}
