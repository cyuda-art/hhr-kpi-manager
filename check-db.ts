const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projectId = 'cmpgwly0s000004kw4bn2ku27'; // from screenshot URL
  const nodes = await prisma.kpiNode.findMany({
    where: { projectId: projectId }
  });
  console.log(`Found ${nodes.length} nodes for project ${projectId}:`);
  nodes.forEach(n => {
    console.log(`- ID: ${n.id}, Name: ${n.name}, Type: ${n.type}, Parent: ${n.parentId}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
