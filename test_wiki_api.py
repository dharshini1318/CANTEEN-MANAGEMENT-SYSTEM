import urllib.request
import json

title = "Dosa_(food)"
url = f"https://en.wikipedia.org/w/api.php?action=query&titles={title}&prop=pageimages&format=json&pithumbsize=500"
req = urllib.request.urlopen(url)
data = json.loads(req.read())
pages = data['query']['pages']
for page_id in pages:
    if 'thumbnail' in pages[page_id]:
        print(pages[page_id]['thumbnail']['source'])
    else:
        print("No image found")
