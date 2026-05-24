import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
async function main() {
  const orgId = 'dummy-org-id';
  try {
    console.log('1. Upserting Organization...');
    await prisma.organization.upsert({
      where: { id: orgId },
      update: {},
      create: {
        id: orgId,
        name: 'My Organization',
      },
    });

    console.log('2. Creating Project...');
    const project = await prisma.project.create({
      data: {
        name: 'Test Project',
        description: 'Testing DB',
        organizationId: orgId,
      },
    });
    console.log('Project created:', project.id);

    console.log('3. Upserting KpiNode...');
    const nodeId = 'node_test_123';
    await prisma.$transaction(async (tx) => {
      await tx.kpiNode.upsert({
        where: { id: nodeId },
        create: {
          id: nodeId,
          projectId: project.id,
          name: 'Test KPI',
          type: 'KPI',
          unit: '円',
          actualValue: 0,
          targetValue: 0,
          isCalculated: false,
          aggregationType: 'sum',
        },
        update: {
          name: 'Test KPI',
          type: 'KPI',
        },
      });
    });
    console.log('KpiNode upserted:', nodeId);

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
