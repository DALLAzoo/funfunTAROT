"""In-between Shift: run against a LOCAL copy of this trial ZIP.
Usage: pip install playwright && playwright install chromium
       python validation/ad2-responsive-e2e.py
No site files are rewritten. Captures and assertions live in memory.
"""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw): super().__init__(*a,directory=str(root),**kw)
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/'
errors=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  for width,height in [(360,800),(375,667),(768,1024),(1032,1376)]:
   context=browser.new_context(viewport={'width':width,'height':height},is_mobile=True,has_touch=True,device_scale_factor=2)
   page=context.new_page()
   js_errors=[]
   page.on('pageerror',lambda error: js_errors.append(str(error)))
   page.goto(url,wait_until='domcontentloaded')
   page.wait_for_function("!document.querySelector('#shuffleBtn').disabled",timeout=20000)
   page.locator('#shuffleBtn').click()
   page.wait_for_function("document.querySelector('.tarot-card.selectable.is-center') !== null",timeout=25000)
   # A programmatic click has detail=0, the same code path used by keyboard input.
   page.evaluate("document.querySelector('.tarot-card.selectable.is-center').click()")
   page.wait_for_timeout(300)
   page.evaluate("document.querySelector('.tarot-card.selectable.is-center').click()")
   page.wait_for_function("document.querySelector('#resultView').classList.contains('is-revealed')",timeout=25000)
   page.wait_for_timeout(420)  # reading entrance completes
   m=page.evaluate('''() => {
     const r=s=>document.querySelector(s).getBoundingClientRect();
     const heading=r('#resultView > .intro'),card=r('#resultCardHost');
     const reading=r('#resultReading'),actions=r('#resultView .result-actions');
     return {
       headingEnd:heading.bottom,cardTop:card.top,cardEnd:card.bottom,
       readingTop:reading.top,readingEnd:reading.bottom,
       actionsTop:actions.top,actionsEnd:actions.bottom,
       widthOverflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),
       textScrollable:document.querySelector('#resultReading').scrollHeight>=document.querySelector('#resultReading').clientHeight
     };
   }''')
   ok=(m['headingEnd']<=m['cardTop']+2 and m['cardEnd']<=m['readingTop']+2 and
       m['readingEnd']<=m['actionsTop']+2 and m['actionsEnd']<=height+2 and m['widthOverflow']==0 and not js_errors)
   print(f'{width}x{height}: {"PASS" if ok else "FAIL"} {m} JS errors={js_errors}')
   if not ok:errors.append(f'{width}x{height}')
   context.close()
  browser.close()
finally:
 server.shutdown()
if errors:raise SystemExit('Layout or JS checks failed for: '+', '.join(errors))
