import os
import requests
from urllib.parse import urlparse
import time
from pathlib import Path
import random

# Danh sách tên file ảnh
image_files = [
    'post-1-1-20250525T083000Z.png',
    'post-1-2-20250525T083000Z.png',
    'post-1-3-20250525T083000Z.png',
    'post-2-1-20250528T154500Z.png',
    'post-2-2-20250528T154500Z.png',
    'post-3-1-20250530T091500Z.png',
    'post-3-2-20250530T091500Z.png',
    'post-3-3-20250530T091500Z.png',
    'post-4-1-20250531T072000Z.png',
    'post-4-2-20250531T072000Z.png',
    'post-5-1-20250529T143000Z.png',
    'post-5-2-20250529T143000Z.png',
    'post-6-1-20250526T160000Z.png',
    'post-6-2-20250526T160000Z.png',
    'post-7-1-20250527T111500Z.png',
    'post-7-2-20250527T111500Z.png',
    'post-8-1-20250524T134500Z.png',
    'post-8-2-20250524T134500Z.png',
    'post-8-3-20250524T134500Z.png',
    'post-9-1-20250523T100000Z.png',
    'post-9-2-20250523T100000Z.png',
    'post-10-1-20250522T140000Z.png',
    'post-10-2-20250522T140000Z.png',
    'post-10-3-20250522T140000Z.png',
    'post-11-1-20250521T090000Z.png',
    'post-11-2-20250521T090000Z.png',
    'post-12-1-20250520T160000Z.png',
    'post-12-2-20250520T160000Z.png',
    'post-13-1-20250519T110000Z.png',
    'post-13-2-20250519T110000Z.png',
    'post-14-1-20250518T130000Z.png',
    'post-14-2-20250518T130000Z.png',
    'post-14-3-20250518T130000Z.png',
    'post-15-1-20250517T150000Z.png',
    'post-15-2-20250517T150000Z.png',
    'post-16-1-20250516T100000Z.png',
    'post-16-2-20250516T100000Z.png',
    'post-16-3-20250516T100000Z.png',
    'post-17-1-20250515T140000Z.png',
    'post-17-2-20250515T140000Z.png',
    'post-18-1-20250514T110000Z.png',
    'post-18-2-20250514T110000Z.png',
    'post-18-3-20250514T110000Z.png',
    'post-19-1-20250513T160000Z.png',
    'post-19-2-20250513T160000Z.png',
    'post-20-1-20250512T130000Z.png',
    'post-20-2-20250512T130000Z.png',
    'post-20-3-20250512T130000Z.png'
]

# Tạo folder để lưu ảnh
IMAGES_FOLDER = "post"
os.makedirs(IMAGES_FOLDER, exist_ok=True)

# Danh sách URL ảnh về garden với nhiều source backup
garden_image_urls = [
    # Unsplash URLs (đã test hoạt động)
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80",
    "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80",
    "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&q=80",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&q=80",
    "https://images.unsplash.com/photo-1543946207-39bd91e70ca7?w=800&q=80",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=800&q=80",
    "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&q=80",
    "https://images.unsplash.com/photo-1493134799591-2c9eed26201a?w=800&q=80",
    
    # Pixabay backup URLs (miễn phí)
    "https://cdn.pixabay.com/photo/2017/05/08/13/15/spring-2295434_1280.jpg",
    "https://cdn.pixabay.com/photo/2016/11/22/23/44/garden-1851687_1280.jpg",
    "https://cdn.pixabay.com/photo/2018/01/28/11/24/tulips-3113318_1280.jpg",
    "https://cdn.pixabay.com/photo/2017/04/03/15/52/rose-garden-2198453_1280.jpg",
    "https://cdn.pixabay.com/photo/2016/03/26/13/09/cup-of-coffee-1280537_1280.jpg",
    "https://cdn.pixabay.com/photo/2017/08/30/17/12/nature-2697946_1280.jpg",
    "https://cdn.pixabay.com/photo/2017/06/14/16/20/flowers-2402049_1280.jpg",
    "https://cdn.pixabay.com/photo/2016/03/27/07/32/plants-1282142_1280.jpg",
    "https://cdn.pixabay.com/photo/2017/09/04/16/58/nature-2714853_1280.jpg",
    "https://cdn.pixabay.com/photo/2018/05/13/17/34/garden-3397962_1280.jpg",
    "https://cdn.pixabay.com/photo/2017/07/21/23/57/rose-garden-2526402_1280.jpg",
    "https://cdn.pixabay.com/photo/2016/11/18/14/05/brick-wall-1834784_1280.jpg",
    "https://cdn.pixabay.com/photo/2017/04/07/18/23/garden-2211750_1280.jpg",
    "https://cdn.pixabay.com/photo/2018/03/30/15/11/garden-3275808_1280.jpg",
    "https://cdn.pixabay.com/photo/2017/05/07/19/32/flowers-2293718_1280.jpg",
    "https://cdn.pixabay.com/photo/2016/06/15/15/25/garden-1459148_1280.jpg",
    "https://cdn.pixabay.com/photo/2017/07/31/11/22/garden-2557248_1280.jpg",
    "https://cdn.pixabay.com/photo/2018/04/10/11/56/village-3307218_1280.jpg",
    "https://cdn.pixabay.com/photo/2017/08/01/11/48/flowers-2563478_1280.jpg",
    "https://cdn.pixabay.com/photo/2018/05/30/15/31/garden-3441781_1280.jpg",
    "https://cdn.pixabay.com/photo/2017/06/12/19/48/garden-2396729_1280.jpg",
    "https://cdn.pixabay.com/photo/2016/03/05/19/02/garden-1238116_1280.jpg",
    "https://cdn.pixabay.com/photo/2017/03/28/12/11/chairs-2181947_1280.jpg",
    "https://cdn.pixabay.com/photo/2018/06/30/09/29/nature-3506066_1280.jpg",
    "https://cdn.pixabay.com/photo/2017/08/30/17/12/garden-2697944_1280.jpg",
    "https://cdn.pixabay.com/photo/2018/04/18/13/46/garden-3331986_1280.jpg",
    "https://cdn.pixabay.com/photo/2017/05/12/13/25/garden-2307005_1280.jpg",
    "https://cdn.pixabay.com/photo/2018/05/08/21/29/flower-3384155_1280.jpg",
    "https://cdn.pixabay.com/photo/2017/07/18/13/13/garden-2516775_1280.jpg",
    "https://cdn.pixabay.com/photo/2018/03/18/18/06/garden-3237656_1280.jpg",
    "https://cdn.pixabay.com/photo/2017/06/24/13/56/garden-2437101_1280.jpg",
    "https://cdn.pixabay.com/photo/2018/04/18/13/44/garden-3331988_1280.jpg",
    "https://cdn.pixabay.com/photo/2017/08/05/00/12/garden-2582310_1280.jpg",
    "https://cdn.pixabay.com/photo/2018/05/30/15/31/flowers-3441849_1280.jpg",
    "https://cdn.pixabay.com/photo/2017/07/21/23/57/garden-2526398_1280.jpg",
    "https://cdn.pixabay.com/photo/2018/04/15/21/11/garden-3322568_1280.jpg",
    "https://cdn.pixabay.com/photo/2017/06/14/16/20/nature-2402043_1280.jpg",
    "https://cdn.pixabay.com/photo/2018/05/13/17/34/garden-3397964_1280.jpg",
    "https://cdn.pixabay.com/photo/2017/08/30/17/12/garden-2697945_1280.jpg",
    "https://cdn.pixabay.com/photo/2018/03/30/15/11/plants-3275804_1280.jpg",
]

def download_image_with_retry(url_list, filename, folder, max_retries=3):
    """
    Tải ảnh với nhiều URL backup và retry logic
    """
    for attempt in range(max_retries):
        for url in url_list:
            try:
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
                
                response = requests.get(url, headers=headers, timeout=30)
                response.raise_for_status()
                
                # Đường dẫn đầy đủ để lưu file
                filepath = os.path.join(folder, filename)
                
                # Lưu ảnh
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                
                print(f"✅ Đã tải: {filename}")
                return True
                
            except Exception as e:
                continue  # Thử URL tiếp theo
        
        if attempt < max_retries - 1:
            print(f"🔄 Thử lại lần {attempt + 2} cho {filename}")
            time.sleep(2)
    
    print(f"❌ Không thể tải {filename} sau {max_retries} lần thử")
    return False

def main():
    """
    Hàm chính để tải tất cả ảnh với retry logic
    """
    print(f"🚀 Bắt đầu tải {len(image_files)} ảnh về chủ đề garden...")
    print(f"📁 Lưu vào folder: {IMAGES_FOLDER}")
    print("-" * 50)
    
    downloaded_count = 0
    total_images = len(image_files)
    failed_files = []
    
    # Xáo trộn danh sách URL để có sự đa dạng
    random.shuffle(garden_image_urls)
    
    for i, filename in enumerate(image_files):
        print(f"📥 Đang tải ({i+1}/{total_images}): {filename}")
        
        # Tạo danh sách URL để thử (3-4 URL ngẫu nhiên)
        url_subset = garden_image_urls[i % len(garden_image_urls):] + garden_image_urls[:4]
        
        if download_image_with_retry(url_subset, filename, IMAGES_FOLDER):
            downloaded_count += 1
        else:
            failed_files.append(filename)
        
        # Nghỉ ngắn giữa các lần tải
        time.sleep(0.5)
    
    print("-" * 50)
    print(f"🎉 Hoàn thành! Đã tải được {downloaded_count}/{total_images} ảnh")
    print(f"📂 Ảnh được lưu trong folder: {os.path.abspath(IMAGES_FOLDER)}")
    
    if failed_files:
        print(f"\n⚠️  Các file không tải được ({len(failed_files)} file):")
        for file in failed_files:
            print(f"   - {file}")
        print("\n💡 Bạn có thể chạy lại script để thử tải các file còn lại")

if __name__ == "__main__":
    main()