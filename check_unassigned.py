import pandas as pd
import os

inst_path = r"C:\Users\user\Downloads\InstitutionData (3).xlsx"
reg_paths = {
    "all_imp_say_list": r"C:\Users\user\Downloads\ALL IMP & SAY LIST.xlsx",
    "cswc_admin_5": r"C:\Users\user\Downloads\CSWC - Council of Samastha Womens Colleges  Admin (5).xlsx"
}

# Load master institutions
df_inst = pd.read_excel(inst_path)
df_inst.columns = [c.strip() for c in df_inst.columns]
master_names = df_inst["Institution English"].dropna().unique().tolist()
master_codes = df_inst["Code"].dropna().unique().tolist()

master_names_clean = [str(name).upper().replace(",", "").replace(".", "").replace("'", "").replace("-", " ").strip() for name in master_names]
master_codes_upper = [str(code).upper().strip() for code in master_codes]

def find_match(school_name):
    if not isinstance(school_name, str):
        return None
    name_clean = school_name.upper().replace(",", "").replace(".", "").replace("'", "").replace("-", " ").strip()
    
    # Check exact name match
    if name_clean in master_names_clean:
        return True
    
    # Check if name contains code or starts with code
    for code in master_codes_upper:
        if name_clean.startswith(code + " ") or name_clean == code:
            return True
            
    # Check if any master name is in school_name
    for m_name in master_names_clean:
        if m_name in name_clean or name_clean in m_name:
            return True
            
    # Word overlap
    words = set(name_clean.split())
    for m_name in master_names_clean:
        m_words = set(m_name.split())
        if len(words.intersection(m_words)) >= 2:
            return True
            
    return False

for key, rpath in reg_paths.items():
    if not os.path.exists(rpath):
        continue
        
    df = pd.read_excel(rpath)
    if "Unnamed: 1" in df.columns or "CSWC - Council of Samastha" in df.columns[0]:
        headers = df.iloc[0].tolist()
        df = df.iloc[1:].copy()
        df.columns = headers
    df.columns = [str(c).strip() for c in df.columns]
    
    unmatched_entries = []
    
    for idx, row in df.iterrows():
        school_name = str(row.get("Institution", "")).strip()
        uid = str(row.get("Student UID", "")).strip()
        name = str(row.get("Student Name", "")).strip()
        
        if not uid or uid == "nan" or not school_name or school_name == "nan":
            continue
            
        if not find_match(school_name):
            unmatched_entries.append({
                "student_name": name,
                "uid": uid,
                "school_name": school_name,
                "row_index": idx
            })
            
    print("=" * 60)
    print(f"FILE: {key} ({rpath})")
    print(f"Total Unmatched Subject-level Rows: {len(unmatched_entries)}")
    
    # Unique students that are unmatched
    unmatched_df = pd.DataFrame(unmatched_entries)
    if len(unmatched_df) > 0:
        unique_students = unmatched_df["uid"].nunique()
        print(f"Unique Unmatched Candidates: {unique_students}")
        print("Unmatched Schools & Candidate Counts:")
        school_counts = unmatched_df.groupby("school_name")["uid"].nunique()
        for s_name, count in school_counts.items():
            print(f" - {s_name} ({count} candidates)")
    print("=" * 60 + "\n")
