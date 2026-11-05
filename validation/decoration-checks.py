from pathlib import Path
import re,json
root=Path(__file__).resolve().parents[1]
card=re.compile(r'\.(?:tarot-card|card-(?:face|back|front|edge|inner)|edge-[123]|front-(?:name|sub|symbol)|result-card(?!-host))\b')
visual=re.compile(r'^(background(?:-[\w-]+)?|border(?:-[\w-]+)?|box-shadow|filter|outline(?:-[\w-]+)?|color|text-shadow)$')
def rules(s,ctx=()):
 s=re.sub(r'/\*.*?\*/','',s,flags=re.S);i=0
 while i<len(s):
  k=s.find('{',i)
  if k<0:break
  sel=s[i:k].strip();depth=1;j=k+1
  while depth:
   depth+=(s[j]=='{')-(s[j]=='}');j+=1
  body=s[k+1:j-1]
  if sel.startswith('@'):
   yield from rules(body,ctx+(sel,))
  else:yield ctx,sel,body
  i=j
errors=[]
for f in (root/'css').rglob('*.css'):
 if f.relative_to(root).as_posix()=='css/decoration/cards.css':continue
 for ctx,sel,body in rules(f.read_text()):
  if card.search(sel):
   for d in body.split(';'):
    if ':' in d and visual.match(d.split(':',1)[0].strip()):errors.append(str(f.relative_to(root))+': '+sel+' '+d)
for f in [root/'README.md',root/'CODE_GUIDE.md',root/'VALIDATION.md',*(root/'docs').glob('*.md')]:
 if not f.exists():continue
 for rel in re.findall(r'\]\(([^)]+)\)',f.read_text()):
  if not re.match(r'https?://',rel) and not (f.parent/rel.split('#')[0]).exists():errors.append(str(f)+': broken link '+rel)
assert not errors,'\n'.join(errors)
print(json.dumps({'cardDecorationOutsideOwner':0,'brokenCurrentGuideLinks':0,'pass':True}))
