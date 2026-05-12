import re

file_path = "src/app/[orgId]/projects/page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# find start and end of handleCreateProject
start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if "const handleCreateProject = async" in line:
        start_idx = i
    if "const handleDuplicate = async" in line:
        end_idx = i - 1
        break

if start_idx != -1 and end_idx != -1:
    new_func = """  const handleGenerateManifestos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectUrl || !kgiTargetValue) return;

    try {
      setWizardStep('generating_manifestos');
      setUploadStatus('Master MVVと事業特性に基づく戦略アプローチを推論中...');

      const orgRef = doc(db, 'organizations', currentOrgId!);
      const orgSnap = await getDoc(orgRef);
      const masterMvv = orgSnap.exists() ? orgSnap.data().masterMvv : '';

      const finalKgiType = kgiType === 'その他' && customKgiType.trim() !== '' ? customKgiType : kgiType;

      const res = await fetch('/api/generate-manifesto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterMvv,
          kgiType: finalKgiType,
          kgiTargetValue: Number(kgiTargetValue) || 0,
          projectUrl
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate manifesto');

      if (data.manifestos && data.manifestos.length > 0) {
        setManifestos(data.manifestos);
        setEditableManifesto(data.manifestos[0]);
        setWizardStep('select_manifesto');
      } else {
        throw new Error('マニフェストが生成されませんでした');
      }
    } catch (error) {
      console.error(error);
      alert('エラーが発生しました');
      setWizardStep('input');
    }
  };

  const handleGenerateTree = async () => {
    if (!user || !projectUrl) return;

    const finalKgiType = kgiType === 'その他' && customKgiType.trim() !== '' ? customKgiType : kgiType;
    const projectName = `${finalKgiType} ${kgiTargetValue ? Number(kgiTargetValue).toLocaleString() : ''}達成プロジェクト`;

    try {
      setWizardStep('generating_tree');
      if (!currentOrgId) throw new Error("No organization selected");

      setUploadStatus('ファイルをアップロード中...');
      const uploadedFiles: { url: string; path: string; mimeType: string }[] = [];
      
      // 1. ファイルのアップロード処理
      for (const file of selectedFiles) {
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name}は5MBを超えているためアップロードできません。`);
          setWizardStep('select_manifesto');
          return;
        }
        const fileRef = ref(storage, `organizations/${currentOrgId}/temp_uploads/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        uploadedFiles.push({ url, path: fileRef.fullPath, mimeType: file.type });
      }

      setUploadStatus('過去のアーカイブ資産を走査中...');
      const archivedKpis: any[] = [];
      try {
        // 全プロジェクトの kpiData をフェッチしてアーカイブ済みKPIを収集
        for (const project of projects) {
          const kpiDataDoc = await getDoc(doc(db, 'organizations', currentOrgId, 'projects', project.id, 'kpiData', 'main'));
          if (kpiDataDoc.exists()) {
            const data = kpiDataDoc.data();
            if (data.kpiData) {
              Object.values(data.kpiData).forEach((k: any) => {
                if (k.isArchived) {
                  archivedKpis.push({
                    id: k.id,
                    projectId: project.id,
                    name: k.name,
                    qualitativeName: k.qualitativeName,
                    unit: k.unit,
                    type: k.type
                  });
                }
              });
            }
          }
        }
      } catch (e) {
        console.warn('Failed to fetch archived KPIs', e);
      }

      setUploadStatus('AIが選択された作戦に基づきKPIツリーを構築中...');

      // 2. APIを呼んでKPIツリーをAI生成
      const res = await fetch('/api/generate-kpi-tree', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectUrl,
          kgiType: finalKgiType,
          kgiPeriod,
          kgiTargetValue: Number(kgiTargetValue) || 0,
          businessModelType,
          selectedManifesto: editableManifesto,
          customInstructions,
          fileUrls: uploadedFiles.map(f => f.url),
          archivedKpis // 集めたアーカイブKPIをコンテキストとして渡す
        })
      });

      // 後処理：一時ファイルを削除（非同期でバックグラウンド実行）
      for (const f of uploadedFiles) {
        deleteObject(ref(storage, f.path)).catch(console.error);
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');

      // AIからの返答に mappedSourceId があれば linkedSource に変換する
      if (data.nodes && Array.isArray(data.nodes)) {
        data.nodes = data.nodes.map((node: any) => {
          if (node.mappedSourceId) {
            const source = archivedKpis.find(k => k.id === node.mappedSourceId);
            if (source) {
              node.linkedSource = { projectId: source.projectId, kpiId: source.id, orgId: currentOrgId };
              node.isCalculated = false; // リンク元から引っ張るため
              node.formula = '';
              node.targetValue = 0;
              node.actualValue = 0;
            }
          }
          return node;
        });
      }

      // サンプルデータを生成する場合、全ノードに1年分の履歴データを追加する
      if (hasSampleData && data.nodes && Array.isArray(data.nodes)) {
        const today = new Date();
        data.nodes = data.nodes.map((node: any) => {
          if (node.linkedSource) return node;

          const history = [];
          const trendType = node.trend_type || 'steady_growth';
          const volatility = node.volatility || 0.1;
          const isPercentage = node.unit === '%' || node.unit === '％';
          const startRatio = 0.3;

          for (let i = 365; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            const progress = (365 - i) / 365;
            let baseValue = (node.targetValue || 0) * (startRatio + (1 - startRatio) * progress);
            
            const month = date.getMonth(); // 0-11
            if (trendType === 'seasonal_summer') {
              const seasonFactor = Math.sin((month - 4) * Math.PI / 6) * 0.3; // ±30%
              baseValue = baseValue * (1 + seasonFactor);
            } else if (trendType === 'seasonal_winter') {
              const seasonFactor = Math.sin((month + 2) * Math.PI / 6) * 0.3; // ±30%
              baseValue = baseValue * (1 + seasonFactor);
            } else if (trendType === 'flat_random') {
              baseValue = node.targetValue || 0;
            }

            const randomNoise = 1 + (Math.random() * volatility * 2 - volatility);
            let actualVal = baseValue * randomNoise;
            
            if (isPercentage) {
              actualVal = Math.round(actualVal * 10) / 10;
              if (actualVal < 0) actualVal = 0;
              if (actualVal > 100) actualVal = 100;
            } else {
              actualVal = Math.round(actualVal);
              if (actualVal < 0) actualVal = 0;
            }
            
            history.push({
              id: Math.random().toString(36).substr(2, 9),
              date: dateString,
              targetValue: node.targetValue || 0,
              actualValue: actualVal,
              comment: i === 0 ? '現在' : i % 30 === 0 ? '月次まとめ' : ''
            });
          }
          node.actualValue = history[history.length - 1].actualValue;
          node.history = history;
          return node;
        });
      } else if (!hasSampleData && data.nodes && Array.isArray(data.nodes)) {
        data.nodes = data.nodes.map((node: any) => {
          if (!node.linkedSource) {
            node.actualValue = 0;
          }
          return node;
        });
      }

      // 2. プロジェクト作成
      const newId = await createProject(projectName, projectUrl, user.uid, currentOrgId, {
        description: projectUrl,
        manifesto: editableManifesto ? `${editableManifesto.title}\n${editableManifesto.description}` : '', 
        kgiType: finalKgiType, 
        kgiPeriod,
        kgiTargetValue: Number(kgiTargetValue) || 0, 
        businessModelType
      });
      
      setCurrentProjectId(newId);

      // 3. 生成されたノード群と推論プロセスをセッションストレージに退避して次の画面でロードさせる
      if (data.nodes && Array.isArray(data.nodes)) {
        sessionStorage.setItem(`kpi_init_${newId}`, JSON.stringify(data.nodes));
      }
      if (data.thinkingProcess) {
        sessionStorage.setItem(`kpi_think_${newId}`, JSON.stringify(data.thinkingProcess));
      }

      router.push(`/${currentOrgId}/p/${newId}/kpi-tree`);
      setWizardStep('none');
    } catch (error) {
      console.error(error);
      alert('エラーが発生しました');
      setWizardStep('select_manifesto');
    }
  };\n\n"""
    
    del lines[start_idx:end_idx]
    lines.insert(start_idx, new_func)

    with open(file_path, "w", encoding="utf-8") as f:
        f.writelines(lines)
else:
    print("Could not find start/end indices")

