#!/usr/bin/env python3
"""Validador LOCAL de fichas editoriales que el operador haya guardado con permiso.

No descarga páginas, no evade mecanismos y NO importa automáticamente.
Uso:
  python COMPLETAR-FICHAS-DESDE-HTML-EXPORTADO.py ./fichas_guardadas
Devuelve propuestas para revisión manual en ./propuestas_capturas.json.
"""
import json,re,sys,unicodedata
from pathlib import Path
from urllib.parse import urlparse
from bs4 import BeautifulSoup

def norm(s):
    return ' '.join(unicodedata.normalize('NFD',s).encode('ascii','ignore').decode().lower().split())
def find_count(s):
    s=re.sub(r'\s+',' ',s)
    m=re.search(r'ESTADO\s+EN\s+ARGENTINA\s*:\s*.{0,110}?(\d{1,3})\s+TOMOS?\s+PUBLICADOS?',s,re.I)
    if m:return int(m.group(1)),'estado_en_argentina'
    m=re.search(r'ESTADO\s*:\s*COMPLETA\s*(?:[–\-:]\s*)?\(?\s*(\d{1,3})\s+TOMOS?',s,re.I)
    if m:return int(m.group(1)),'estado_completa'
    if re.search(r'ESTADO\s*:\s*COMPLETA\s*\(?\s*TOMO\s+U[NÚ]NICO',s,re.I):return 1,'tomo_unico'
    return None,'sin_conteo_sencillo'

def inspect(path):
    soup=BeautifulSoup(path.read_text(encoding='utf-8',errors='replace'),'html.parser')
    for tag in soup(['script','style','nav','footer']):tag.decompose()
    heading=soup.select_one('h1')
    title=heading.get_text(' ',strip=True) if heading else None
    canonical=soup.find('link',rel='canonical')
    url=canonical.get('href') if canonical else None
    if url and (urlparse(url).scheme!='https' or urlparse(url).hostname not in ('ivrea.com.ar','www.ivrea.com.ar') or not urlparse(url).path.startswith('/titulo/')):url=None
    body=soup.get_text(' ',strip=True)
    count,evidence=find_count(body)
    # Solamente pistas: ninguna imagen se aprueba automaticamente.
    candidates=[]
    for image in soup.select('img'):
        imgurl=image.get('data-src') or image.get('src') or ''
        if imgurl.startswith('https://') and urlparse(imgurl).hostname in ('ivrea.com.ar','www.ivrea.com.ar'):
            candidates.append({'url':imgurl,'alt':image.get('alt',''), 'validada':False})
    return {'archivo':path.name,'titulo_extraido':title,'url_canonica':url,
            'total_argentina_candidato':count,'regla_conteo':evidence,
            'portadas_candidatas':candidates[:8],'status':'revisar_manualmente'}

def main():
    if len(sys.argv)!=2:
        raise SystemExit('Uso: python COMPLETAR-FICHAS-DESDE-HTML-EXPORTADO.py <directorio-archivos-html>')
    directory=Path(sys.argv[1])
    if not directory.exists():raise SystemExit('Directorio no encontrado')
    results=[inspect(p) for p in sorted(directory.glob('*.html'))]
    dest=Path('propuestas_capturas.json')
    dest.write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
    print('Fichas locales inspeccionadas:',len(results),'Propuestas:',dest)
    print('Ningun dato se integro ni se mostro publicamente. Revisar siempre las candidatas.')
if __name__=='__main__':main()
