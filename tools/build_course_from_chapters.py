import argparse
import json
import os
import glob
import hashlib


def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def collect_steps(steps_dir):
    steps = []
    if not os.path.isdir(steps_dir):
        return steps
    for p in sorted(glob.glob(os.path.join(steps_dir, '*.json'))):
        try:
            steps.append(load_json(p))
        except Exception:
            # skip invalid json
            continue
    return steps


def collect_chapters(chapters_root):
    chapters = []
    if not os.path.isdir(chapters_root):
        return chapters
    for entry in sorted(os.listdir(chapters_root)):
        chapter_dir = os.path.join(chapters_root, entry)
        if not os.path.isdir(chapter_dir):
            continue
        chapter_json = os.path.join(chapter_dir, 'chapter.json')
        if not os.path.isfile(chapter_json):
            continue
        chapter = load_json(chapter_json)
        steps_dir = os.path.join(chapter_dir, 'steps')
        chapter['steps'] = collect_steps(steps_dir)
        chapters.append(chapter)
    return chapters


def encrypt_name(name: str, salt: str | None = None) -> tuple[str, str]:
    # add a small random salt by default to vary the filename
    if salt is None:
        salt = hashlib.sha256(os.urandom(16)).hexdigest()[:8]
    combined = f"{name}|{salt}"
    h = hashlib.sha256(combined.encode('utf-8')).hexdigest()
    return h[:16], salt


def build_course_from_folder(source_folder: str, target_dir: str, encrypt: bool = True) -> str:
    """Read course metadata and chapter folders from source_folder and write
    combined course json into target_dir. Returns written filename.
    """
    source_folder = os.path.abspath(source_folder)
    target_dir = os.path.abspath(target_dir)
    os.makedirs(target_dir, exist_ok=True)

    # allow source to be either a folder containing course.json or a single json file
    if os.path.isfile(source_folder) and source_folder.lower().endswith('.json'):
        meta = load_json(source_folder)
    else:
        meta_path = os.path.join(source_folder, 'course.json')
        if not os.path.isfile(meta_path):
            raise FileNotFoundError(f"course.json not found in {source_folder}")
        meta = load_json(meta_path)
        chapters_root = os.path.join(source_folder, 'chapters')
        meta['chapters'] = collect_chapters(chapters_root)

    slug = meta.get('slug') or meta.get('title') or 'course'
    if encrypt:
        filename_base, salt = encrypt_name(slug)
    else:
        filename_base, salt = slug, ''

    filename = f"{filename_base}.json"
    out_path = os.path.join(target_dir, filename)

    with open(out_path, 'w', encoding='utf-8') as wf:
        json.dump(meta, wf, ensure_ascii=False, indent=2)

    # return path and salt used (salt empty if no encryption)
    return out_path, salt


def main():
    parser = argparse.ArgumentParser(description='Build course JSON from chapter folders')
    parser.add_argument('source', help='Source folder (e.g. data/dao-ham)')
    parser.add_argument('--target', default='data/courses', help='Target directory to write course file')
    parser.add_argument('--no-encrypt', action='store_true', help='Do not encrypt output filename')
    args = parser.parse_args()

    out, salt = build_course_from_folder(args.source, args.target, encrypt=not args.no_encrypt)
    if salt:
        print(f'Wrote course file: {out} (salt={salt})')
    else:
        print(f'Wrote course file: {out}')


if __name__ == '__main__':
    main()
