"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui-kit/badge";
import { Button } from "@/components/ui-kit/button";
import { Card, CardContent } from "@/components/ui-kit/card";
import { api } from "@/trpc/react";

type Enquiry = {
  id: string;
  topic: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  company: string | null;
  country: string | null;
  message: string | null;
  handled: boolean;
  createdAt: string;
};

export function EnquiryRow({ enquiry }: { enquiry: Enquiry }) {
  const router = useRouter();

  const setHandled = api.enquiry.setHandled.useMutation({
    onSuccess: () => router.refresh(),
  });

  const name = [enquiry.firstName, enquiry.lastName]
    .filter((part) => part && part !== "—")
    .join(" ");

  return (
    <Card className={enquiry.handled ? "opacity-60" : undefined}>
      <CardContent className="flex flex-wrap items-start justify-between gap-4 pt-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              {enquiry.topic}
            </Badge>
            <p className="font-medium">{name || enquiry.email}</p>
            {enquiry.country && enquiry.country !== "—" ? (
              <span className="text-xs text-muted-foreground">
                {enquiry.country}
              </span>
            ) : null}
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            <a href={`mailto:${enquiry.email}`} className="hover:underline">
              {enquiry.email}
            </a>
            {enquiry.phone ? ` · ${enquiry.phone}` : ""}
            {enquiry.company ? ` · ${enquiry.company}` : ""}
          </p>

          {enquiry.message && enquiry.message !== "Newsletter sign-up" ? (
            <p className="mt-3 whitespace-pre-line text-sm">{enquiry.message}</p>
          ) : null}

          <p className="mt-3 text-xs text-muted-foreground">
            {new Date(enquiry.createdAt).toLocaleString("en-GB")}
          </p>
        </div>

        <Button
          variant={enquiry.handled ? "outline" : "default"}
          size="sm"
          disabled={setHandled.isPending}
          onClick={() =>
            setHandled.mutate({ id: enquiry.id, handled: !enquiry.handled })
          }
        >
          {enquiry.handled ? "Reopen" : "Mark handled"}
        </Button>
      </CardContent>
    </Card>
  );
}
