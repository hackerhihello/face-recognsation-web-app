import type { Metadata } from "next";
import { ShieldX } from "lucide-react";
import { Card } from "@/components/ds/Card";
import { ButtonLink } from "@/components/ds/Button";
import { EmptyState } from "@/components/ds/States";

export const metadata: Metadata = { title: "Access denied" };

export default function AccessDeniedPage() {
  return (
    <Card>
      <EmptyState
        icon={ShieldX}
        title="You don't have access to this page"
        message="Your role does not include permission for this area. Ask your company's Master Admin if you need access."
        action={<ButtonLink href="/app/dashboard" variant="secondary">Back to dashboard</ButtonLink>}
      />
    </Card>
  );
}
