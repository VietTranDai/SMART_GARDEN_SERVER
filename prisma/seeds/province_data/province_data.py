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
            print("\n")

    finally:
        conn.close()

if __name__ == '__main__':
    main()
