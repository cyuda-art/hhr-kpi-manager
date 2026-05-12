import re

file_path = "src/app/[orgId]/projects/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace getDoc org to get all frameworks
old_org = """      const orgRef = doc(db, 'organizations', currentOrgId);
      const orgSnap = await getDoc(orgRef);
      const masterMvv = orgSnap.exists() ? orgSnap.data().masterMvv : '';"""

new_org = """      const orgRef = doc(db, 'organizations', currentOrgId);
      const orgSnap = await getDoc(orgRef);
      const orgData = orgSnap.exists() ? orgSnap.data() : {};
      const masterMvv = orgData.masterMvv || '';
      const orgContext = {
        pest: orgData.pest || '',
        fiveForces: orgData.fiveForces || '',
        vrio: orgData.vrio || '',
        industry: orgData.industry || ''
      };"""

content = content.replace(old_org, new_org)

# Pass orgContext to fetch
old_fetch = """        body: JSON.stringify({
          masterMvv,
          kgiType: finalKgiType,
          kgiTargetValue: Number(kgiTargetValue) || 0,
          projectUrl,
          customInstructions, // 追加指示
          fileUrls: urls // アップロードファイル
        })"""

new_fetch = """        body: JSON.stringify({
          masterMvv,
          orgContext,
          kgiType: finalKgiType,
          kgiTargetValue: Number(kgiTargetValue) || 0,
          projectUrl,
          customInstructions, // 追加指示
          fileUrls: urls // アップロードファイル
        })"""

content = content.replace(old_fetch, new_fetch)

# Store SWOT and CrossSWOT data received from API
old_store = """      if (data.manifestos && data.manifestos.length > 0) {
        setManifestos(data.manifestos);
        setEditableManifesto(data.manifestos[0]);
        setWizardStep('select_manifesto');
      }"""

new_store = """      if (data.manifestos && data.manifestos.length > 0) {
        setManifestos(data.manifestos);
        setEditableManifesto(data.manifestos[0]);
        // SWOT/CrossSWOTのデータを保存
        if (data.swot) sessionStorage.setItem('temp_swot', data.swot);
        if (data.crossSwot) sessionStorage.setItem('temp_crossSwot', data.crossSwot);
        setWizardStep('select_manifesto');
      }"""

content = content.replace(old_store, new_store)

# Update Project creation with swot/crossSwot
old_project_create = """      const newId = await createProject(projectName, projectUrl, user.uid, currentOrgId, {
        description: projectUrl,
        manifesto: editableManifesto ? `${editableManifesto.title}\\n${editableManifesto.description}` : '', 
        kgiType: finalKgiType, 
        kgiPeriod,
        kgiTargetValue: Number(kgiTargetValue) || 0, 
        businessModelType
      });"""

new_project_create = """      const swot = sessionStorage.getItem('temp_swot') || '';
      const crossSwot = sessionStorage.getItem('temp_crossSwot') || '';

      const newId = await createProject(projectName, projectUrl, user.uid, currentOrgId, {
        description: projectUrl,
        manifesto: editableManifesto ? `${editableManifesto.title}\\n${editableManifesto.description}` : '', 
        kgiType: finalKgiType, 
        kgiPeriod,
        kgiTargetValue: Number(kgiTargetValue) || 0, 
        businessModelType,
        swot,
        crossSwot
      });
      
      sessionStorage.removeItem('temp_swot');
      sessionStorage.removeItem('temp_crossSwot');"""

content = content.replace(old_project_create, new_project_create)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
