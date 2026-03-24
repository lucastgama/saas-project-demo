import PDFDocument from "pdfkit";
import { Sale } from "@/lib/types";

const paymentLabel: Record<string, string> = {
  cash: "Dinheiro",
  card: "Cartao",
  pix: "Pix",
};

const periodLabel: Record<string, string> = {
  dia: "Hoje",
  semana: "Esta Semana",
  mes: "Este Mes",
  ano: "Este Ano",
};

function fmt(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export async function POST(req: Request) {
  const { sales, period }: { sales: Sale[]; period: string } = await req.json();

  const totalRevenue = sales.reduce((s, v) => s + v.total, 0);
  const avgTicket = sales.length > 0 ? totalRevenue / sales.length : 0;

  const paymentCounts: Record<string, { count: number; total: number }> = {};
  for (const s of sales) {
    const k = s.paymentMethod;
    if (!paymentCounts[k]) paymentCounts[k] = { count: 0, total: 0 };
    paymentCounts[k].count++;
    paymentCounts[k].total += s.total;
  }

  return new Promise<Response>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => {
      resolve(
        new Response(Buffer.concat(chunks), {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="relatorio-vendas-${period}.pdf"`,
          },
        }),
      );
    });
    doc.on("error", reject);

    doc
      .fontSize(22)
      .fillColor("#1e40af")
      .text("Relatorio de Vendas", { align: "center" });

    doc
      .fontSize(12)
      .fillColor("#64748b")
      .text(`Periodo: ${periodLabel[period] ?? period}`, { align: "center" });

    doc
      .fontSize(10)
      .fillColor("#94a3b8")
      .text(
        `Gerado em: ${new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}`,
        { align: "center" },
      );

    doc.moveDown(1.5);

    doc
      .fontSize(13)
      .fillColor("#1e293b")
      .text("Resumo Geral", { underline: true });
    doc.moveDown(0.5);

    const summaryRows = [
      ["Total de Vendas", String(sales.length)],
      ["Receita Total", fmt(totalRevenue)],
      ["Ticket Medio", fmt(avgTicket)],
    ];
    for (const [label, value] of summaryRows) {
      doc
        .fontSize(11)
        .fillColor("#374151")
        .text(`${label}:`, { continued: true, width: 220 })
        .fillColor("#1e40af")
        .text(` ${value}`);
    }

    doc.moveDown(1.5);

    doc
      .fontSize(13)
      .fillColor("#1e293b")
      .text("Vendas por Metodo de Pagamento", { underline: true });
    doc.moveDown(0.5);

    for (const [method, data] of Object.entries(paymentCounts)) {
      doc
        .fontSize(11)
        .fillColor("#374151")
        .text(`${paymentLabel[method] ?? method}: `, { continued: true })
        .fillColor("#1e40af")
        .text(`${data.count} venda(s) — ${fmt(data.total)}`);
    }

    doc.moveDown(1.5);

    doc
      .fontSize(13)
      .fillColor("#1e293b")
      .text("Ultimas Vendas", { underline: true });
    doc.moveDown(0.5);

    const displaySales = sales.slice(0, 50);
    for (const sale of displaySales) {
      const date = new Date(sale.createdAt).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      const items = sale.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ");

      doc
        .fontSize(10)
        .fillColor("#374151")
        .text(`${date}  |  ${paymentLabel[sale.paymentMethod] ?? sale.paymentMethod}  |  ${fmt(sale.total)}`, {
          continued: false,
        });
      doc
        .fontSize(9)
        .fillColor("#94a3b8")
        .text(`   ${items}`);
      doc.moveDown(0.3);
    }

    if (sales.length > 50) {
      doc
        .fontSize(9)
        .fillColor("#94a3b8")
        .text(`... e mais ${sales.length - 50} venda(s).`);
    }

    doc.end();
  });
}
