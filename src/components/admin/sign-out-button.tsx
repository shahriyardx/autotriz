"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui-kit/button";

export function SignOutButton({
  variant = "secondary",
  className,
}: {
  variant?: "secondary" | "ghost";
  className?: string;
}) {
  const router = useRouter();

  return (
    <Button
      variant={variant}
      className={className}
      onClick={async () => {
        await signOut();
        router.push("/admin/login");
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
