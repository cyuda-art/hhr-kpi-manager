import 'dotenv/config';
import { POST } from '../src/app/api/projects/[projectId]/kpi-data/route';
import { prisma } from '../src/lib/prisma';

async function main() {
  const orgId = 'dummy-org-id';
  let project;
  try {
    await prisma.organization.upsert({
      where: { id: orgId },
      update: {},
      create: { id: orgId, name: 'My Organization' },
    });
    project = await prisma.project.create({
      data: { name: 'Test AI Project', organizationId: orgId },
    });
    console.log('Project created:', project.id);
  } catch (e) {
    console.error('Error creating project:', e);
    return;
  }

  // AI-like payload
  const payload = {
    kpiData: {
      "node_vision": {
        "id": "node_vision",
        "name": "VISION",
        "type": "VISION",
        "parentId": null,
        "isCalculated": false
      },
      "node_mission": {
        "id": "node_mission",
        "name": "MISSION",
        "type": "MISSION",
        "parentId": "node_vision",
        "isCalculated": false
      },
      "node_goal": {
        "id": "node_goal",
        "name": "GOAL",
        "type": "GOAL",
        "parentId": "node_mission",
        "isCalculated": false
      },
      "node_kgi": {
        "id": "node_kgi",
        "name": "KGI",
        "type": "KGI",
        "parentId": "node_goal",
        "isCalculated": true,
        "formula": "#{node_ksf1} + #{node_ksf2}"
      },
      "node_ksf1": {
        "id": "node_ksf1",
        "name": "KSF1",
        "type": "KSF",
        "parentId": "node_kgi",
        "isCalculated": false
      }
    },
    actions: []
  };

  const request = new Request(`http://localhost:3000/api/projects/${project.id}/kpi-data`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const response = await POST(request, { params: Promise.resolve({ projectId: project.id }) });
  const data = await response.json();
  console.log('Response Status:', response.status);
  console.log('Response Data:', data);

  // Clean up
  await prisma.project.delete({ where: { id: project.id } });
  await prisma.$disconnect();
}

main();
