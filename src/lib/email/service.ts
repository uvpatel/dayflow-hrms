/**
 * Transactional email service for Dayflow HRMS.
 * In development or when no provider API key is set, it safely logs
 * the action and links to the console for easy verification without crashing.
 */

export interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; messageId?: string }> {
  const emailProviderKey = process.env.EMAIL_PROVIDER_API_KEY;
  const emailProviderUrl = process.env.EMAIL_PROVIDER_API_URL;
  const emailFrom = process.env.EMAIL_FROM || "notifications@dayflow.dev";

  if (!emailProviderKey || !emailProviderUrl) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Transactional email is not configured. Set EMAIL_PROVIDER_API_URL and EMAIL_PROVIDER_API_KEY."
      );
    }

    // Development-only link logger. Verification and reset tokens must never
    // be written to production logs.
    console.log("================== [TRANSACTIONAL EMAIL] ==================");
    console.log(`From: ${emailFrom}`);
    console.log(`To:   ${payload.to}`);
    console.log(`Subj: ${payload.subject}`);
    console.log("Body:");
    console.log(payload.text);
    if (payload.html) {
      console.log("HTML Preview (rendered):", payload.html.slice(0, 300) + "...");
    }
    console.log("==========================================================");
    return { success: true, messageId: `dev-${Date.now()}` };
  }

  const response = await fetch(emailProviderUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${emailProviderKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      ...(payload.html ? { html: payload.html } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Transactional email provider rejected the request (${response.status}).`,
    );
  }

  const result = (await response.json().catch(() => null)) as
    | { id?: string; messageId?: string }
    | null;

  return {
    success: true,
    messageId: result?.id ?? result?.messageId,
  };
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character] ?? character
  );
}

export async function sendVerificationEmail(email: string, verificationUrl: string, name?: string) {
  const safeName = escapeHtml(name || "there");
  const safeUrl = escapeHtml(verificationUrl);
  return sendEmail({
    to: email,
    subject: "Verify your Dayflow HRMS account",
    text: `Hello ${name || "there"},\n\nPlease verify your email address by visiting the following link:\n${verificationUrl}\n\nThis link will expire shortly.\n\nBest regards,\nDayflow HRMS Team`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4f46e5;">Welcome to Dayflow HRMS</h2>
        <p>Hello ${safeName},</p>
        <p>Please click the button below to verify your email address and activate your account:</p>
        <a href="${safeUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">Verify Email Address</a>
        <p style="color: #666; font-size: 14px;">Or copy and paste this URL into your browser: <br/><a href="${safeUrl}">${safeUrl}</a></p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">Dayflow — Every workday, perfectly aligned.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string, name?: string) {
  const safeName = escapeHtml(name || "there");
  const safeUrl = escapeHtml(resetUrl);
  return sendEmail({
    to: email,
    subject: "Reset your Dayflow HRMS password",
    text: `Hello ${name || "there"},\n\nYou requested to reset your password. Visit the link below to set a new password:\n${resetUrl}\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nDayflow HRMS Team`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4f46e5;">Dayflow Password Reset</h2>
        <p>Hello ${safeName},</p>
        <p>You requested a password reset. Click the button below to choose a new password:</p>
        <a href="${safeUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">Reset Password</a>
        <p style="color: #666; font-size: 14px;">Or copy and paste this URL into your browser: <br/><a href="${safeUrl}">${safeUrl}</a></p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">Dayflow — Every workday, perfectly aligned.</p>
      </div>
    `,
  });
}
