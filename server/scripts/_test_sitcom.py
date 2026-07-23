import requests, time, json, sys, os
from pathlib import Path

COMFYUI_URL = "http://localhost:8188"

with open(Path(__file__).parent / "card-prompts.json", encoding="utf-8") as f:
    p = json.load(f)
style = p["master_style"]["base"]["positive"]
negative = p["master_style"]["base"]["negative"]

prompt = f"{style}, ross and rachel arguing on a couch, both angry shouting faces, chandler joey phoebe and monica standing around them with shocked expressions, orange couch in a coffee shop living room set, tv show friends inspired scene"

OUTPUT_PATH = os.path.abspath("../../client/public/art/_test_sitcom.webp")

workflow = {
    "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "flux1-dev.safetensors"}},
    "dual_clip": {"class_type": "DualCLIPLoader", "inputs": {"clip_name1": "clip_l.safetensors", "clip_name2": "t5xxl_fp8_e4m3fn.safetensors", "type": "flux"}},
    "vae_loader": {"class_type": "VAELoader", "inputs": {"vae_name": "ae.safetensors"}},
    "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["dual_clip", 0]}},
    "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": negative, "clip": ["dual_clip", 0]}},
    "empty": {"class_type": "EmptyLatentImage", "inputs": {"width": 768, "height": 1024, "batch_size": 1}},
    "ksampler": {"class_type": "KSampler", "inputs": {"seed": 9998, "steps": 28, "cfg": 1.0, "sampler_name": "euler", "scheduler": "normal", "denoise": 1.0, "model": ["ckpt", 0], "positive": ["pos", 0], "negative": ["neg", 0], "latent_image": ["empty", 0]}},
    "vae_decode": {"class_type": "VAEDecode", "inputs": {"samples": ["ksampler", 0], "vae": ["vae_loader", 0]}},
    "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": "art_test", "images": ["vae_decode", 0]}},
}

print("Generating Friends scene...", flush=True)
resp = requests.post(f"{COMFYUI_URL}/prompt", json={"prompt": workflow})
pid = resp.json()["prompt_id"]

for i in range(600):
    time.sleep(1)
    r = requests.get(f"{COMFYUI_URL}/history/{pid}")
    if r.status_code == 200 and r.json().get(pid):
        for out in r.json()[pid]["outputs"].values():
            for img in out.get("images", []):
                img_r = requests.get(f"{COMFYUI_URL}/view?filename={img['filename']}&type=output")
                with open(OUTPUT_PATH, "wb") as f:
                    f.write(img_r.content)
                print(f"Done ({os.path.getsize(OUTPUT_PATH)//1024}KB)")
                sys.exit(0)
    if i % 10 == 0:
        print(f" {i}s", end="", flush=True)
print("\nTIMEOUT")
