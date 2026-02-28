import urllib.request
from bs4 import BeautifulSoup
url = 'https://zh.wikipedia.org/zh-tw/%E8%87%BA%E7%81%A3%E5%A4%A7%E5%B0%88%E9%99%A2%E6%A0%A1%E6%8E%92%E5%90%8D'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read()
soup = BeautifulSoup(html, 'html.parser')
tables = soup.find_all('table', class_='wikitable')
for i, table in enumerate(tables):
    text = table.text
    if '63' in text or '臺北醫學大學' in text or 'QS' in text:
        headers = [th.text.strip() for th in table.find_all(['th', 'td'])[:10]]
        print(f"Table {i+1} sample headers: {headers}")
        for row in table.find_all('tr')[1:]:
            cells = [td.text.strip() for td in row.find_all(['td', 'th'])]
            if '63' in cells or '臺北醫學大學' in cells or '國立臺灣大學' in cells:
                print(cells)

