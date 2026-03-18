import type { Context, Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import PDFDocument from "pdfkit";

const supabaseAdmin = createClient(
  Netlify.env.get("SUPABASE_URL") || "",
  Netlify.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async (req: Request, context: Context) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Auth check
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return new Response("Non autorise", { status: 401 });
  }
  const token = authHeader.replace("Bearer ", "");
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) {
    return new Response("Non autorise", { status: 401 });
  }

  // Get enrollment data
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const { data: enrollment } = await supabaseAdmin
    .from("enrollments")
    .select("product_type, amount_paid, stripe_session_id, created_at")
    .eq("user_id", user.id)
    .single();

  if (!enrollment) {
    return new Response("Aucune inscription trouvee", { status: 404 });
  }

  const customerName = profile?.full_name || profile?.email || user.email || "";
  const customerEmail = profile?.email || user.email || "";
  const amount = (enrollment.amount_paid || 0) / 100;
  const date = new Date(enrollment.created_at);
  const invoiceNumber = `KPE-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${user.id.substring(0, 6).toUpperCase()}`;
  const productName = enrollment.product_type === "presentiel"
    ? "Formation KPE en presentiel (8 week-ends)"
    : "Formation KPE en ligne (8 modules)";

  // Generate PDF
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const pdfReady = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  // Header
  doc.fontSize(22).font("Helvetica-Bold").fillColor("#0d4f4f")
    .text("KPE FORMATION", 50, 50);
  doc.fontSize(10).font("Helvetica").fillColor("#666666")
    .text("Kinesiologie Psycho-Energetique", 50, 78);
  doc.text("Joel Prieur Formations KPE - SAS", 50, 92);
  doc.text("2 Rue Lamartine, 15290 Parlan", 50, 106);
  doc.text("SIREN : 911 746 147", 50, 120);

  // Invoice title
  doc.fontSize(28).font("Helvetica-Bold").fillColor("#1a1a1a")
    .text("FACTURE", 400, 50, { align: "right" });
  doc.fontSize(11).font("Helvetica").fillColor("#666666")
    .text(`N° ${invoiceNumber}`, 400, 85, { align: "right" });
  doc.text(`Date : ${date.toLocaleDateString("fr-FR")}`, 400, 100, { align: "right" });

  // Separator
  doc.moveTo(50, 150).lineTo(545, 150).strokeColor("#e0e0e0").stroke();

  // Client info
  doc.fontSize(11).font("Helvetica-Bold").fillColor("#333333")
    .text("Facture a :", 50, 170);
  doc.fontSize(11).font("Helvetica").fillColor("#333333")
    .text(customerName, 50, 188);
  doc.text(customerEmail, 50, 204);

  // Table header
  const tableTop = 260;
  doc.rect(50, tableTop, 495, 30).fillColor("#0d4f4f").fill();
  doc.fontSize(10).font("Helvetica-Bold").fillColor("#ffffff")
    .text("Description", 60, tableTop + 9)
    .text("Quantite", 340, tableTop + 9)
    .text("Prix HT", 410, tableTop + 9)
    .text("Total TTC", 480, tableTop + 9);

  // Table row
  const rowTop = tableTop + 30;
  doc.rect(50, rowTop, 495, 40).fillColor("#f8f8f8").fill();
  doc.fontSize(10).font("Helvetica").fillColor("#333333")
    .text(productName, 60, rowTop + 8, { width: 270 })
    .text("1", 355, rowTop + 8)
    .text(`${amount.toFixed(2)} EUR`, 395, rowTop + 8)
    .text(`${amount.toFixed(2)} EUR`, 465, rowTop + 8);

  // Total section
  const totalTop = rowTop + 60;
  doc.moveTo(350, totalTop).lineTo(545, totalTop).strokeColor("#e0e0e0").stroke();
  doc.fontSize(11).font("Helvetica").fillColor("#666666")
    .text("Total HT :", 350, totalTop + 10)
    .text(`${amount.toFixed(2)} EUR`, 465, totalTop + 10);
  doc.text("TVA (0%) :", 350, totalTop + 28)
    .text("0.00 EUR", 465, totalTop + 28);

  doc.moveTo(350, totalTop + 48).lineTo(545, totalTop + 48).strokeColor("#0d4f4f").lineWidth(2).stroke();
  doc.fontSize(14).font("Helvetica-Bold").fillColor("#0d4f4f")
    .text("Total TTC :", 350, totalTop + 58)
    .text(`${amount.toFixed(2)} EUR`, 450, totalTop + 58);

  // Payment info
  const paymentTop = totalTop + 110;
  doc.fontSize(10).font("Helvetica-Bold").fillColor("#333333")
    .text("Informations de paiement", 50, paymentTop);
  doc.fontSize(10).font("Helvetica").fillColor("#666666")
    .text(`Paiement par carte bancaire via Stripe`, 50, paymentTop + 18)
    .text(`Reference : ${enrollment.stripe_session_id || "N/A"}`, 50, paymentTop + 34)
    .text(`Statut : Paye`, 50, paymentTop + 50);

  // TVA note
  const noteTop = paymentTop + 85;
  doc.rect(50, noteTop, 495, 40).fillColor("#f0f9f9").fill();
  doc.fontSize(9).font("Helvetica").fillColor("#0d4f4f")
    .text("TVA non applicable, article 293 B du Code General des Impots (regime de franchise en base de TVA).", 60, noteTop + 8, { width: 475 })
    .text("Formation professionnelle continue - organisme de formation declare.", 60, noteTop + 22);

  // Footer
  doc.fontSize(8).font("Helvetica").fillColor("#999999")
    .text("Joel Prieur Formations KPE - SAS au capital de 1 000 EUR", 50, 750, { align: "center" })
    .text("SIREN 911 746 147 - RCS Aurillac", 50, 762, { align: "center" })
    .text("2 Rue Lamartine, 15290 Parlan - formation.kpe@gmail.com", 50, 774, { align: "center" });

  doc.end();
  const pdfBuffer = await pdfReady;

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Facture-${invoiceNumber}.pdf"`,
      "Cache-Control": "no-cache",
    },
  });
};

export const config: Config = {
  path: "/api/invoice",
};
