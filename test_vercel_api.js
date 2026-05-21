async function runTests() {
  const baseUrl = 'https://hhr-kpi-manager.vercel.app';
  const testUserId = 'system_test_' + Date.now();
  console.log("Starting End-to-End API Test against Vercel...");

  try {
    // 1. Create Organization
    console.log(`\n[1] Testing POST /api/organizations ...`);
    let res = await fetch(`${baseUrl}/api/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'E2E Test Org', userId: testUserId, email: `${testUserId}@example.com` })
    });
    
    if (!res.ok) {
      console.error("FAIL: POST /api/organizations returned", res.status, await res.text());
      return;
    }
    const org = await res.json();
    console.log("SUCCESS: Created Organization with ID:", org.id);

    // 2. Update Organization Settings
    console.log(`\n[2] Testing PUT /api/organizations/${org.id} ...`);
    res = await fetch(`${baseUrl}/api/organizations/${org.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ managementPhilosophy: 'Test Philosophy' })
    });
    if (!res.ok) {
      console.error("FAIL: PUT /api/organizations returned", res.status, await res.text());
      return;
    }
    const updatedOrg = await res.json();
    console.log("SUCCESS: Updated Organization:", updatedOrg.managementPhilosophy);

    // 3. Create Project
    console.log(`\n[3] Testing POST /api/projects ...`);
    res = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'E2E Test Project', description: 'Testing', organizationId: org.id })
    });
    if (!res.ok) {
      console.error("FAIL: POST /api/projects returned", res.status, await res.text());
      return;
    }
    const project = await res.json();
    console.log("SUCCESS: Created Project with ID:", project.project.id);

    // 4. Delete Project (Cleanup)
    console.log(`\n[4] Testing DELETE /api/projects/${project.project.id} ...`);
    res = await fetch(`${baseUrl}/api/projects/${project.project.id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      console.error("FAIL: DELETE /api/projects returned", res.status, await res.text());
      return;
    }
    console.log("SUCCESS: Deleted Project.");

    console.log("\nALL CORE API TESTS PASSED SUCCESSFULLY!");
  } catch (err) {
    console.error("Test execution failed:", err);
  }
}
runTests();
