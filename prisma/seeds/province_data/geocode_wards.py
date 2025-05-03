import os
import time
import requests
import psycopg2
from psycopg2.extras import DictCursor
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# ——————————————————————————————————————
# 1. Session với retry/backoff
# ——————————————————————————————————————
session = requests.Session()
retries = Retry(
    total=3,
    backoff_factor=1,
    status_forcelist=[500, 502, 503, 504]
)
adapter = HTTPAdapter(max_retries=retries)
session.mount("https://", adapter)
session.mount("http://", adapter)

# ——————————————————————————————————————
# 2. Kết nối DB (loại bỏ ?schema)
# ——————————————————————————————————————
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user:postgres@localhost:15444/smartgardendb?schema=public"
)
def get_db_connection():
    p = urlparse(DATABASE_URL)
    params = dict(parse_qsl(p.query)); params.pop("schema", None)
    clean = urlunparse(p._replace(query=urlencode(params)))
    conn = psycopg2.connect(clean)
    with conn.cursor() as cur:
        cur.execute('SET search_path TO public;')
    return conn

# ——————————————————————————————————————
# 3. Fetch wards cần geocode (loại trừ đã đánh dấu noResult)
# ——————————————————————————————————————
def fetch_wards(conn):
    with conn.cursor(cursor_factory=DictCursor) as cur:
        cur.execute("""
            SELECT w."code", w."full_name" AS ward_name,
                   d."full_name" AS district_name,
                   p."full_name" AS province_name
            FROM "Wards" w
            JOIN "Districts" d ON w."district_code" = d."code"
            JOIN "Provinces" p ON d."province_code" = p."code"
            WHERE (w."latitude" IS NULL OR w."longitude" IS NULL)
              AND w."isNoResult" = FALSE
            ORDER BY w."code";
        """)
        return cur.fetchall()

# ——————————————————————————————————————
# 4. Cập nhật tọa độ hoặc đánh dấu noResult
# ——————————————————————————————————————
def update_ward_success(conn, code, lat, lon):
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE "Wards"
            SET "latitude"  = %s,
                "longitude" = %s,
                "isNoResult" = FALSE
            WHERE "code" = %s;
        """, (lat, lon, code))
    conn.commit()

def update_ward_noresult(conn, code):
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE "Wards"
            SET "isNoResult" = TRUE
            WHERE "code" = %s;
        """, (code,))
    conn.commit()

# ——————————————————————————————————————
# 5. Geocode trả về status
# ——————————————————————————————————————
def geocode(ward, district, province):
    url = 'https://nominatim.openstreetmap.org/search'
    params = {
        'q': f'{ward}, {district}, {province}, Việt Nam',
        'format': 'jsonv2',
        'limit': 1,
        'countrycodes': 'vn'
    }
    headers = {
        'User-Agent': 'YourAppName/1.0 (your.email@example.com)',
        'Accept-Language': 'vi'
    }

    try:
        resp = session.get(url, params=params, headers=headers, timeout=10)

        # 403 Forbidden → return ngay để main xử lý counter
        if resp.status_code == 403:
            return None, None, 403

        resp.raise_for_status()
        data = resp.json()

        # 200 OK but no data → no result
        if resp.status_code == 200 and not data:
            return None, None, 200

        # Có data
        if data:
            return float(data[0]['lat']), float(data[0]['lon']), resp.status_code

    except requests.exceptions.ReadTimeout:
        print("⚠️ ReadTimeout – bỏ qua lần này.")
    except requests.exceptions.RequestException as e:
        print(f"⚠️ Lỗi khi geocoding {ward}: {e}")

    # Trường hợp lỗi network khác → trả về None, status None
    return None, None, None

# ——————————————————————————————————————
# 6. Main loop chỉ count khi 403, đánh dấu noResult
# ——————————————————————————————————————
def main():
    conn = get_db_connection()
    try:
        wards = fetch_wards(conn)
        print(f"⏳ Found {len(wards)} wards to geocode.")

        consecutive_403 = 0
        for w in wards:
            code      = w['code']
            ward_name = w['ward_name']
            district  = w['district_name']
            province  = w['province_name']

            print(f'✏️ {code}: {ward_name}, {district}, {province} ...', end=' ')
            lat, lon, status = geocode(ward_name, district, province)

            if status == 403:
                consecutive_403 += 1
                print("🚫 403 Forbidden")
            elif status == 200 and lat is None:
                # no result
                update_ward_noresult(conn, code)
                print("⚠️    no result → đánh dấu isNoResult")
                consecutive_403 = 0
            elif lat is not None:
                update_ward_success(conn, code, lat, lon)
                print(f'✅ {lat:.6f}, {lon:.6f}')
                consecutive_403 = 0
            else:
                # lỗi timeout hoặc network, không change isNoResult, reset counter 403
                print("⚠️ skip do network error")
                consecutive_403 = 0

            # Nếu 5 lần 403 liên tiếp → nghỉ 10s
            if consecutive_403 >= 5:
                print("🚨 5×403 liên tiếp, sleep 10s rồi tiếp tục...")
                time.sleep(10)
                consecutive_403 = 0

            time.sleep(1)  # throttle ~1 req/s

    finally:
        conn.close()

if __name__ == '__main__':
    main()
