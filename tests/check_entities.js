const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  const prjs = await p.project.findMany({ select: { id: true, name: true, customerId: true, managerId: true }, take: 5 });
  const invs = await p.invoice.findMany({ select: { id: true, invoiceNumber: true, customerId: true, totalAmount: true, status: true }, take: 5 });
  const qts = await p.quotation.findMany({ select: { id: true, quotationNumber: true, customerId: true, totalAmount: true, status: true }, take: 5 });
  console.log("Projects:", prjs);
  console.log("Invoices:", invs);
  console.log("Quotations:", qts);
}

main().finally(() => p.$disconnect());
