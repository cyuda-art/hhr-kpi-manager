import re

# 1. ActionPanel.tsx
file_path = "src/components/kpi-tree/ActionPanel.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('bg-clean-canvas', 'bg-clean-canvas dark:bg-slate-900')
content = content.replace('border-slate-200', 'border-slate-200 dark:border-slate-800')
content = content.replace('text-oxford-navy', 'text-oxford-navy dark:text-slate-200')
content = content.replace('text-logic-slate', 'text-logic-slate dark:text-slate-400')
content = content.replace('bg-oxford-navy', 'bg-oxford-navy dark:bg-slate-800')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

# 2. Header.tsx
file_path = "src/components/layout/Header.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('bg-oxford-navy', 'bg-oxford-navy dark:bg-[#001133]')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

# 3. kpi-tree/page.tsx
file_path = "src/app/[orgId]/p/[projectId]/kpi-tree/page.tsx"
try:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    content = content.replace('bg-clean-canvas', 'bg-clean-canvas dark:bg-slate-950')
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
except Exception:
    pass

# 4. KpiNodeComponent.tsx
file_path = "src/components/kpi-tree/KpiNodeComponent.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('bg-white rounded-lg', 'bg-white dark:bg-slate-800 rounded-lg dark:border-slate-700')
content = content.replace('text-oxford-navy/90', 'text-oxford-navy/90 dark:text-slate-200')
content = content.replace('text-oxford-navy', 'text-oxford-navy dark:text-slate-100')
content = content.replace('ring-oxford-navy border-oxford-navy', 'ring-oxford-navy border-oxford-navy dark:ring-blue-400 dark:border-blue-400')
content = content.replace('bg-logic-slate/10', 'bg-logic-slate/10 dark:bg-slate-700')
content = content.replace('bg-logic-slate/5', 'bg-logic-slate/5 dark:bg-slate-700')
content = content.replace('text-logic-slate/70', 'text-logic-slate/70 dark:text-slate-400')
content = content.replace('text-logic-slate', 'text-logic-slate dark:text-slate-300')
content = content.replace('bg-clean-canvas', 'bg-clean-canvas dark:bg-slate-900')
content = content.replace('border-slate-100', 'border-slate-100 dark:border-slate-700')
content = content.replace('hover:text-oxford-navy hover:border-oxford-navy', 'hover:text-oxford-navy hover:border-oxford-navy dark:hover:text-white dark:hover:border-slate-500')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

# 5. settings/page.tsx
file_path = "src/app/[orgId]/settings/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# settings/page.tsx also uses bg-slate-50 which we can map to dark:bg-slate-900 etc.
# Actually it already has dark: classes from before (e.g., dark:bg-slate-900), but the newly added PEST framework had colors without dark mode sometimes.
# Wait, the PEST I added had `dark:` classes!
# E.g. `bg-rose-50 dark:bg-rose-900/10` -> it has it! So settings/page.tsx might be fine.

print("Done")
