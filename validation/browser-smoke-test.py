"""Run: pip install playwright && python -m playwright install chromium && python validation/browser-smoke-test.py"""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
import json, time
ROOT=Path(__file__).resolve().parents[1]
server=ThreadingHTTPServer(("127.0.0.1",0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
url=f"http://127.0.0.1:{server.server_port}/"
report=[]
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True)
  for width,height in [(1365,900),(390,844)]:
   page=browser.new_page(viewport={"width":width,"height":height}); errors=[]
   page.on("pageerror",lambda e:errors.append(str(e)))
   result={"viewport":f"{width}x{height}","errors":errors}
   page.goto(url,wait_until="networkidle")
   page.locator("#shuffleBtn").click()
   page.wait_for_function("document.querySelector('#navigation') && !document.querySelector('#navigation').hidden",timeout=30000)
   result["selection_visible"]=page.locator("#navigation").is_visible()
   result["visible_cards"]=page.locator(".tarot-card:visible").count()
   page.screenshot(path=str(ROOT/f"validation/selection-{width}.png"))
   page.locator("#selectBtn").click()
   page.wait_for_function("document.querySelector('#resultView') && !document.querySelector('#resultView').hidden && document.querySelector('#status').textContent.includes('공개됐어요')",timeout=30000)
   result["result_visible"]=page.locator("#resultView").is_visible()
   result["result_cards"]=page.locator(".result-card").count()
   page.screenshot(path=str(ROOT/f"validation/result-{width}.png"))
   page.locator("#resultAgain").click()
   page.wait_for_function("document.querySelector('#navigation') && !document.querySelector('#navigation').hidden",timeout=30000)
   result["repeat_selection_visible"]=page.locator("#navigation").is_visible()
   result["remaining_result_cards"]=page.locator(".result-card").count()
   result["pass"]=all([result["selection_visible"],result["result_visible"],result["repeat_selection_visible"],result["result_cards"]==1,result["remaining_result_cards"]==0,not errors])
   report.append(result);page.close()
  browser.close()
finally:
 server.shutdown()
 (ROOT/"validation/browser-smoke-result.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
print(json.dumps(report,ensure_ascii=False,indent=2))
if not all(x["pass"] for x in report):raise SystemExit(1)
