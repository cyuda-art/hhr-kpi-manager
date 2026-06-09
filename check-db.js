const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const kpiNodes = await prisma.kpiNode.findMany({
    where: { projectId: 'cmq6galaxy000004ldpfkqwzpo' } // The ID from the screenshot url
  });
  console.log(kpiNodes.map(n => ({ id: n.id, name: n.name, type: n.type })));
}

check().catch(console.error).finally(() => prisma.$disconnect());
