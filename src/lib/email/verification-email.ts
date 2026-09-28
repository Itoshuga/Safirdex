import "server-only";

import type { AppLocale } from "@/lib/i18n/locales";

const BREVO_TRANSACTIONAL_EMAIL_URL = "https://api.brevo.com/v3/smtp/email";

const copy = {
  fr: {
    subject: "Confirme ton adresse e-mail | Safirdex",
    preheader: "Une dernière étape pour finaliser ton compte Safirdex.",
    eyebrow: "Bienvenue dans le Codex",
    title: "Confirme ton adresse e-mail",
    body: "Valide cette adresse pour finaliser la création de ton compte et accéder à toutes les fonctionnalités de Safirdex.",
    action: "Vérifier mon adresse",
    fallback: "Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :",
    ignore: "Si tu n’es pas à l’origine de cette inscription, tu peux ignorer cet e-mail.",
    footer: "Safirdex · Le Codex communautaire de Safir",
  },
  en: {
    subject: "Verify your email address | Safirdex",
    preheader: "One last step to complete your Safirdex account.",
    eyebrow: "Welcome to the Codex",
    title: "Verify your email address",
    body: "Confirm this address to complete your account and access every Safirdex feature.",
    action: "Verify my email",
    fallback: "If the button does not work, copy this link into your browser:",
    ignore: "If you did not create this account, you can safely ignore this email.",
    footer: "Safirdex · The community Codex for Safir",
  },
} satisfies Record<AppLocale, Record<string, string>>;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderVerificationEmail(locale: AppLocale, verificationUrl: string) {
  const content = copy[locale];
  const safeUrl = escapeHtml(verificationUrl);

  return {
    subject: content.subject,
    textContent: [
      content.title,
      "",
      content.body,
      "",
      `${content.action}: ${verificationUrl}`,
      "",
      content.ignore,
      "",
      content.footer,
    ].join("\n"),
    htmlContent: `<!doctype html>
<html lang="${locale}">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;background:#f4f5f7;color:#111827;font-family:Inter,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(content.preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f5f7;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;">
          <tr><td style="height:5px;background:#2f9fba;"></td></tr>
          <tr><td style="padding:34px 38px 12px;">
            <div style="font-size:20px;font-weight:750;letter-spacing:-0.5px;color:#111827;">Safirdex</div>
            <div style="margin-top:24px;font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#2f9fba;">${escapeHtml(content.eyebrow)}</div>
            <h1 style="margin:8px 0 0;font-size:30px;line-height:1.15;letter-spacing:-0.9px;color:#111827;">${escapeHtml(content.title)}</h1>
          </td></tr>
          <tr><td style="padding:12px 38px 34px;">
            <p style="margin:0;font-size:15px;line-height:1.7;color:#4b5563;">${escapeHtml(content.body)}</p>
            <a href="${safeUrl}" style="display:inline-block;margin-top:26px;padding:13px 20px;border-radius:10px;background:#111827;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">${escapeHtml(content.action)}</a>
            <div style="margin-top:28px;padding-top:22px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;">${escapeHtml(content.fallback)}</p>
              <p style="margin:8px 0 0;word-break:break-all;font-size:11px;line-height:1.55;color:#2f9fba;">${safeUrl}</p>
            </div>
            <p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#9ca3af;">${escapeHtml(content.ignore)}</p>
          </td></tr>
          <tr><td style="padding:18px 38px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;">${escapeHtml(content.footer)}</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`,
  };
}

export function createVerificationPageUrl(
  firebaseVerificationUrl: string,
  locale: AppLocale,
) {
  const firebaseUrl = new URL(firebaseVerificationUrl);
  const actionCode = firebaseUrl.searchParams.get("oobCode");
  if (!actionCode) throw new Error("FIREBASE_VERIFICATION_CODE_MISSING");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://safirdex.xyz";
  const verificationUrl = new URL(`/${locale}/verify-email`, siteUrl);
  verificationUrl.searchParams.set("oobCode", actionCode);
  return verificationUrl.toString();
}

export async function sendVerificationEmail({
  email,
  locale,
  verificationUrl,
}: {
  email: string;
  locale: AppLocale;
  verificationUrl: string;
}) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("BREVO_API_KEY_MISSING");

  const senderEmail = process.env.BREVO_SENDER_EMAIL ?? "contact@safirdex.xyz";
  const senderName = process.env.BREVO_SENDER_NAME ?? "Safirdex";
  const message = renderVerificationEmail(locale, verificationUrl);
  const response = await fetch(BREVO_TRANSACTIONAL_EMAIL_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      replyTo: { email: senderEmail, name: senderName },
      to: [{ email }],
      subject: message.subject,
      htmlContent: message.htmlContent,
      textContent: message.textContent,
      tags: ["account-verification"],
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`BREVO_EMAIL_FAILED_${response.status}`);
  }
}
