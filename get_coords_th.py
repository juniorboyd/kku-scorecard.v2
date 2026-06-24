import json
import urllib.request
import re
import time

with open('d:/kku-scorecard-main/frontend/lib/mock-data.ts', 'r', encoding='utf-8') as f:
    data = f.read()

# Extract names using regex
names = re.findall(r'name: "(คณะ.*?มข\.|วิทยาลัย.*?มข\.)"', data)
for name in names:
    query = name.replace(' มข.', ' มหาวิทยาลัยขอนแก่น')
    url = 'https://nominatim.openstreetmap.org/search?q=' + urllib.parse.quote(query) + '&format=json&limit=1'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'CoordBot'})
        response = urllib.request.urlopen(req)
        res_data = json.loads(response.read().decode())
        if res_data:
            print(f"{name}: [{res_data[0]['lat']}, {res_data[0]['lon']}]")
        else:
            print(f"{name}: NOT FOUND")
    except Exception as e:
        pass
    time.sleep(1)
