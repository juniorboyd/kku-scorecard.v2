import urllib.request
import json
import time

places = [
    'Srinagarind Hospital Khon Kaen',
    'College of Computing Khon Kaen University',
    'Faculty of Engineering Khon Kaen University',
    'Faculty of Law Khon Kaen University',
    'Faculty of Science Khon Kaen University',
    'Faculty of Dentistry Khon Kaen University',
    'Faculty of Pharmaceutical Sciences Khon Kaen University',
    'Faculty of Associated Medical Sciences Khon Kaen University',
    'Faculty of Economics Khon Kaen University',
    'Faculty of Nursing Khon Kaen University',
    'Faculty of Architecture Khon Kaen University',
    'Graduate School Khon Kaen University',
    'Faculty of Technology Khon Kaen University',
    'Faculty of Public Health Khon Kaen University',
    'Faculty of Fine and Applied Arts Khon Kaen University',
    'Faculty of Veterinary Medicine Khon Kaen University',
    'Khon Kaen University Nong Khai Campus',
    'Faculty of Agriculture Khon Kaen University',
    'Faculty of Education Khon Kaen University',
    'Faculty of Business Administration and Accountancy Khon Kaen University',
    'Faculty of Humanities and Social Sciences Khon Kaen University'
]

headers = {'User-Agent': 'CoordinateFetcher/1.0'}
for p in places:
    url = 'https://nominatim.openstreetmap.org/search?q=' + urllib.parse.quote(p) + '&format=json&limit=1'
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            if data:
                print(f"{p}: [{data[0]['lat']}, {data[0]['lon']}]")
            else:
                print(f"{p}: NOT FOUND")
    except Exception as e:
        print(f"{p}: ERROR {e}")
    time.sleep(1)
