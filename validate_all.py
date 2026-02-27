"""
Comprehensive validator for all raw course JSON files.
Checks structural integrity and compatibility with frontend rendering components.
"""
import json, os, sys, re

RAW_COURSES_DIR = os.path.join("data", "raw_courses")

# Math helpers available in frontend JS (no Math. prefix)
ALLOWED_JS_FNS = {"abs","pow","sin","cos","tan","sqrt","log","exp","floor","ceil","round","PI","E","min","max","sign"}

errors = []
warnings = []
file_count = 0
step_count = 0

def err(filepath, msg):
    errors.append(f"ERROR [{filepath}]: {msg}")

def warn(filepath, msg):
    warnings.append(f"WARN  [{filepath}]: {msg}")

def check_js_expr(filepath, expr, context, allowed_vars=None):
    """Basic checks on JS expressions used in interaction configs."""
    if not isinstance(expr, str):
        err(filepath, f"{context}: expression is not a string: {expr!r}")
        return
    # Common mistake: using Math. prefix
    if "Math." in expr:
        err(filepath, f"{context}: expression uses 'Math.' prefix (not available, use bare fn names): {expr}")
    # Common mistake: using ^ for exponentiation (only works in Type C due to .replace)
    if "^" in expr and context != "TypeC expression":
        warn(filepath, f"{context}: expression uses '^' — may not work (use pow(x,n) or x*x): {expr}")

def validate_interaction_type_a(filepath, lesson):
    """Validate Type A interaction (secant or riemann mode)."""
    mode = lesson.get("mode", "secant")
    
    # parameterSpec
    ps = lesson.get("parameterSpec")
    if not ps:
        err(filepath, "Type A: missing parameterSpec")
        return
    levels = ps.get("resolutionLevels")
    if not levels or not isinstance(levels, list) or len(levels) < 2:
        err(filepath, "Type A: parameterSpec.resolutionLevels must be a list with >=2 values")
        return
    if levels != sorted(levels):
        warn(filepath, "Type A: resolutionLevels not sorted ascending")
        
    # systemSpec
    ss = lesson.get("systemSpec")
    if not ss:
        err(filepath, "Type A: missing systemSpec")
        return
    if "function" not in ss:
        err(filepath, "Type A: systemSpec.function is required")
    else:
        check_js_expr(filepath, ss["function"], "Type A function")
    
    if "domain" not in ss or not isinstance(ss.get("domain"), list) or len(ss.get("domain", [])) != 2:
        err(filepath, "Type A: systemSpec.domain must be [min, max]")
    if "range" not in ss or not isinstance(ss.get("range"), list) or len(ss.get("range", [])) != 2:
        err(filepath, "Type A: systemSpec.range must be [min, max]")
        
    if mode == "riemann":
        # Riemann mode needs integral, sumType
        if "integral" not in ss:
            err(filepath, "Type A riemann: systemSpec.integral is required (numeric target)")
        if "sumType" not in ss:
            warn(filepath, "Type A riemann: systemSpec.sumType not set (defaults to 'left')")
        elif ss["sumType"] not in ("left", "right", "midpoint"):
            err(filepath, f"Type A riemann: invalid sumType '{ss['sumType']}' — must be left/right/midpoint")
    else:
        # Secant mode needs derivative, anchor
        if "derivative" not in ss:
            err(filepath, "Type A secant: systemSpec.derivative is required")
        else:
            check_js_expr(filepath, ss["derivative"], "Type A derivative")
        if "anchor" not in ss:
            err(filepath, "Type A secant: systemSpec.anchor is required (number)")
            
    # reflectionSpec
    rs = lesson.get("reflectionSpec")
    if rs:
        triggers = rs.get("triggers", [])
        for i, t in enumerate(triggers):
            if "condition" not in t:
                err(filepath, f"Type A reflection trigger[{i}]: missing 'condition'")
            if "message" not in t:
                err(filepath, f"Type A reflection trigger[{i}]: missing 'message'")

def validate_interaction_type_b(filepath, lesson):
    """Validate Type B interaction (parameter exploration)."""
    # meta
    meta = lesson.get("meta")
    if not meta or "parameterLabel" not in meta:
        warn(filepath, "Type B: meta.parameterLabel missing (will show default)")
    
    # parameter
    param = lesson.get("parameter")
    if not param:
        err(filepath, "Type B: missing 'parameter' spec")
        return
    for field in ("min", "max", "initial"):
        if field not in param:
            err(filepath, f"Type B: parameter.{field} is required")
    if "min" in param and "max" in param and param["min"] >= param["max"]:
        err(filepath, f"Type B: parameter.min ({param['min']}) >= max ({param['max']})")
    if "initial" in param and "min" in param and "max" in param:
        if param["initial"] < param["min"] or param["initial"] > param["max"]:
            warn(filepath, f"Type B: parameter.initial ({param['initial']}) outside [min, max]")
    
    # system
    sys = lesson.get("system")
    if not sys:
        err(filepath, "Type B: missing 'system' spec")
        return
    if "view" not in sys:
        err(filepath, "Type B: system.view is required (xMin, xMax, yMin, yMax)")
    else:
        view = sys["view"]
        for k in ("xMin", "xMax", "yMin", "yMax"):
            if k not in view:
                err(filepath, f"Type B: system.view.{k} is required")
    
    has_model = "model" in sys
    has_curves = "curves" in sys and isinstance(sys.get("curves"), list) and len(sys["curves"]) > 0
    if not has_model and not has_curves:
        err(filepath, "Type B: system must have either 'model' or 'curves[]'")
    
    if has_model:
        check_js_expr(filepath, sys["model"], "Type B model")
    if has_curves:
        for i, curve in enumerate(sys["curves"]):
            if "expr" not in curve:
                err(filepath, f"Type B: system.curves[{i}].expr is required")
            else:
                check_js_expr(filepath, curve["expr"], f"Type B curves[{i}].expr")
    
    # shading (optional)
    shading = sys.get("shading")
    if shading:
        for field in ("from", "to"):
            if field not in shading:
                warn(filepath, f"Type B: system.shading.{field} missing")
    
    # reflections
    reflections = lesson.get("reflections")
    if not reflections or not isinstance(reflections, list):
        warn(filepath, "Type B: missing 'reflections' array")
    else:
        for i, ref in enumerate(reflections):
            if "trigger" not in ref and "triggerSpec" not in ref:
                err(filepath, f"Type B: reflections[{i}] needs 'trigger' or 'triggerSpec'")
            if "text" not in ref:
                err(filepath, f"Type B: reflections[{i}].text is required")
            if "id" not in ref:
                warn(filepath, f"Type B: reflections[{i}].id missing (needed for dedup)")

def validate_interaction_type_c(filepath, lesson):
    """Validate Type C interaction (time animation)."""
    # parameterSpec.time
    ps = lesson.get("parameterSpec")
    if not ps or "time" not in ps:
        err(filepath, "Type C: missing parameterSpec.time")
        return
    time = ps["time"]
    for field in ("start", "end", "step"):
        if field not in time:
            err(filepath, f"Type C: parameterSpec.time.{field} is required")
    if "start" in time and "end" in time and time["start"] >= time["end"]:
        err(filepath, f"Type C: time.start ({time['start']}) >= time.end ({time['end']})")
    if "step" in time and time["step"] <= 0:
        err(filepath, f"Type C: time.step must be > 0")
        
    # systemSpec
    ss = lesson.get("systemSpec")
    if not ss:
        err(filepath, "Type C: missing systemSpec")
        return
    if "initialState" not in ss:
        err(filepath, "Type C: systemSpec.initialState is required (x, y)")
    else:
        init = ss["initialState"]
        if "x" not in init or "y" not in init:
            err(filepath, "Type C: systemSpec.initialState must have x and y")
    
    evol = ss.get("evolutionRule")
    if not evol:
        err(filepath, "Type C: systemSpec.evolutionRule is required")
        return
    if "expression" not in evol:
        err(filepath, "Type C: evolutionRule.expression is required")
    else:
        check_js_expr(filepath, evol["expression"], "TypeC expression")
        # Must return [dx, dy] array
        expr = evol["expression"]
        if not expr.strip().startswith("[") or "," not in expr:
            warn(filepath, f"Type C: expression should return [dx, dy] array: {expr}")
    if "variables" not in evol:
        err(filepath, "Type C: evolutionRule.variables is required")
    else:
        if "t" not in evol["variables"]:
            warn(filepath, "Type C: evolutionRule.variables should include 't'")
    
    # representationSpec
    rep = lesson.get("representationSpec")
    if not rep:
        err(filepath, "Type C: missing representationSpec")
        return
    if "viewBox" not in rep:
        err(filepath, "Type C: representationSpec.viewBox is required")
    else:
        vb = rep["viewBox"]
        for k in ("xMin", "xMax", "yMin", "yMax"):
            if k not in vb:
                err(filepath, f"Type C: representationSpec.viewBox.{k} is required")
    
    # reflectionSpec
    rs = lesson.get("reflectionSpec")
    if rs:
        triggers = rs.get("triggers", [])
        for i, t in enumerate(triggers):
            if "type" not in t:
                err(filepath, f"Type C: reflectionSpec.triggers[{i}].type is required")
            if "message" not in t:
                err(filepath, f"Type C: reflectionSpec.triggers[{i}].message is required")

def validate_interaction_type_e(filepath, lesson):
    """Validate Type E interaction (structure/geometric split)."""
    # parameterSpec.structure
    ps = lesson.get("parameterSpec")
    if not ps or "structure" not in ps:
        err(filepath, "Type E: missing parameterSpec.structure")
        return
    struct = ps["structure"]
    for field in ("min", "max", "step", "initial"):
        if field not in struct:
            err(filepath, f"Type E: parameterSpec.structure.{field} is required")
    
    # systemSpec
    ss = lesson.get("systemSpec")
    if not ss:
        err(filepath, "Type E: missing systemSpec")
        return
    if "conservedObject" not in ss:
        err(filepath, "Type E: systemSpec.conservedObject is required")
    
    # representationSpec
    rep = lesson.get("representationSpec")
    if not rep:
        err(filepath, "Type E: missing representationSpec")
        return
    
    if "geometryBase" not in rep:
        err(filepath, "Type E: representationSpec.geometryBase is required")
        return
    
    gb = rep["geometryBase"]
    gb_type = gb.get("type")
    if gb_type not in ("rectangle", "areaUnderCurve", "regionBetweenCurves"):
        err(filepath, f"Type E: unsupported geometryBase.type: {gb_type}")
        return
    
    if "domain" not in gb and gb_type in ("areaUnderCurve", "regionBetweenCurves"):
        err(filepath, f"Type E: geometryBase.domain is required for {gb_type}")
    
    if gb_type == "areaUnderCurve":
        if "function" not in gb:
            err(filepath, "Type E: geometryBase.function is required for areaUnderCurve")
        else:
            check_js_expr(filepath, gb["function"], "Type E geometryBase.function")
    
    if gb_type == "regionBetweenCurves":
        if "f" not in gb:
            err(filepath, "Type E: geometryBase.f is required for regionBetweenCurves")
        else:
            check_js_expr(filepath, gb["f"], "Type E geometryBase.f")
        if "g" not in gb:
            err(filepath, "Type E: geometryBase.g is required for regionBetweenCurves")
        else:
            check_js_expr(filepath, gb["g"], "Type E geometryBase.g")
    
    # splitSpec
    if "splitSpec" not in rep:
        err(filepath, "Type E: representationSpec.splitSpec is required")
        return
    
    split_type = rep["splitSpec"].get("type")
    if split_type not in ("domainSplit", "signPartition", "rectangleContribution"):
        err(filepath, f"Type E: unsupported splitSpec.type: {split_type}")
    
    # CRITICAL: signPartition requires regionBetweenCurves geometry base with f and g 
    if split_type == "signPartition" and gb_type != "regionBetweenCurves":
        err(filepath, f"Type E: signPartition REQUIRES geometryBase.type='regionBetweenCurves' (with f and g), got '{gb_type}' — will crash at runtime!")
    
    # domainSplit requires areaUnderCurve 
    if split_type == "domainSplit" and gb_type != "areaUnderCurve":
        warn(filepath, f"Type E: domainSplit typically uses areaUnderCurve, got '{gb_type}'")
    
    # viewBox
    if "viewBox" not in rep:
        err(filepath, "Type E: representationSpec.viewBox is required")
    else:
        vb = rep["viewBox"]
        for k in ("xMin", "xMax", "yMin", "yMax"):
            if k not in vb:
                err(filepath, f"Type E: representationSpec.viewBox.{k} is required")
    
    # reflectionSpec
    rs = lesson.get("reflectionSpec")
    if rs:
        triggers = rs.get("triggers", [])
        for i, t in enumerate(triggers):
            if "type" not in t:
                warn(filepath, f"Type E: reflectionSpec.triggers[{i}].type missing")
            if "message" not in t:
                err(filepath, f"Type E: reflectionSpec.triggers[{i}].message is required")

def validate_quiz(filepath, block_id, content):
    """Validate quiz block content."""
    if "question" not in content:
        err(filepath, f"Quiz {block_id}: missing 'question'")
    if "options" not in content:
        err(filepath, f"Quiz {block_id}: missing 'options'")
        return
    options = content["options"]
    if not isinstance(options, list):
        err(filepath, f"Quiz {block_id}: 'options' must be an array")
        return
    if len(options) != 4:
        warn(filepath, f"Quiz {block_id}: expected 4 options, got {len(options)}")
    
    values = []
    for i, opt in enumerate(options):
        if not isinstance(opt, dict):
            err(filepath, f"Quiz {block_id}: option[{i}] must be an object")
            continue
        val = opt.get("value", opt.get("id"))
        if val is None:
            err(filepath, f"Quiz {block_id}: option[{i}] missing 'value'")
        else:
            values.append(val)
        if "label" not in opt and "text" not in opt:
            warn(filepath, f"Quiz {block_id}: option[{i}] missing 'label' or 'text'")
    
    correct = content.get("correct")
    if correct is None:
        err(filepath, f"Quiz {block_id}: missing 'correct' field")
    elif str(correct) not in [str(v) for v in values]:
        err(filepath, f"Quiz {block_id}: correct value '{correct}' not found in option values {values}")
    
    # Check for duplicate values
    if len(values) != len(set(str(v) for v in values)):
        err(filepath, f"Quiz {block_id}: duplicate option values detected")

def validate_text(filepath, block_id, content):
    """Validate text block content."""
    if "heading" not in content and "paragraphs" not in content and "content" not in content:
        warn(filepath, f"Text {block_id}: no heading, paragraphs, or content")
    paras = content.get("paragraphs", [])
    if paras and not isinstance(paras, list):
        err(filepath, f"Text {block_id}: 'paragraphs' must be an array")

def validate_math(filepath, block_id, content):
    """Validate math block content."""
    if "latex" not in content:
        err(filepath, f"Math {block_id}: missing 'latex' field")
        return
    latex = content["latex"]
    # Basic LaTeX syntax checks
    # Check balanced braces
    depth = 0
    for ch in latex:
        if ch == '{': depth += 1
        elif ch == '}': depth -= 1
        if depth < 0:
            err(filepath, f"Math {block_id}: unbalanced braces in LaTeX (extra '}}')") 
            break
    if depth > 0:
        err(filepath, f"Math {block_id}: unbalanced braces in LaTeX ({depth} unclosed '{{')") 

def validate_callout(filepath, block_id, content):
    """Validate callout block content."""
    variant = content.get("variant", content.get("callout_type", "info"))
    valid_variants = {"info", "tip", "warning", "theorem", "note"}
    if variant not in valid_variants:
        warn(filepath, f"Callout {block_id}: variant '{variant}' not in {valid_variants}")
    if "body" not in content and "content" not in content:
        warn(filepath, f"Callout {block_id}: no body or content")

def validate_step(filepath, data):
    """Validate a step JSON file."""
    global step_count
    step_count += 1
    
    # Required top-level fields
    for field in ("id", "title", "slides"):
        if field not in data:
            err(filepath, f"Missing required field: {field}")
            return
    
    if not isinstance(data["slides"], list) or len(data["slides"]) == 0:
        err(filepath, "slides must be a non-empty array")
        return
    
    if "order_index" not in data:
        warn(filepath, "Missing order_index")
    
    # Check slides
    ids_seen = set()
    interaction_count = 0
    slide_indices = []
    
    for si, slide in enumerate(data["slides"]):
        slide_idx = slide.get("order_index", si)
        slide_indices.append(slide_idx)
        
        if "blocks" not in slide:
            err(filepath, f"Slide {si}: missing 'blocks'")
            continue
        
        for bi, block in enumerate(slide["blocks"]):
            bid = block.get("id")
            if not bid:
                err(filepath, f"Slide {si}, block {bi}: missing 'id'")
                continue
            if bid in ids_seen:
                err(filepath, f"Duplicate block id: {bid}")
            ids_seen.add(bid)
            
            btype = block.get("type", block.get("block_type"))
            if not btype:
                err(filepath, f"Block {bid}: missing 'type'")
                continue
            
            content = block.get("content", block.get("block_data", {}))
            
            if btype == "interaction":
                interaction_count += 1
                it = content.get("interactionType")
                lesson = content.get("lesson", {})
                
                if not it:
                    err(filepath, f"Block {bid}: interaction missing 'interactionType'")
                    continue
                
                if it == "A":
                    validate_interaction_type_a(filepath, lesson)
                elif it == "B":
                    validate_interaction_type_b(filepath, lesson)
                elif it == "C":
                    validate_interaction_type_c(filepath, lesson)
                elif it == "E":
                    validate_interaction_type_e(filepath, lesson)
                else:
                    err(filepath, f"Block {bid}: unknown interactionType '{it}'")
                    
            elif btype == "quiz":
                validate_quiz(filepath, bid, content)
            elif btype == "text":
                validate_text(filepath, bid, content)
            elif btype == "math":
                validate_math(filepath, bid, content)
            elif btype == "callout":
                validate_callout(filepath, bid, content)
            elif btype in ("image", "code", "reveal", "video", "fill_blank", "ordering", "interactive_graph"):
                pass  # Known types, no deep validation yet
            else:
                warn(filepath, f"Block {bid}: unknown block type '{btype}'")
    
    # Check slide order_index continuity
    if slide_indices != sorted(slide_indices):
        warn(filepath, f"Slide order_index not sequential: {slide_indices}")
    
    # Must have exactly 1 interaction on slide 0
    if interaction_count == 0:
        warn(filepath, f"No interaction blocks found")
    elif interaction_count > 1:
        warn(filepath, f"Multiple interaction blocks ({interaction_count})")

def validate_chapter(filepath, data):
    """Validate a chapter.json file."""
    for field in ("id", "title"):
        if field not in data:
            err(filepath, f"Chapter missing required field: {field}")
    if "order_index" not in data:
        warn(filepath, "Chapter missing order_index")

def process_directory():
    """Walk all raw_courses and validate every JSON file."""
    global file_count
    
    if not os.path.isdir(RAW_COURSES_DIR):
        print(f"Directory not found: {RAW_COURSES_DIR}")
        sys.exit(1)
    
    courses = sorted(os.listdir(RAW_COURSES_DIR))
    print(f"\n{'='*70}")
    print(f"COMPREHENSIVE VALIDATION OF ALL RAW COURSE FILES")
    print(f"{'='*70}")
    
    for course_name in courses:
        course_dir = os.path.join(RAW_COURSES_DIR, course_name)
        if not os.path.isdir(course_dir):
            continue
        
        course_json = os.path.join(course_dir, "course.json")
        if os.path.isfile(course_json):
            file_count += 1
            with open(course_json, encoding="utf-8") as fh:
                try:
                    data = json.load(fh)
                    print(f"\n  COURSE: {course_name} -> {data.get('title', '?')}")
                    if "id" not in data:
                        err(course_json, "Course missing 'id'")
                    if "title" not in data:
                        err(course_json, "Course missing 'title'")
                except json.JSONDecodeError as e:
                    err(course_json, f"Invalid JSON: {e}")
                    continue
        else:
            warn(course_dir, "Missing course.json")
        
        chapters_dir = os.path.join(course_dir, "chapters")
        if not os.path.isdir(chapters_dir):
            warn(course_dir, "Missing chapters/ directory")
            continue
        
        chapter_dirs = sorted(os.listdir(chapters_dir))
        for chapter_name in chapter_dirs:
            chapter_dir = os.path.join(chapters_dir, chapter_name)
            if not os.path.isdir(chapter_dir):
                continue
            
            # Check chapter.json
            chapter_json = os.path.join(chapter_dir, "chapter.json")
            if os.path.isfile(chapter_json):
                file_count += 1
                with open(chapter_json, encoding="utf-8") as fh:
                    try:
                        cdata = json.load(fh)
                        validate_chapter(chapter_json, cdata)
                        print(f"    CHAPTER: {chapter_name} -> {cdata.get('title', '?')} (order: {cdata.get('order_index', '?')})")
                    except json.JSONDecodeError as e:
                        err(chapter_json, f"Invalid JSON: {e}")
            else:
                err(chapter_dir, f"Missing chapter.json in {chapter_name}/")
            
            # Check step files
            steps_dir = os.path.join(chapter_dir, "steps")
            if not os.path.isdir(steps_dir):
                warn(chapter_dir, f"Missing steps/ directory in {chapter_name}/")
                continue
            
            step_files = sorted([f for f in os.listdir(steps_dir) if f.endswith(".json")])
            order_indices = []
            
            for step_file in step_files:
                step_path = os.path.join(steps_dir, step_file)
                file_count += 1
                
                with open(step_path, encoding="utf-8") as fh:
                    try:
                        sdata = json.load(fh)
                    except json.JSONDecodeError as e:
                        err(step_path, f"Invalid JSON: {e}")
                        continue
                
                validate_step(step_path, sdata)
                oi = sdata.get("order_index", "?")
                order_indices.append(oi)
                
                slide_count = len(sdata.get("slides", []))
                quiz_count = sum(1 for s in sdata.get("slides", []) for b in s.get("blocks", []) if b.get("type") == "quiz")
                interaction_types = []
                for s in sdata.get("slides", []):
                    for b in s.get("blocks", []):
                        if b.get("type") == "interaction":
                            c = b.get("content", {})
                            it = c.get("interactionType", "?")
                            mode = c.get("lesson", {}).get("mode", "")
                            if mode:
                                interaction_types.append(f"{it}({mode})")
                            else:
                                interaction_types.append(it)
                
                interactions_str = ", ".join(interaction_types) if interaction_types else "none"
                status = "OK" if not any(step_path in e for e in errors) else "FAIL"
                print(f"      [{status}] {step_file} (order:{oi}, slides:{slide_count}, quizzes:{quiz_count}, interaction:{interactions_str})")
            
            # Check order_index continuity
            numeric_indices = [i for i in order_indices if isinstance(i, int)]
            if numeric_indices:
                expected = list(range(min(numeric_indices), min(numeric_indices) + len(numeric_indices)))
                if sorted(numeric_indices) != expected:
                    warn(steps_dir, f"Step order_indices not contiguous: {sorted(numeric_indices)}, expected {expected}")

def main():
    process_directory()
    
    print(f"\n{'='*70}")
    print(f"SUMMARY")
    print(f"{'='*70}")
    print(f"Files checked: {file_count}")
    print(f"Steps validated: {step_count}")
    print(f"Errors: {len(errors)}")
    print(f"Warnings: {len(warnings)}")
    
    if errors:
        print(f"\n--- ERRORS ({len(errors)}) ---")
        for e in errors:
            print(f"  {e}")
    
    if warnings:
        print(f"\n--- WARNINGS ({len(warnings)}) ---")
        for w in warnings:
            print(f"  {w}")
    
    if not errors:
        print(f"\n  ALL FILES VALID!")
    
    return len(errors)

if __name__ == "__main__":
    sys.exit(main())
