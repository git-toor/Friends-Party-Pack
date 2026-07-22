"""
Generate all card back options for preview.
Run: python preview-card-backs.py
Then open: ../client/public/card-back-preview.html
"""

import json, os, time, requests
from pathlib import Path

COMFYUI_URL = "http://localhost:8188"
PROMPTS_FILE = "card-prompts.json"
OUTPUT_DIR = "../../client/public/cards/backs"

def load_json(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)

def generate_image(prompt, neg, seed, out_path, size=(768, 1024)):
    workflow = {
        "3": {"class_type": "KSampler", "inputs": {"seed": seed, "steps": 25, "cfg": 7.0,
            "sampler_name": "euler", "scheduler": "normal", "denoise": 1,
            "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0]}},
        "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
        "5": {"class_type": "EmptyLatentImage", "inputs": {"width": size[0], "height": size[1], "batch_size": 1}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["4", 1]}},
        "7": {"class_type": "CLIPTextEncode", "inputs": {"text": neg, "clip": ["4", 1]}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": "back", "images": ["8", 0]}}
    }
    try:
        r = requests.post(f"{COMFYUI_URL}/prompt", json={"prompt": workflow})
        pid = r.json().get("prompt_id")
        if not pid: return None
        for _ in range(180):
            time.sleep(1)
            sr = requests.get(f"{COMFYUI_URL}/history/{pid}")
            if sr.status_code == 200 and pid in sr.json():
                for out in sr.json()[pid].get("outputs", {}).values():
                    for img in out.get("images", []):
                        url = f"{COMFYUI_URL}/view?filename={img['filename']}&type=output"
                        data = requests.get(url).content
                        os.makedirs(os.path.dirname(out_path), exist_ok=True)
                        with open(out_path, "wb") as f: f.write(data)
                        return out_path
            print(".", end="", flush=True)
        return None
    except Exception as e:
        print(f"\n  ERROR: {e}")
        return None

def main():
    data = load_json(Path(__file__).parent / PROMPTS_FILE)
    style = data["master_style"]["base"]
    options = data["card_back_options"]
    
    images = []
    print(f"Generating {len(options)} card back options...\n")
    
    for opt in options:
        prompt = f"{opt['prompt']}, {style['positive']}"
        seed = hash(opt["id"]) % 100000
        filename = f"back_{opt['id']}.webp"
        out_path = os.path.join(OUTPUT_DIR, filename)
        
        print(f"[{opt['id']}] {opt['name']} (seed={seed})", end="", flush=True)
        result = generate_image(prompt, style['negative'], seed, out_path)
        if result:
            images.append({"id": opt["id"], "name": opt["name"], "file": f"/cards/backs/{filename}"})
            print(f" -> OK")
        else:
            print(f" -> FAILED")
    
    # Generate HTML preview
    html = """<!DOCTYPE html><html><head>
    <title>Card Back Preview</title>
    <style>
        body { font-family: Arial; background: #111; color: #eee; padding: 20px; text-align: center; }
        h1 { color: #e94560; }
        .grid { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; }
        .card { background: #1a1a3e; border-radius: 10px; padding: 15px; width: 200px; }
        .card img { width: 160px; height: 220px; object-fit: cover; border-radius: 6px; border: 2px solid #333; }
        .card .name { margin-top: 8px; font-size: 12px; color: #aaa; }
        .card .id { font-size: 10px; color: #555; }
        .selected { border: 2px solid #e94560 !important; }
        button { padding: 8px 20px; margin-top: 20px; background: #e94560; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
    </style></head><body>
    <h1>🎴 Choose Your Card Back</h1>
    <p style="color:#888">Which design do you prefer?</p>
    <div class="grid">"""
    
    for img in images:
        html += f"""
        <div class="card">
            <img src="{img['file']}" alt="{img['name']}" onclick="select(this)">
            <div class="name">{img['name']}</div>
            <div class="id">{img['id']}</div>
        </div>"""
    
    html += """</div>
    <p style="color:#888;margin-top:20px">Click an image to highlight it. Let me know which option you prefer!</p>
    <script>function select(el){document.querySelectorAll('.card img').forEach(i=>i.className='');el.className='selected'}</script>
    </body></html>"""
    
    preview_path = os.path.join(Path(__file__).parent.parent.parent, "client", "public", "card-back-preview.html")
    with open(preview_path, "w", encoding='utf-8') as f:
        f.write(html)
    
    print(f"\nPreview: client/public/card-back-preview.html")
    print("Open in browser to compare options.")

if __name__ == "__main__":
    main()
