import json

with open('src/data/seed_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

regs = data.get('registrations', [])
unassigned = {}
for r in regs:
    if r.get('zone') == 'UNASSIGNED' or r.get('school_code') == 'UNKNOWN':
        s_name = r.get('school_name')
        uid = r.get('uid')
        if s_name not in unassigned:
            unassigned[s_name] = set()
        unassigned[s_name].add(uid)

print("Unassigned/Unknown Schools in seed_data.json:")
for s, uids in unassigned.items():
    reg_count = sum(1 for r in regs if r.get('school_name') == s)
    print(f" - '{s}': {len(uids)} unique candidates ({reg_count} subject entries)")
