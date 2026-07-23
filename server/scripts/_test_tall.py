import requests, time, json, sys, os
from pathlib import Path

COMFYUI_URL = "http://localhost:8188"

prompt = "An isolated, central illustration panel for a custom game card, rendered in a clean, playful, cartoon art style similar to Exploding Kittens. The illustration features a chaotic office scene where an orange tabby cat wearing tiny Dwight Schrute glasses, Dwight's side-part hair, a black suit coat jacket, beige shirt, and a tiny red tie, is standing on a desk holding a megaphone and screaming while a wastebasket nearby is on fire. Cat versions of Jim and Pam are reacting with panic in the background. The illustration is perfectly centered within a much taller white canvas, leaving significant empty plain white margin space above the cat's head and below the desk for text placement. No text, numbers, or UI borders. High resolution, sharp detail."

negative = "sketch, rough drawing, unfinished, messy lines, pencil, scribble, hand drawn, doodle, text, letters, words, numbers, logos, watermark, signature, photorealistic, 3d render, bad anatomy, blurry, low quality"

OUTPUT_PATH = os.path.abspath("../../client/public/art/_test_tall.webp")

workflow = {
    "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "flux1-dev.safetensors"}},
    "dual_clip": {"class_type": "DualCLIPLoader", "inputs": {"clip_name1": "clip_l.safetensors", "clip_name2": "t5xxl_fp8_e4m3fn.safetensors", "type": "flux"}},
    "vae_loader": {"class_type": "VAELoader", "inputs": {"vae_name": "ae.safetensors"}},
    "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["dual_clip", 0]}},
    "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": negative, "clip": ["dual_clip", 0]}},
    "empty": {"class_type": "EmptyLatentImage", "inputs": {"width": 768, "height": 1536, "batch_size": 1}},
    "ksampler": {"class_type": "KSampler", "inputs": {"seed": 9999, "steps": 28, "cfg": 1.0, "sampler_name": "euler", "scheduler": "normal", "denoise": 1.0, "model": ["ckpt", 0], "positive": ["pos", 0], "negative": ["neg", 0], "latent_image": ["empty", 0]}},
    "vae_decode": {"class_type": "VAEDecode", "inputs": {"samples": ["ksampler", 0], "vae": ["vae_loader", 0]}},
    "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": "art_test", "images": ["vae_decode", 0]}},
}

print("Generating test at 768x1536...", flush=True)
resp = requests.post(f"{COMFYUI_URL}/prompt", json={"prompt": workflow})
pid = resp.json()["prompt_id"]

for i in range(1200):
    time.sleep(1)
    r = requests.get(f"{COMFYUI_URL}/history/{pid}")
    if r.status_code == 200 and r.json().get(pid):
        for out in r.json()[pid]["outputs"].values():
            for img in out.get("images", []):
                img_r = requests.get(f"{COMFYUI_URL}/view?filename={img['filename']}&type=output")
                os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
                with open(OUTPUT_PATH, "wb") as f:
                    f.write(img_r.content)
                kb = os.path.getsize(OUTPUT_PATH) // 1024
                print(f"Done -> {OUTPUT_PATH} ({kb}KB)")
                sys.exit(0)
    if i % 10 == 0:
        print(f" {i}s", end="", flush=True)
print("\nTIMEOUT")
