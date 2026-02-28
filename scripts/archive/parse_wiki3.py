import urllib.request
from bs4 import BeautifulSoup
url = 'https://zh.wikipedia.org/zh-tw/%E8%87%BA%E7%81%A3%E5%A4%A7%E5%B0%88%E9%99%A2%E6%A0%A1%E6%8E%92%E5%90%8D'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read()
soup = BeautifulSoup(html, 'html.parser')

qs_section = soup.find(id='QS世界大學排名_(QS_World_University_Rankings)')
if qs_section:
    table = qs_section.find_next('table')
    headers = [th.text.strip() for th in table.find_all('th')]
    print(f"Headers: {headers}")
    for row in table.find_all('tr')[1:]:
        print([td.text.strip() for td in row.find_all(['td', 'th'])])

