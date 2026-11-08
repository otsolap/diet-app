import { Suspense } from "react";
import {
  MobileNavClient,
  MobileNavFallback,
} from "@/src/components/navigation/mobile-nav-client";

export function MobileNav() {
  return (
    <Suspense fallback={<MobileNavFallback />}>
      <MobileNavClient />
    </Suspense>
  );
}
