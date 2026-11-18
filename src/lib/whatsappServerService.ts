import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import pino from "pino";
import prisma from "@/lib/prisma";

export type WhatsAppStatus =
  | "DISCONNECTED"
  | "CONNECTING"
  | "SCAN_QR"
  | "WAITING_FOR_PAIRING"
  | "READY";

interface WhatsAppGlobalState {
  sock: any | null;
  status: WhatsAppStatus;
  qr: string | null;
  pairingCode: string | null;
  phone: string;
  lastHeartbeat: Date | null;
  lastDisconnectReason: string | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _wa_state: WhatsAppGlobalState | undefined;
  // eslint-disable-next-line no-var
  var _wa_dedupe: Map<string, number> | undefined;
}

// 1. Server-side Singleton State
if (!global._wa_state) {
  global._wa_state = {
    sock: null,
    status: "DISCONNECTED",
    qr: null,
    pairingCode: null,
    phone: "",
    lastHeartbeat: null,
    lastDisconnectReason: null,
  };
}
const state = global._wa_state;

if (!global._wa_dedupe) {
  global._wa_dedupe = new Map<string, number>();
}
const deduplicationCache = global._wa_dedupe;

// Check duplicate sends within window (default 30s)
export function isDuplicateMessage(dedupeKey: string, windowMs = 30000): boolean {
  if (!dedupeKey) return false;
  const now = Date.now();
  const lastTime = deduplicationCache.get(dedupeKey);
  if (lastTime && now - lastTime < windowMs) {
    return true;
  }
  deduplicationCache.set(dedupeKey, now);
  // Periodic cleanup
  if (deduplicationCache.size > 1000) {
    for (const [key, timestamp] of deduplicationCache.entries()) {
      if (now - timestamp > 60000) deduplicationCache.delete(key);
    }
  }
  return false;
}

// 2. Cloud Database Session Persistence (Turso / SQLite / PostgreSQL)
export async function restoreSessionFromDB(authDir: string): Promise<boolean> {
  try {
    const credsPath = path.join(authDir, "creds.json");
    if (fs.existsSync(credsPath)) {
      return true;
    }

    const account = await prisma.whatsAppAccount.findFirst({
      where: { accountType: "COMPANY_CENTRAL" },
    });

    if (account?.sessionBundle) {
      const bundle = JSON.parse(account.sessionBundle);
      for (const [filename, content] of Object.entries(bundle)) {
        const filePath = path.join(authDir, filename);
        fs.writeFileSync(filePath, content as string, "utf8");
      }
      console.log(`[WhatsApp Service] Successfully restored session credentials bundle from database.`);
      return true;
    }
  } catch (error: any) {
    console.warn(`[WhatsApp Service] Session restore note:`, error.message);
  }
  return false;
}

export async function saveSessionToDB(authDir: string): Promise<void> {
  try {
    if (!fs.existsSync(authDir)) return;
    const files = fs.readdirSync(authDir);
    const bundle: Record<string, string> = {};

    for (const file of files) {
      const fullPath = path.join(authDir, file);
      if (fs.statSync(fullPath).isFile()) {
        bundle[file] = fs.readFileSync(fullPath, "utf8");
      }
    }

    if (Object.keys(bundle).length === 0) return;

    await prisma.whatsAppAccount.upsert({
      where: { id: "abecsa-central-whatsapp" },
      update: {
        sessionBundle: JSON.stringify(bundle),
        connectionStatus: state.status === "READY" ? "CONNECTED" : "PAIRING_QR",
        phoneNumber: state.phone || undefined,
        lastHeartbeat: new Date(),
      },
      create: {
        id: "abecsa-central-whatsapp",
        accountType: "COMPANY_CENTRAL",
        connectionStatus: state.status === "READY" ? "CONNECTED" : "PAIRING_QR",
        phoneNumber: state.phone || "+91 98765 43210",
        sessionBundle: JSON.stringify(bundle),
        lastHeartbeat: new Date(),
      },
    });

    console.log(`[WhatsApp Service] Saved session bundle (${Object.keys(bundle).length} files) to cloud database.`);
  } catch (error: any) {
    console.warn(`[WhatsApp Service] Session save note:`, error.message);
  }
}

// 3. Socket Initialization with Dual Mode (QR + 8-Digit Pairing Code)
export async function initWhatsAppSocket({
  phoneForPairing = null as string | null,
  forceNew = false,
}: {
  phoneForPairing?: string | null;
  forceNew?: boolean;
} = {}): Promise<any> {
  if (state.sock && !forceNew && state.status === "READY") {
    return state.sock;
  }

  const authDir = path.join(process.cwd(), ".whatsapp_session");
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  await restoreSessionFromDB(authDir);

  const { state: authState, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();

  state.status = "CONNECTING";
  state.lastHeartbeat = new Date();

  const sock = makeWASocket({
    version,
    auth: {
      creds: authState.creds,
      keys: makeCacheableSignalKeyStore(authState.keys, pino({ level: "silent" })),
    },
    logger: pino({ level: "silent" }) as any,
    printQRInTerminal: false,
    generateHighQualityLinkPreview: true,
    browser: ["ABECSA Enterprise Cockpit", "Chrome", "24.0.0"],
  });

  state.sock = sock;

  // 8-Digit Pairing Code Mode (No camera scan required)
  if (!sock.authState.creds.registered && phoneForPairing) {
    const cleanNumber = phoneForPairing.replace(/\D/g, "");
    state.phone = cleanNumber;
    setTimeout(async () => {
      try {
        state.status = "WAITING_FOR_PAIRING";
        const code = await sock.requestPairingCode(cleanNumber);
        state.pairingCode = code?.match(/.{1,4}/g)?.join("-") || code;
        console.log(`[WhatsApp Service] Pairing Code generated for ${cleanNumber}: ${state.pairingCode}`);
      } catch (err: any) {
        console.error("[WhatsApp Service] Pairing code error:", err?.message || err);
      }
    }, 2500);
  }

  // Socket Connection Updates & QR Handler
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        state.qr = await QRCode.toDataURL(qr);
        state.status = "SCAN_QR";
        await prisma.whatsAppAccount.upsert({
          where: { id: "abecsa-central-whatsapp" },
          update: { qrCode: state.qr, connectionStatus: "PAIRING_QR", lastHeartbeat: new Date() },
          create: {
            id: "abecsa-central-whatsapp",
            accountType: "COMPANY_CENTRAL",
            connectionStatus: "PAIRING_QR",
            qrCode: state.qr,
            lastHeartbeat: new Date(),
          },
        });
      } catch (e: any) {
        console.error("QR render error:", e.message);
      }
    }

    if (connection === "open") {
      state.status = "READY";
      state.qr = null;
      state.pairingCode = null;
      state.lastHeartbeat = new Date();
      state.lastDisconnectReason = null;

      const userJid = sock.user?.id || "";
      state.phone = userJid.split(":")[0] || state.phone || "";

      console.log(`[WhatsApp Service] Session OPEN & READY for JID: ${userJid}`);
      await saveSessionToDB(authDir);
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      state.status = "DISCONNECTED";
      state.lastDisconnectReason = (lastDisconnect?.error as any)?.message || `Code: ${statusCode}`;

      console.warn(`[WhatsApp Service] Connection closed (code: ${statusCode}, reconnect: ${shouldReconnect})`);

      if (statusCode === DisconnectReason.loggedOut) {
        // Clear files on explicit logout
        try {
          fs.rmSync(authDir, { recursive: true, force: true });
        } catch {}
        state.sock = null;
        state.qr = null;
        state.pairingCode = null;
        await prisma.whatsAppAccount.updateMany({
          where: { accountType: "COMPANY_CENTRAL" },
          data: { connectionStatus: "DISCONNECTED", sessionBundle: null, qrCode: null },
        });
      } else if (shouldReconnect) {
        setTimeout(() => {
          initWhatsAppSocket();
        }, 5000);
      }
    }
  });

  sock.ev.on("creds.update", async () => {
    await saveCreds();
    await saveSessionToDB(authDir);
  });

  return sock;
}

// 4. Getter for Current State
export function getWhatsAppServiceStatus() {
  return {
    status: state.status,
    qr: state.qr,
    pairingCode: state.pairingCode,
    phone: state.phone,
    lastHeartbeat: state.lastHeartbeat,
    lastDisconnectReason: state.lastDisconnectReason,
  };
}

// 5. Send Message / Invoice Dispatch Function with Base64 & Fallback
export async function sendWhatsAppMessage({
  phone,
  message,
  imageBase64 = null as string | null,
  pdfBase64 = null as string | null,
  fileName = "Invoice.pdf",
  dedupeKey = null as string | null,
}: {
  phone: string;
  message: string;
  imageBase64?: string | null;
  pdfBase64?: string | null;
  fileName?: string;
  dedupeKey?: string | null;
}): Promise<{
  success: boolean;
  messageId?: string;
  fallbackUrl?: string;
  error?: string;
}> {
  // Deduplication check
  if (dedupeKey && isDuplicateMessage(dedupeKey, 30000)) {
    console.warn(`[WhatsApp Service] Deduplication blocked repeated send for key: ${dedupeKey}`);
    return {
      success: true,
      error: "Duplicate message skipped (already sent within 30 seconds).",
    };
  }

  const cleanPhone = phone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const fallbackUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

  if (!state.sock || state.status !== "READY") {
    return {
      success: false,
      fallbackUrl,
      error: "WhatsApp session is currently offline. Please use the 1-click fallback link.",
    };
  }

  try {
    const jid = `${formattedPhone}@s.whatsapp.net`;
    let response: any = null;

    if (imageBase64) {
      const buffer = Buffer.from(
        imageBase64.replace(/^data:image\/\w+;base64,/, ""),
        "base64"
      );
      response = await state.sock.sendMessage(jid, {
        image: buffer,
        caption: message,
      });
    } else if (pdfBase64) {
      const buffer = Buffer.from(
        pdfBase64.replace(/^data:application\/pdf;base64,/, ""),
        "base64"
      );
      response = await state.sock.sendMessage(jid, {
        document: buffer,
        mimetype: "application/pdf",
        fileName,
        caption: message,
      });
    } else {
      response = await state.sock.sendMessage(jid, { text: message });
    }

    const messageId = response?.key?.id || `msg_${Date.now()}`;

    // Record message in database
    try {
      const account = await prisma.whatsAppAccount.findFirst({
        where: { accountType: "COMPANY_CENTRAL" },
      });
      if (account) {
        await prisma.whatsAppMessage.create({
          data: {
            accountId: account.id,
            recipientPhone: formattedPhone,
            messageType: imageBase64 || pdfBase64 ? "MEDIA" : "CUSTOM_TEXT",
            content: message,
            status: "SENT",
            messageId,
          },
        });
      }
    } catch {}

    return {
      success: true,
      messageId,
    };
  } catch (error: any) {
    console.error("[WhatsApp Service] Send error:", error.message);
    return {
      success: false,
      fallbackUrl,
      error: error.message,
    };
  }
}

// 6. Formatted POS Bill & Invoice Generator
export function formatPOSInvoiceMessage({
  companyName = "ABECSA Software Solutions",
  invoiceNumber,
  customerName,
  issueDate,
  dueDate,
  items,
  subtotal,
  taxAmount,
  totalAmount,
  amountPaid,
  balanceAmount,
  paymentMode = "UPI",
  upiId = "abecsa@okhdfcbank",
}: {
  companyName?: string;
  invoiceNumber: string;
  customerName: string;
  issueDate?: string;
  dueDate?: string;
  items: Array<{ description: string; quantity: number; amount: number }>;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceAmount: number;
  paymentMode?: string;
  upiId?: string;
}): string {
  const currency = "₹";
  const formattedItems = items
    .map((item, idx) => `  ${idx + 1}. *${item.description}* (Qty: ${item.quantity}) - ${currency}${item.amount.toLocaleString("en-IN")}`)
    .join("\n");

  const isFullPaid = balanceAmount <= 0;
  const statusBadge = isFullPaid ? "PAID / चुकता" : "PARTIAL / उधारी बाकी";

  return `*${companyName}*
🧾 *TAX INVOICE / बिल रसीद*

*बिल क्र.*: #${invoiceNumber}
*ग्राहक*: ${customerName}
*दिनांक*: ${issueDate || new Date().toLocaleDateString("en-IN")}
*स्थिति*: [${statusBadge}]

━━━━━━━━━━━━━━━━━━━━━
📋 *आइटम विवरण (Items):*
${formattedItems}
━━━━━━━━━━━━━━━━━━━━━

*उप-योग (Subtotal)*: ${currency}${subtotal.toLocaleString("en-IN")}
*GST (18%)*: ${currency}${taxAmount.toLocaleString("en-IN")}
*कुल योग (Total)*: *${currency}${totalAmount.toLocaleString("en-IN")}*
*जमा किया (Paid via ${paymentMode})*: ${currency}${amountPaid.toLocaleString("en-IN")}
*शेष बकाया (Balance Due)*: *${currency}${balanceAmount.toLocaleString("en-IN")}*
${dueDate ? `*अंतिम देय तिथि*: ${dueDate}` : ""}

${
  balanceAmount > 0
    ? `💳 *UPI से तुरंत भुगतान करें:*
UPI ID: \`${upiId}\`
(पेमेंट पूरा होने के बाद कृपया इसी चैट पर स्क्रीनशॉट भेजें)`
    : "✅ *आपका पूरा भुगतान प्राप्त हो चुका है। धन्यवाद!*"
}

धन्यवाद!
*${companyName} टीम*
वेबसाइट: https://abecsa.site`;
}

// 7. Formatted Payment Reminder (तकादा / Overdue Notice)
export function formatPaymentReminderMessage({
  companyName = "ABECSA Software Solutions",
  customerName,
  invoiceNumber,
  balanceAmount,
  dueDate,
  upiId = "abecsa@okhdfcbank",
}: {
  companyName?: string;
  customerName: string;
  invoiceNumber: string;
  balanceAmount: number;
  dueDate: string;
  upiId?: string;
}): string {
  return `📢 *भुगतान अनुस्मारक / PAYMENT REMINDER*
प्रिय ${customerName} जी,

*${companyName}* से आपकी इनवॉइस *#${invoiceNumber}* का शेष भुगतान अभी भी लंबित है।

*बकाया राशि (Due Balance)*: *₹${balanceAmount.toLocaleString("en-IN")}*
*अंतिम तिथि (Due Date)*: ${dueDate}

कृपया किसी भी सेवा में रुकावट से बचने के लिए नीचे दिए गए UPI विवरण पर शीघ्र भुगतान करने की कृपा करें:

💳 *UPI ID*: \`${upiId}\`

भुगतान के उपरांत कृपया स्क्रीनशॉट साझा करें ताकि आपके खाते में प्रविष्टि की जा सके।

धन्यवाद,
*${companyName} लेखा एवं ग्राहक विभाग*`;
}

// 8. Logout & Clear
export async function logoutWhatsApp(): Promise<void> {
  try {
    if (state.sock) {
      await state.sock.logout();
    }
  } catch {}

  state.sock = null;
  state.status = "DISCONNECTED";
  state.qr = null;
  state.pairingCode = null;
  state.phone = "";

  const authDir = path.join(process.cwd(), ".whatsapp_session");
  if (fs.existsSync(authDir)) {
    fs.rmSync(authDir, { recursive: true, force: true });
  }

  await prisma.whatsAppAccount.updateMany({
    where: { accountType: "COMPANY_CENTRAL" },
    data: {
      connectionStatus: "DISCONNECTED",
      sessionBundle: null,
      qrCode: null,
    },
  });

  console.log(`[WhatsApp Service] Logged out and session cleared.`);
}
