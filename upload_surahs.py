"""
Upload all Surah JSON files → Firestore collection: quranic_surahs
Each document ID = surah number (e.g. "90", "103", "114")
Each document stores: { surah_key: "balad", ayat: [...] }

Usage:
  1. Place your serviceAccountKey.json in the project root (or update path below)
  2. Make sure all JSON files are in assets/json/
  3. pip install firebase-admin
  4. python upload_surahs.py
"""

import firebase_admin
from firebase_admin import credentials, firestore
import json
import os

# ── Firebase init ────────────────────────────────────────────
cred = credentials.Certificate('serviceAccountKey.json')   # ← update path if needed
firebase_admin.initialize_app(cred)
db = firestore.client()

# ── JSON folder (relative to where you run the script) ──────
JSON_DIR = "json"

# ── Surah number → (filename, key inside JSON) ──────────────
# Special case: surah 114 file is "nas.json" but the key inside is "naas"
# Everything else: filename = key + ".json"
SURAH_MAP = {
    78:  ("naba.json",        "naba"),
    79:  ("naziat.json",      "naziat"),
    80:  ("abasa.json",       "abasa"),
    81:  ("takwir.json",      "takwir"),
    82:  ("infitar.json",     "infitar"),
    83:  ("mutaffifin.json",  "mutaffifin"),
    84:  ("inshiqaq.json",    "inshiqaq"),
    85:  ("buruj.json",       "buruj"),
    86:  ("tariq.json",       "tariq"),
    87:  ("aala.json",        "aala"),
    88:  ("ghashiyah.json",   "ghashiyah"),
    89:  ("fajar.json",       "fajar"),
    90:  ("balad.json",       "balad"),
    91:  ("shams.json",       "shams"),
    92:  ("layl.json",        "layl"),
    93:  ("dhuha.json",       "dhuha"),
    94:  ("inshirah.json",    "inshirah"),
    95:  ("tin.json",         "tin"),
    96:  ("alaq.json",        "alaq"),
    97:  ("qadar.json",       "qadar"),
    98:  ("bayinah.json",     "bayinah"),
    99:  ("zilzal.json",      "zilzal"),
    100: ("aadiyat.json",     "aadiyat"),
    101: ("qaariah.json",     "qaariah"),
    102: ("takasur.json",     "takasur"),
    103: ("asr.json",         "asr"),
    104: ("humazah.json",     "humazah"),
    105: ("feel.json",        "feel"),
    106: ("qurish.json",      "qurish"),
    107: ("maon.json",        "maon"),
    108: ("kosar.json",       "kosar"),
    109: ("kafiron.json",     "kafiron"),
    110: ("nsr.json",         "nsr"),
    111: ("masad.json",       "masad"),
    112: ("ikhlas.json",      "ikhlas"),
    113: ("falq.json",        "falq"),
    114: ("nas.json",         "naas"),   # ← nas.json, key = naas
}


def upload_surah(surah_num: int, filename: str, json_key: str):
    filepath = os.path.join(JSON_DIR, filename)

    if not os.path.exists(filepath):
        print(f"⚠️  [{surah_num}] File not found: {filepath} — skipped")
        return False

    with open(filepath, "r", encoding="utf-8") as f:
        raw = json.load(f)

    if json_key not in raw:
        print(f"⚠️  [{surah_num}] Key '{json_key}' missing in {filename} — skipped")
        return False

    ayat_list = raw[json_key]

    doc_data = {
        "surah_key": json_key,          # e.g. "balad"  — handy for the admin panel
        "ayat":      ayat_list,         # the full array from the JSON
    }

    # setDoc with surah number as document ID
    db.collection("quranic_surahs").document(str(surah_num)).set(doc_data)
    print(f"✅  [{surah_num}] {json_key:>14}  →  {len(ayat_list):>2} ayat entries uploaded")
    return True


def main():
    print("=" * 60)
    print("  Uploading Surahs to Firestore → quranic_surahs")
    print("=" * 60)

    success = 0
    skipped = 0

    for num in sorted(SURAH_MAP.keys()):
        filename, key = SURAH_MAP[num]
        if upload_surah(num, filename, key):
            success += 1
        else:
            skipped += 1

    print("=" * 60)
    print(f"  Done — {success} uploaded, {skipped} skipped")
    print("=" * 60)


if __name__ == "__main__":
    main()