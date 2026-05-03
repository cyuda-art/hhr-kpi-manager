import { GuestGuard } from "@/components/guards/GuestGuard";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuestGuard>
      {children}
    </GuestGuard>
  );
}
