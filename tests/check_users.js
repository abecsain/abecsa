const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  const users = await p.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      customerProfile: { select: { id: true, companyName: true } },
    },
  });
  console.log(JSON.stringify(users, null, 2));
}

main().finally(() => p.$disconnect());
