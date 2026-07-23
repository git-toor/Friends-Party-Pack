import requests, time, json, sys, os
from pathlib import Path

COMFYUI_URL = "http://localhost:8188"
card_id = sys.argv[1]
copy = int(sys.argv[2])
seed = int(sys.argv[3])
expansion = sys.argv[4]
prompt = sys.argv[5]

OUTPUT_PATH = os.path.abspath(f"../../client/public/art/{expansion}/{card_id}_{copy:03d}.webp")

script_dir = Path(__file__).parent
with open(script_dir / "card-prompts.json", encoding="utf-8") as f:
    prompts_data = json.load(f)

style = prompts_data["master_style"]["base"]["positive"]
negative = prompts_data["master_style"]["base"]["negative"]
positive = f"{style}, {prompt}"

print(f"Generating {card_id}_{copy:03d} (seed={seed})...", flush=True)

workflow = {
    "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "flux1-dev.safetensors"}},
    "dual_clip": {"class_type": "DualCLIPLoader", "inputs": {"clip_name1": "clip_l.safetensors", "clip_name2": "t5xxl_fp8_e4m3fn.safetensors", "type": "flux"}},
    "vae_loader": {"class_type": "VAELoader", "inputs": {"vae_name": "ae.safetensors"}},
    "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": positive, "clip": ["dual_clip", 0]}},
    "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": negative, "clip": ["dual_clip", 0]}},
    "empty": {"class_type": "EmptyLatentImage", "inputs": {"width": 768, "height": 1024, "batch_size": 1}},
    "ksampler": {"class_type": "KSampler", "inputs": {"seed": seed, "steps": 28, "cfg": 1.0, "sampler_name": "euler", "scheduler": "normal", "denoise": 1.0, "model": ["ckpt", 0], "positive": ["pos", 0], "negative": ["neg", 0], "latent_image": ["empty", 0]}},
    "vae_decode": {"class_type": "VAEDecode", "inputs": {"samples": ["ksampler", 0], "vae": ["vae_loader", 0]}},
    "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": "art_gen", "images": ["vae_decode", 0]}},
}

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
                size_kb = os.path.getsize(OUTPUT_PATH) // 1024
                print(f"Done -> {OUTPUT_PATH} ({size_kb}KB)", flush=True)
                sys.exit(0)
    if i % 30 == 0:
        print(f" {i}s", end="", flush=True)
print("\nTIMEOUT")
