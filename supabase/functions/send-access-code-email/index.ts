// supabase/functions/send-access-code-email/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Optional CORS hardening: restrict to your site if ALLOWED_ORIGIN is set
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Optional origin check (blocks other sites if ALLOWED_ORIGIN set)
    const origin = req.headers.get("origin") ?? "";
    if (ALLOWED_ORIGIN !== "*" && origin !== ALLOWED_ORIGIN) {
      return new Response(JSON.stringify({ error: "Forbidden origin" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and validate payload (matches what your Purchase page sends)
    const { email, accessCode, gameTitle, customerName, startLocationLabel, startLocationUrl } = await req.json();

    if (!email || !accessCode || !gameTitle) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: email, accessCode, gameTitle",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("FROM_EMAIL") || "Tale and Trail <noreply@taleandtrail.games>";
    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "";
    const siteUrl = Deno.env.get("SITE_URL") || "";

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "Missing RESEND_API_KEY" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const subjectUser = `Your Access Code for ${gameTitle}`;
    const htmlUser = `
      <!doctype html>
      <html><body style="font-family:Arial,sans-serif;color:#111;padding:20px">
        <h2>🎮 Tale and Trail</h2>
        <p>Hello${customerName ? ` ${customerName}` : ""},</p>
        <p>Thanks for purchasing <strong>${gameTitle}</strong>!</p>
        <p>Your unique access code:</p>
        <div style="background:#10b981;color:#fff;font-weight:700;font-size:28px;letter-spacing:4px;padding:16px;border-radius:8px;text-align:center;margin:16px 0;">
          ${accessCode}
        </div>
        <p>Start playing here: <a href="${siteUrl}/play">${siteUrl}/play</a></p>
        <p><small>Valid for 12 hours from first use.</small></p>
        ${startLocationLabel || startLocationUrl ? `
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <h3 style="margin:0 0 8px 0">Starting location</h3>
          ${startLocationLabel ? `<p style=\"margin:4px 0\">${startLocationLabel}</p>` : ''}
          ${startLocationUrl ? `<p style=\"margin:4px 0\"><a href=\"${startLocationUrl}\">Open in Google Maps</a></p>` : ''}
        ` : ''}
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#666;font-size:12px">If you didn’t make this purchase, please contact support.</p>
      </body></html>
    `;
    const textUser = `Hello${customerName ? ` ${customerName}` : ""},

Thanks for purchasing ${gameTitle}!

Your access code: ${accessCode}

Start playing: ${siteUrl}/play

Valid for 12 hours from first use.

${startLocationLabel || startLocationUrl ? `Starting location:
${startLocationLabel ? `${startLocationLabel}\n` : ''}${startLocationUrl ? `${startLocationUrl}\n` : ''}` : ''}`;

    // helper to send via Resend
    async function sendResendEmail(to: string, subject: string, html: string, text?: string) {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail, // e.g., "Tale and Trail <noreply@taleandtrail.games>"
          to,
          subject,
          html,
          text,
        }),
      });

      const body = await resp.json();
      if (!resp.ok) {
        console.error("Resend error:", body);
        throw new Error(body?.error?.message || "Failed to send via Resend");
      }
      return body; // includes { id: ... }
    }

    // 1) Send to buyer
    const userResult = await sendResendEmail(email, subjectUser, htmlUser, textUser);

    // 2) Notify you (admin) — optional (only if ADMIN_EMAIL set)
    if (adminEmail) {
      const subjectAdmin = `New purchase: ${gameTitle} (${email})`;
      const htmlAdmin = `
        <!doctype html>
        <html><body style="font-family:Arial,sans-serif;color:#111;padding:20px">
          <h3>New Tale and Trail purchase</h3>
          <p><strong>Game:</strong> ${gameTitle}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Access code:</strong> <code>${accessCode}</code></p>
          <p>Sent to buyer successfully (Resend id: ${userResult.id}).</p>
        </body></html>
      `;
      await sendResendEmail(adminEmail, subjectAdmin, htmlAdmin);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge Function error:", err);
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
