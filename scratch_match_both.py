import pandas as pd
import glob
import os

# Load master colleges
inst_path = r"C:\Users\user\Downloads\InstitutionData (3).xlsx"
if not os.path.exists(inst_path):
    inst_files = glob.glob(r"C:\Users\user\Downloads\InstitutionData*.xlsx")
    inst_path = inst_files[-1] if inst_files else None

df_inst = pd.read_excel(inst_path)
df_inst.columns = [str(c).strip() for c in df_inst.columns]

# Format schools list like frontend
institutions = []
for idx, row in df_inst.iterrows():
    name = str(row.get("Institution English", "")).strip()
    code = str(row.get("Code", "")).strip()
    zone = str(row.get("Zone", "")).strip()
    district = str(row.get("District", "")).strip()
    if name and name.lower() != 'nan':
        institutions.append({
            'code': code,
            'name': name,
            'zone': zone if zone and zone.lower() != 'nan' else 'UNASSIGNED',
            'district': district
        })

# Simulate frontend matching logic
def find_matched_inst(school_name):
    if not isinstance(school_name, str):
        return None
    name_clean = school_name.upper().replace(",", "").replace(".", "").replace("'", "").replace("-", " ").strip()
    for inst in institutions:
        inst_clean = inst['name'].upper().replace(",", "").replace(".", "").replace("'", "").replace("-", " ").strip()
        # Exact match, or inclusion match
        if inst_clean == name_clean or inst_clean in name_clean or name_clean in inst_clean or name_clean.startswith(inst['code']):
            return inst
    return None

files_to_check = [
    (r"C:\Users\user\Downloads\CSWC - Council of Samastha Womens Colleges  Admin (5).xlsx", "Registrations"),
    (r"C:\Users\user\Downloads\ALL IMP & SAY LIST.xlsx", "SAY List")
]

unmatched_candidates = {}

for fpath, label in files_to_check:
    if not os.path.exists(fpath):
        print(f"File not found: {fpath}")
        continue
    df = pd.read_excel(fpath)
    if "Unnamed" in str(df.columns[0]) or "CSWC" in str(df.columns[0]):
        headers = df.iloc[0].tolist()
        df = df.iloc[1:].copy()
        df.columns = headers
    
    df.columns = [str(c).strip() for c in df.columns]
    
    # Find school name and student ID columns
    school_col = None
    for col in df.columns:
        if any(x in col.lower() for x in ['institution', 'college', 'school']) and not any(x in col.lower() for x in ['code', 'mail', 'no']):
            school_col = col
            break
    uid_col = None
    for col in df.columns:
        if any(x in col.lower() for x in ['uid', 'student id', 'id']):
            uid_col = col
            break
            
    if school_col and uid_col:
        for idx, row in df.iterrows():
            school_name = str(row.get(school_col, "")).strip()
            uid = str(row.get(uid_col, "")).strip()
            if not school_name or school_name.lower() == 'nan' or not uid or uid.lower() == 'nan':
                continue
            
            matched = find_matched_inst(school_name)
            if not matched:
                if school_name not in unmatched_candidates:
                    unmatched_candidates[school_name] = set()
                unmatched_candidates[school_name].add(uid)

print("\nCombined Unmatched Schools and Candidate Counts:")
total_candidates = 0
for school, uids in sorted(unmatched_candidates.items()):
    print(f" - '{school}': {len(uids)} unique candidates")
    total_candidates += len(uids)
print(f"Total Unique Unmatched Candidates: {total_candidates}")
