import re

file_path = "src/store/useKpiStore.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("""    });
  },
    });
  },

  overwriteKpiData:""", """    });
  },

  overwriteKpiData:""")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
