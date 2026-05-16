import { create } from 'zustand';

interface PaywallStore {
  isOpen: boolean;
  requiredCredits: number;
  featureName: string;
  openPaywall: (featureName: string, requiredCredits: number) => void;
  closePaywall: () => void;
}

export const usePaywallStore = create<PaywallStore>((set) => ({
  isOpen: false,
  requiredCredits: 0,
  featureName: '',
  openPaywall: (featureName, requiredCredits) => 
    set({ isOpen: true, featureName, requiredCredits }),
  closePaywall: () => set({ isOpen: false }),
}));
