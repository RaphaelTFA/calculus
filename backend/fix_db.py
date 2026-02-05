import sqlite3

# Kết nối đúng tên file db của bạn
conn = sqlite3.connect('calculus.db') 
cursor = conn.cursor()

try:
    # Thêm cột vào bảng stories
    cursor.execute("ALTER TABLE stories ADD COLUMN thumbnail_url TEXT")
    conn.commit()
    print("Thành công: Đã thêm cột thumbnail_url!")
except sqlite3.OperationalError:
    print("Lưu ý: Cột này đã tồn tại rồi, không cần thêm nữa.")
finally:
    conn.close()