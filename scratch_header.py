import re

# Update Header.tsx
header_path = "src/components/layout/Header.tsx"
with open(header_path, "r", encoding="utf-8") as f:
    header_content = f.read()

# Replace Header Background and Text Colors
header_content = header_content.replace(
    'className="sticky top-0 z-50 bg-white dark:bg-[#1a1b1e] border-b border-slate-200 dark:border-slate-800 px-6 py-2 flex items-center justify-between"',
    'className="sticky top-0 z-50 bg-oxford-navy text-white px-6 py-2 flex items-center justify-between shadow-md"'
)

header_content = header_content.replace(
    'text-slate-600 dark:text-slate-400 hover:text-slate-900',
    'text-white/80 hover:text-white'
)

header_content = header_content.replace(
    'text-slate-800 dark:text-slate-200',
    'text-white'
)

header_content = header_content.replace(
    'border-slate-200 dark:border-slate-700 hover:border-primary-500 text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800',
    'border-white/20 hover:border-strategic-teal text-white bg-oxford-navy/50'
)

with open(header_path, "w", encoding="utf-8") as f:
    f.write(header_content)


# Update ActionPanel.tsx
panel_path = "src/components/kpi-tree/ActionPanel.tsx"
with open(panel_path, "r", encoding="utf-8") as f:
    panel_content = f.read()

# Replace ActionPanel styles
panel_content = panel_content.replace(
    'bg-white dark:bg-[#202124] border-l border-slate-200 dark:border-[#3c4043] flex flex-col',
    'bg-clean-canvas border-l border-slate-200 flex flex-col'
)
panel_content = panel_content.replace(
    'text-slate-800 dark:text-[#e8eaed]',
    'text-oxford-navy'
)
panel_content = panel_content.replace(
    'text-slate-500 dark:text-[#9aa0a6]',
    'text-logic-slate'
)
panel_content = panel_content.replace(
    'bg-primary-600 hover:bg-primary-700',
    'bg-strategic-teal hover:bg-strategic-teal/90'
)
panel_content = panel_content.replace(
    'bg-blue-600 hover:bg-blue-700',
    'bg-oxford-navy hover:bg-oxford-navy/90'
)
panel_content = panel_content.replace(
    'text-primary-600 dark:text-primary-400 border-primary-600 dark:border-primary-400',
    'text-strategic-teal border-strategic-teal'
)

with open(panel_path, "w", encoding="utf-8") as f:
    f.write(panel_content)

# Update KpiTree page (canvas background)
tree_page = "src/app/[orgId]/p/[projectId]/kpi-tree/page.tsx"
try:
    with open(tree_page, "r", encoding="utf-8") as f:
        tree_content = f.read()
    tree_content = tree_content.replace('bg-slate-50 dark:bg-[#1a1b1e]', 'bg-clean-canvas')
    with open(tree_page, "w", encoding="utf-8") as f:
        f.write(tree_content)
except FileNotFoundError:
    pass

