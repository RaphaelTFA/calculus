import json, os, sys

base = "data/courses/chuyen-dong/chapters"
files = []
for root, dirs, fnames in os.walk(base):
    for f in fnames:
        if f.endswith(".json"):
            files.append(os.path.join(root, f))

files.sort()
errors = []
for fp in files:
    try:
        with open(fp, encoding="utf-8") as fh:
            data = json.load(fh)
        
        basename = os.path.basename(fp)
        if basename == "chapter.json":
            assert "id" in data and "title" in data, f"Missing id/title in {fp}"
            print(f"  CHAPTER OK: {fp} -> {data['id']}")
            continue
        
        # Step JSON validation
        assert "id" in data, f"Missing id in {fp}"
        assert "slides" in data, f"Missing slides in {fp}"
        
        slide_count = len(data["slides"])
        interaction_count = 0
        ids_seen = set()
        
        for s in data["slides"]:
            for b in s["blocks"]:
                bid = b["id"]
                assert bid not in ids_seen, f"Duplicate block id: {bid} in {fp}"
                ids_seen.add(bid)
                
                if b["type"] == "interaction":
                    interaction_count += 1
                    lesson = b["content"]["lesson"]
                    it = lesson["interactionType"]
                    
                    if it == "C":
                        ps = lesson["parameterSpec"]["time"]
                        assert ps["start"] < ps["end"]
                        assert ps["step"] > 0
                        ev = lesson["systemSpec"]["evolutionRule"]
                        assert "expression" in ev
                        assert "variables" in ev
                    elif it == "B":
                        p = lesson["parameter"]
                        assert p["min"] < p["max"]
                        assert "model" in lesson["system"]
                    elif it == "A":
                        assert "resolutionLevels" in lesson["parameterSpec"]
                        assert "function" in lesson["systemSpec"]
                    elif it == "E":
                        assert "structure" in lesson["parameterSpec"]
                        assert "conservedObject" in lesson["systemSpec"]
                
                if b["type"] == "quiz":
                    q = b["content"]
                    assert len(q["options"]) == 4, f"Quiz {bid} has {len(q['options'])} options"
                    assert q["correct"] in [o["value"] for o in q["options"]]
        
        assert interaction_count == 1, f"Expected 1 interaction in {fp}, got {interaction_count}"
        
        quiz_count = sum(1 for s in data["slides"] for b in s["blocks"] if b["type"] == "quiz")
        print(f"  STEP OK: {fp} -> {data['id']} | slides={slide_count} | quizzes={quiz_count} | ids={len(ids_seen)}")
        
    except Exception as e:
        errors.append(f"ERROR in {fp}: {e}")
        print(f"  FAILED: {fp}: {e}")

print(f"\n{'='*50}")
print(f"Files checked: {len(files)}")
print(f"Errors: {len(errors)}")
if errors:
    for e in errors:
        print(f"  {e}")
else:
    print("All files valid!")
