import json
import os
import sqlite3

# Đường dẫn tới thư mục chứa file json của bạn
JSON_DIR = "../data/courses" 
DB_PATH = "calculus.db"

def sync_thumbnails():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Duyệt qua từng file json trong thư mục
    for filename in os.listdir(JSON_DIR):
        if filename.endswith(".json"):
            with open(os.path.join(JSON_DIR, filename), "r", encoding="utf-8") as f:
                data = json.load(f)
                slug = data.get("slug")
                thumb = data.get("thumbnail_url")
                
                if slug and thumb:
                    # Cập nhật link ảnh vào database dựa theo slug
                    cursor.execute(
                        "UPDATE stories SET thumbnail_url = ? WHERE slug = ?",
                        (thumb, slug)
                    )
                    print(f"✅ Đã cập nhật ảnh cho: {slug}")

    conn.commit()
    conn.close()
    print("--- Hoàn tất đồng bộ dữ liệu ảnh ---")

if __name__ == "__main__":
    sync_thumbnails()