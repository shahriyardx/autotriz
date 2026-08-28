import "server-only";
import nodemailer from "nodemailer";
import { site } from "@/lib/site";

/* ==================================================================
   Outgoing email.

   Configured with the five SMTP_* values. Until they are set, sending
   is skipped and the caller falls back to handing the admin a link to
   pass on by hand — so invites work before email does.
   ================================================================== */

const HOST = process.env.SMTP_HOST;
const PORT = Number(process.env.SMTP_PORT ?? 587);
const USER = process.env.SMTP_USER;
const PASS = process.env.SMTP_PASSWORD;
const FROM = process.env.SMTP_FROM ?? `${site.name} <no-reply@auto-triz.com>`;

export const MAIL_CONFIGURED = Boolean(HOST && USER && PASS);

let transport: nodemailer.Transporter | null = null;
const mailer = () => {
  transport ??= nodemailer.createTransport({
    host: HOST,
    port: PORT,
    secure: PORT === 465,
    auth: { user: USER, pass: PASS },
  });
  return transport;
};

export async function sendMail(message: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  if (!MAIL_CONFIGURED) return { sent: false as const };
  await mailer().sendMail({ from: FROM, ...message });
  return { sent: true as const };
}

/** The invitation itself. Plain and short on purpose. */
export function inviteEmail(options: {
  url: string;
  invitedBy: string | null;
  roleLabel: string;
  expiresInDays: number;
}) {
  const from = options.invitedBy ? `${options.invitedBy} has invited you` : "You have been invited";
  const text = [
    `${from} to join the ${site.name} admin panel as ${options.roleLabel}.`,
    "",
    "Accept the invitation and set your password here:",
    options.url,
    "",
    `The link stops working in ${options.expiresInDays} days.`,
    "If you were not expecting this, ignore the email — nothing happens until you use the link.",
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;line-height:1.6;color:#1a1a1a">
      <p style="font-size:15px">${from} to join the <strong>${site.name}</strong> admin panel as <strong>${options.roleLabel}</strong>.</p>
      <p style="margin:28px 0">
        <a href="${options.url}"
           style="background:#f5c645;color:#1a1a1a;padding:14px 28px;border-radius:4px;text-decoration:none;font-weight:600;letter-spacing:.08em;text-transform:uppercase;font-size:12px">
          Accept the invitation
        </a>
      </p>
      <p style="font-size:13px;color:#545454">Or paste this into your browser:<br>
        <span style="word-break:break-all">${options.url}</span>
      </p>
      <p style="font-size:13px;color:#767676">
        The link stops working in ${options.expiresInDays} days. If you were not
        expecting this, ignore the email — nothing happens until you use the link.
      </p>
    </div>`;

  return { text, html };
}
