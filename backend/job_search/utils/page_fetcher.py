from playwright.sync_api import sync_playwright

def get_rendered_html(url, timeout=20000):
    """Fetch a webpage with JavaScript rendering using headless Chromium."""
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(url, timeout=timeout, wait_until="networkidle")
            # Give dynamic sites a tiny extra settle time
            page.wait_for_timeout(500)
            html = page.content()
            browser.close()
            return html
    except Exception as e:
        print(f"⚠️ Render error for {url}: {e}")
        return None
