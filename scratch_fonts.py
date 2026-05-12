import re

# Update layout.tsx
layout_path = "src/app/layout.tsx"
with open(layout_path, "r", encoding="utf-8") as f:
    layout_content = f.read()

layout_content = layout_content.replace(
    'import { Noto_Sans_JP } from "next/font/google";',
    'import { Noto_Sans_JP, Poppins, Lato } from "next/font/google";'
)

new_fonts = """const notoSansJP = Noto_Sans_JP({ 
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lato",
  display: "swap",
});"""

layout_content = re.sub(r'const notoSansJP = Noto_Sans_JP\(\{[\s\S]*?\}\);', new_fonts, layout_content)

layout_content = layout_content.replace(
    '<body className={notoSansJP.className} style={{ fontFamily: \'"Google Sans", Roboto, "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif\' }}>',
    '<body className={`${notoSansJP.variable} ${poppins.variable} ${lato.variable} font-sans bg-clean-canvas text-logic-slate`}>'
)

with open(layout_path, "w", encoding="utf-8") as f:
    f.write(layout_content)

# Update globals.css
css_path = "src/app/globals.css"
with open(css_path, "r", encoding="utf-8") as f:
    css_content = f.read()

# Append theme variables
theme_vars = """
@theme {
  --font-poppins: var(--font-poppins), var(--font-noto-sans-jp), sans-serif;
  --font-lato: var(--font-lato), var(--font-noto-sans-jp), sans-serif;
  --font-formula: "Times New Roman", Georgia, serif;

  --color-oxford-navy: #00205B;
  --color-strategic-teal: #00A3A1;
  --color-logic-slate: #425563;
  --color-clean-canvas: #F8FAFC;
}
"""

if "@theme {" not in css_content:
    css_content = css_content.replace('@import "tailwindcss";', '@import "tailwindcss";\n' + theme_vars)

with open(css_path, "w", encoding="utf-8") as f:
    f.write(css_content)

