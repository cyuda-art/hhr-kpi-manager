import os
import re

def update_colors(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    original_content = content

    # --- 1. Replace cases where dark: variants ALREADY exist ---
    content = re.sub(r'text-(slate|gray)-(800|900)(\s+)dark:text-[a-zA-Z0-9_-]+', r'text-oxford-navy\3dark:text-slate-200', content)
    content = re.sub(r'text-(slate|gray)-(500|600)(\s+)dark:text-[a-zA-Z0-9_-]+', r'text-logic-slate\3dark:text-slate-400', content)
    
    content = re.sub(r'bg-(slate|gray)-50(\s+)dark:bg-[a-zA-Z0-9_-]+', r'bg-clean-canvas\2dark:bg-slate-900', content)
    content = re.sub(r'bg-(slate|gray)-100(\s+)dark:bg-[a-zA-Z0-9_-]+', r'bg-clean-canvas\2dark:bg-slate-800', content)

    # --- 2. Replace standalone cases (negative lookahead for dark: immediately following) ---
    # We use \s+dark: as negative lookahead
    
    # Text Primary
    content = re.sub(r'text-(slate|gray)-(800|900)(?!\s*dark:)', 'text-oxford-navy dark:text-slate-200', content)
    # Text Secondary
    content = re.sub(r'text-(slate|gray)-(500|600)(?!\s*dark:)', 'text-logic-slate dark:text-slate-400', content)
    
    # BG Canvas
    content = re.sub(r'bg-(slate|gray)-50(?!\s*dark:)', 'bg-clean-canvas dark:bg-slate-900', content)

    # --- 3. Replace Primary/Brand Colors ---
    content = re.sub(r'bg-(primary|blue|indigo)-[67]00', 'bg-strategic-teal', content)
    content = re.sub(r'hover:bg-(primary|blue|indigo)-[67]00', 'hover:bg-strategic-teal/90', content)
    content = re.sub(r'text-(primary|blue|indigo)-[67]00', 'text-strategic-teal', content)
    content = re.sub(r'border-(primary|blue|indigo)-[56]00', 'border-strategic-teal', content)
    content = re.sub(r'ring-(primary|blue|indigo)-[56]00', 'ring-strategic-teal', content)

    # --- 4. Replace Gradients (e.g. from-blue-600 to-indigo-600) ---
    content = re.sub(r'from-(primary|blue|indigo)-[567]00', 'from-oxford-navy', content)
    content = re.sub(r'to-(primary|blue|indigo)-[567]00', 'to-strategic-teal', content)
    content = re.sub(r'hover:from-(primary|blue|indigo)-[567]00', 'hover:from-oxford-navy/90', content)
    content = re.sub(r'hover:to-(primary|blue|indigo)-[567]00', 'hover:to-strategic-teal/90', content)

    if original_content != content:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated: {file_path}")

print("Starting global branding replacement...")
count = 0
for root, _, files in os.walk("src"):
    for file in files:
        if file.endswith(".tsx"):
            file_path = os.path.join(root, file)
            update_colors(file_path)
            count += 1
print(f"Processed {count} TSX files.")
