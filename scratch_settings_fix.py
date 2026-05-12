import re

file_path = "src/app/[orgId]/settings/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace dangerous HTML with whitespace-pre-wrap
content = content.replace(
    """<div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: currentOrg.pest.replace(/\\n/g, '<br/>') }} />""",
    """<div className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 font-medium">{currentOrg.pest}</div>"""
)
content = content.replace(
    """<div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: currentOrg.fiveForces?.replace(/\\n/g, '<br/>') || '' }} />""",
    """<div className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 font-medium">{currentOrg.fiveForces}</div>"""
)
content = content.replace(
    """<div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: currentOrg.vrio?.replace(/\\n/g, '<br/>') || '' }} />""",
    """<div className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 font-medium">{currentOrg.vrio}</div>"""
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
