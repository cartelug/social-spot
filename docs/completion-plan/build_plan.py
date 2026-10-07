"""Render the Social Spot completion blueprint and its editable Markdown source."""
from pathlib import Path
import importlib.util, json, re, html, sys, io
import pillow_heif
pillow_heif.register_heif_opener()
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph, Table, TableStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from fontTools.ttLib import TTFont as FontToolsFont

ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT.parent
OUT = WORK / 'output/pdf'
OUT.mkdir(parents=True, exist_ok=True)
FONT_DIR = WORK / 'qa/plan-fonts'
FONT_DIR.mkdir(parents=True, exist_ok=True)
for name, file in [('Body','dm-sans-latin-400-normal.woff2'),('Bold','dm-sans-latin-700-normal.woff2'),('Display','barlow-condensed-latin-700-normal.woff2'),('Mono','ibm-plex-mono-latin-400-normal.woff2')]:
    dest=FONT_DIR/(name+'.ttf')
    f=FontToolsFont(ROOT/'fonts'/file); f.flavor=None; f.save(dest)
    pdfmetrics.registerFont(TTFont(name,str(dest)))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='Bold',italic='Body',boldItalic='Bold')
INK=HexColor('#171514'); RED=HexColor('#c02b31'); MUTED=HexColor('#625c58'); LINE=HexColor('#ded7ce'); CREAM=HexColor('#f8f5ef')
W,H=595.28,841.89
X=44; CW=W-2*X

def escaped(text):
    value=html.escape(text)
    value=re.sub(r'(https?://[^\s<]+)',lambda m:'<link href="'+m[1]+'" color="#a3242a">'+m[1]+'</link>',value)
    value=re.sub(r'Pages (\d+)-(\d+)',lambda m:'<link href="#page-'+m[1]+'" color="#a3242a">'+m[0]+'</link>',value)
    return value.replace('\n','<br/>')

def para(text,size=10.2,leading=None,color=INK,bold=False):
    s=ParagraphStyle('p',fontName='Bold' if bold else 'Body',fontSize=size,leading=leading or size*1.48,textColor=color,spaceAfter=0)
    return Paragraph(escaped(text),s)

def heading(text):
    return Paragraph(escaped(text),ParagraphStyle('h',fontName='Display',fontSize=29,leading=30,textColor=INK))

def table(rows,size):
    cells=[[para(a,size-0.1,bold=True),para(b,size-0.1)] for a,b in rows]
    t=Table(cells,colWidths=[139,CW-139],hAlign='LEFT')
    padding = 6 if len(rows) >= 8 else 8
    t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),padding),('BOTTOMPADDING',(0,0),(-1,-1),padding),('BACKGROUND',(0,0),(0,-1),CREAM),('LINEBELOW',(0,0),(-1,-1),.45,LINE)]))
    return t

def report_image(im, limit=(1400,1400)):
    """Embed display-resolution JPEGs rather than multi-megapixel phone rasters."""
    from PIL import Image, ImageOps
    im=ImageOps.exif_transpose(im).convert('RGB')
    im.thumbnail(limit,Image.Resampling.LANCZOS)
    buf=io.BytesIO();im.save(buf,'JPEG',quality=88,optimize=True)
    buf.seek(0)
    return ImageReader(buf),im.size

def image_pair(c,p,y):
    if not p.get('images'):return y
    from PIL import Image
    imgs=p['images']; width=(CW-16)/len(imgs); height=149
    for i,info in enumerate(imgs):
        path=ROOT/info['path'] if not str(info['path']).startswith('/') else Path(info['path'])
        reader,(iw,ih)=report_image(Image.open(path),(850,850))
        scale=min(width/iw,height/ih);dw,dh=iw*scale,ih*scale
        left=X+i*(width+16)
        c.setFillColor(CREAM);c.rect(left,y-height,width,height,fill=1,stroke=0)
        c.drawImage(reader,left+(width-dw)/2,y-height+(height-dh)/2,dw,dh)
        cap=para(info['caption'],8.2,color=MUTED); _,hh=cap.wrap(width,30);cap.drawOn(c,left,y-height-hh-5)
    return y-height-35

def blocks(p,size):
    output=[]
    if p.get('lead'):output.extend([para(p['lead'],size+0.5,bold=True),12])
    for b in p.get('body',[]):output.extend([para(b,size),10])
    if p.get('rows'):
        output.extend([para(p.get('rows_title','Implementation contract'),9.2,color=RED,bold=True),7,table(p['rows'],size),12])
    if p.get('check'):output.extend([para('Acceptance evidence',9.2,color=RED,bold=True),6,para(p['check'],size),10])
    if p.get('owner'):output.extend([para(p['owner'],8.5,color=MUTED),8])
    if p.get('refs'):output.append(para('Evidence: '+'; '.join(p['refs']),8.1,color=MUTED))
    return output

def render_page(c,p,num):
    key=f'page-{num}'
    c.bookmarkPage(key);c.addOutlineEntry(f'{num:03d}  {p["title"]}',key,level=0,closed=False)
    c.setFillColor(RED);c.rect(X,H-43,24,3,fill=1,stroke=0)
    c.setFont('Bold',8.7);c.setFillColor(MUTED);c.drawString(X+34,H-44,p['section'].upper())
    c.setFont('Mono',8.5);c.drawRightString(W-X,H-44,f'{num:03d} / 128')
    title=heading(p['title']);_,th=title.wrap(CW,100);title.drawOn(c,X,H-70-th)
    y=H-70-th-19
    y=image_pair(c,p,y)
    chosen=None
    for size in [10.2,10.0,9.8,9.6,9.4,9.3]:
        items=blocks(p,size);height=0
        for item in items:
            if isinstance(item,(int,float)):height+=item
            else:height+=item.wrap(CW,H)[1]
        if y-height>=66:chosen=(items,size,height);break
    if chosen is None:raise ValueError(f'Page {num} overflows: {p["title"]}')
    items,size,height=chosen
    for item in items:
        if isinstance(item,(int,float)):y-=item
        else:
            _,hh=item.wrap(CW,H);y-=hh;item.drawOn(c,X,y)
    p['_layout']={'font_size':size,'body_height':height,'bottom':y,'words':len(re.findall(r'\S+',json.dumps({k:v for k,v in p.items() if not k.startswith('_')},ensure_ascii=False)))}
    c.setStrokeColor(LINE);c.setLineWidth(.5);c.line(X,48,W-X,48)
    c.setFont('Body',8);c.setFillColor(MUTED);c.drawString(X,33,'SOCIAL SPOT  /  WEBSITE COMPLETION BLUEPRINT  /  07 OCT 2026')
    c.setFont('Mono',8);c.drawRightString(W-X,33,str(num))
    c.showPage()

def cover(c):
    c.bookmarkPage('page-1');c.addOutlineEntry('001  Social Spot completion blueprint','page-1',0)
    c.setFillColor(INK);c.rect(0,0,W,H,fill=1,stroke=0)
    c.setFillColor(RED);c.rect(44,H-55,34,4,fill=1,stroke=0)
    c.setFillColor(CREAM);c.setFont('Bold',11);c.drawString(44,H-82,'SOCIAL SPOT / AKRIGHT CITY')
    c.setFont('Display',64)
    for i,t in enumerate(['WEBSITE','COMPLETION','BLUEPRINT']):c.drawString(40,H-158-i*65,t)
    c.setFont('Body',13);c.drawString(44,440,'Product. Engineering. Visual production.')
    c.setFillColor(MUTED);c.rect(44,120,CW,286,fill=1,stroke=0)
    from PIL import Image
    im=Image.open(ROOT/'assets-src/photos/originals/building-restored-v2.jpg').convert('RGB')
    iw,ih=im.size; ch=iw*286/CW
    top=max(0,min(ih-ch,ih*.48-ch/2))
    crop=im.crop((0,round(top),iw,round(top+ch)))
    reader,_=report_image(crop)
    c.drawImage(reader,44,120,CW,286,mask='auto')
    c.setFillColor(RED);c.rect(44,85,99,35,fill=1,stroke=0);c.setFillColor(CREAM);c.setFont('Bold',13);c.drawString(56,96,'128 PAGES')
    c.setFont('Body',9);c.drawString(155,98,'Implementation plan and engineering contracts')
    c.setFont('Mono',9);c.drawString(44,48,'VERSION 2.0  /  07 OCTOBER 2026')
    c.showPage()

def main():
    spec=importlib.util.spec_from_file_location('plan_content',Path(__file__).with_name('plan_content.py'));mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
    pages=mod.make_pages(ROOT)
    assert len(pages)==128,len(pages)
    file=OUT/'Social_Spot_Completion_Plan.pdf'
    c=canvas.Canvas(str(file),pagesize=(W,H),pageCompression=1)
    c.setTitle('Social Spot - Website Completion Blueprint');c.setAuthor('Social Spot');c.setSubject('128-page product, software engineering and image production plan')
    cover(c)
    for num,p in enumerate(pages[1:],2):render_page(c,p,num)
    c.save()
    markdown=['# Social Spot - Website Completion Blueprint','Version 2.0 | 07 October 2026 | 128 pages','This document distinguishes audited implementation, proposed work, owner decisions and acceptance evidence.']
    for i,p in enumerate(pages,1):
        markdown.extend([f'\n## Page {i:03d} - {p["title"]}',f'*{p["section"]}*',p.get('lead',''),*p.get('body',[])])
        if p.get('rows'):
            markdown.extend(['\n| Contract | Detail |','| --- | --- |',*['| '+a.replace('|','/')+' | '+b.replace('|','/')+' |' for a,b in p['rows']]])
        if p.get('check'):markdown.extend(['\n**Acceptance evidence**',p['check']])
        if p.get('owner'):markdown.append(p['owner'])
        if p.get('refs'):markdown.append('Evidence: '+'; '.join(p['refs']))
    (ROOT/'docs/Social_Spot_Completion_Plan.md').write_text('\n\n'.join(markdown)+'\n')
    (OUT/'plan-layout.json').write_text(json.dumps([{'page':i+1,'title':p['title'],**p.get('_layout',{})} for i,p in enumerate(pages)],indent=2))
    print(json.dumps({'pdf':str(file),'pages':len(pages),'words':sum(len(re.findall(r'\S+',s)) for s in markdown),'bytes':file.stat().st_size}))

if __name__=='__main__':main()
