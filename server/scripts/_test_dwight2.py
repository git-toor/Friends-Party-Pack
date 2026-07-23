import requests, time, json, sys, os
from pathlib import Path

COMFYUI_URL = "http://localhost:8188"

negative = "sketch, rough drawing, unfinished, messy lines, pencil, scribble, hand drawn, doodle, photorealistic, 3d render, bad anatomy, blurry, low quality"

prompts = [
    ("dwight_yellow", "Dwight Schrute from The Office reimagined as a cartoon cat, yellow mustard colored short sleeve shirt, brown pants, brown tie, round wire rim glasses, side parted brown hair, smug confident expression, office background with desk, clean cartoon style, flat colors, board game art"),
    ("dwight_beet", "Dwight Schrute as a cartoon cat holding a beet, wearing his Schrute Farms overalls, round glasses, side parted hair, proud goofy grin, farm background with beets, clean cartoon style, flat colors, board game art"),
]

for name, prompt_text in prompts:
    out_path = os.path.abspath(f"../../client/public/art/_test_{name}.webp")
    workflow = {
        "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "flux1-dev.safetensors"}},
        "dual_clip": {"class_type": "DualCLIPLoader", "inputs": {"clip_name1": "clip_l.safetensors", "clip_name2": "t5xxl_fp8_e4m3fn.safetensors", "type": "flux"}},
        "vae_loader": {"class_type": "VAELoader", "inputs": {"vae_name": "ae.safetensors"}},
        "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt_text, "clip": ["dual_clip", 0]}},
        "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": negative, "clip": ["dual_clip", 0]}},
        "empty": {"class_type": "EmptyLatentImage", "inputs": {"width": 768, "height": 1024, "batch_size": 1}},
        "ksampler": {"class_type": "KSampler", "inputs": {"seed": 9996, "steps": 28, "cfg": 1.0, "sampler_name": "euler", "scheduler": "normal", "denoise": 1.0, "model": ["ckpt", 0], "positive": ["pos", 0], "negative": ["neg", 0], "latent_image": ["empty", 0]}},
        "vae_decode": {"class_type": "VAEDecode", "inputs": {"samples": ["ksampler", 0], "vae": ["vae_loader", 0]}},
        "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": "art_test", "images": ["vae_decode", 0]}},
    }
    resp = requests.post(f"{COMFYUI_URL}/prompt", json={"prompt": workflow})
    pid = resp.json()["prompt_id"]
    for i in range(600):
        time.sleep(1)
        r = requests.get(f"{COMFYUI_URL}/history/{pid}")
        if r.status_code == 200 and r.json().get(pid):
            for out in r.json()[pid]["outputs"].values():
                for img in out.get("images", []):
                    img_r = requests.get(f"{COMFYUI_URL}/view?filename={img['filename']}&type=output")
                    with open(out_path, "wb") as f:
                        f.write(img_r.content)
                    print(f"{name}: Done ({os.path.getsize(out_path)//1024}KB)")
                    break
            break
        if i % 10 == 0:
            print(f" {name}: {i}s", end="", flush=True)
