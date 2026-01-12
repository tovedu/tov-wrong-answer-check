
import pandas as pd

try:
    # Use the file name found earlier "TOV 국어 .xlsx"
    file_path = "TOV 국어 .xlsx"
    xl = pd.ExcelFile(file_path)
    
    print("Sheet Names:", xl.sheet_names)
    
    for sheet in xl.sheet_names:
        df = pd.read_excel(file_path, sheet_name=sheet, nrows=1)
        print(f"\n[{sheet}] Columns:")
        print(list(df.columns))
except Exception as e:
    print("Error:", e)
