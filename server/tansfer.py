# 
# Скрипт для конвертации Exel таблиц (csv файлов) в рабочий json 
# для автоматизации работы перевода одного в другое
# 

import pandas as pd
import json

# Путь к Excel-файлу
excel_file = "./input_exel/BZ-13_05.xlsx"
date = "13.05"

df = pd.read_excel(excel_file)


if "Комментарий" not in df.columns:
    df["Комментарий"] = ""

df = df.fillna("")
data = df.to_dict(orient="records")

with open(f"./result_json/BZ{date}.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("\n>>>>>>>> JSON файл успешно создан\n")