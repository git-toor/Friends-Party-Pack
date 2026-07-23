import requests, time, json, sys, os
from pathlib import Path

COMFYUI_URL = "http://localhost:8188"

prompt_text = "Defuse card illustration for Exploding Kittens card game. A cat that looks like Dwight Schrute from The Office doing a seminar in front of other office cats that look like Jim, Pam, and Michael. Dwight is carving a CPR dummy face and everyone looks shocked. Cartoon style, vibrant colors, clean black outlines, flat colors, board game art."

negative = "sketch, rough drawing, unfinished, messy lines, pencil, scribble, hand drawn, doodle, photorealistic, 3d render, bad anatomy, blurry, low quality, text, letters, words, numbers, logo, watermark"

workflows = {
    "flux": {
        "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "flux1-dev.safetensors"}},
        "dual_clip": {"class_type": "DualCLIPLoader", "inputs": {"clip_name1": "clip_l.safetensors", "clip_name2": "t5xxl_fp8_e4m3fn.safetensors", "type": "flux"}},
        "vae_loader": {"class_type": "VAELoader", "inputs": {"vae_name": "ae.safetensors"}},
        "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt_text, "clip": ["dual_clip", 0]}},
        "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": negative, "clip": ["dual_clip", 0]}},
        "empty": {"class_type": "EmptyLatentImage", "inputs": {"width": 768, "height": 1024, "batch_size": 1}},
        "ksampler": {"class_type": "KSampler", "inputs": {"seed": 42, "steps": 28, "cfg": 1.0, "sampler_name": "euler", "scheduler": "normal", "denoise": 1.0, "model": ["ckpt", 0], "positive": ["pos", 0], "negative": ["neg", 0], "latent_image": ["empty", 0]}},
        "vae_decode": {"class_type": "VAEDecode", "inputs": {"samples": ["ksampler", 0], "vae": ["vae_loader", 0]}},
        "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": "wf_flux", "images": ["vae_decode", 0]}},
    },
    "dreamshaper": {
        "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "dreamshaperXL_alpha2Xl10.safetensors"}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt_text, "clip": ["4", 1]}},
        "7": {"class_type": "CLIPTextEncode", "inputs": {"text": negative, "clip": ["4", 1]}},
        "5": {"class_type": "EmptyLatentImage", "inputs": {"width": 768, "height": 1024, "batch_size": 1}},
        "3": {"class_type": "KSampler", "inputs": {"seed": 42, "steps": 35, "cfg": 6.0, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0]}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": "wf_dream", "images": ["8", 0]}},
    },
    "wildcard": {
        "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "wildcardxXL_v4Rundiffusion.safetensors"}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt_text, "clip": ["4", 1]}},
        "7": {"class_type": "CLIPTextEncode", "inputs": {"text": negative, "clip": ["4", 1]}},
        "5": {"class_type": "EmptyLatentImage", "inputs": {"width": 768, "height": 1024, "batch_size": 1}},
        "3": {"class_type": "KSampler", "inputs": {"seed": 42, "steps": 35, "cfg": 6.0, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0]}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": "wf_wild", "images": ["8", 0]}},
    },
    "animagine": {
        "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "animagine-xl-4.0-opt.safetensors"}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt_text, "clip": ["4", 1]}},
        "7": {"class_type": "CLIPTextEncode", "inputs": {"text": negative, "clip": ["4", 1]}},
        "5": {"class_type": "EmptyLatentImage", "inputs": {"width": 768, "height": 1024, "batch_size": 1}},
        "3": {"class_type": "KSampler", "inputs": {"seed": 42, "steps": 30, "cfg": 5.0, "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0]}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": "wf_anim", "images": ["8", 0]}},
    },
    "sdxl": {
        "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt_text, "clip": ["4", 1]}},
        "7": {"class_type": "CLIPTextEncode", "inputs": {"text": negative, "clip": ["4", 1]}},
        "5": {"class_type": "EmptyLatentImage", "inputs": {"width": 768, "height": 1024, "batch_size": 1}},
        "3": {"class_type": "KSampler", "inputs": {"seed": 42, "steps": 25, "cfg": 7.0, "sampler_name": "euler", "scheduler": "normal", "denoise": 1.0, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0]}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": "wf_sdxl", "images": ["8", 0]}},
    },
}

out_dir = Path(__file__).parent.parent.parent / "client" / "public" / "art"
workflow_names = list(workflows.keys())

for i, name in enumerate(workflow_names):
    wf = workflows[name]
    prefix = f"wf_{name[:4]}"
    print(f"[{i+1}/{len(workflow_names)}] {name}...", end=" ", flush=True)

    resp = requests.post(f"{COMFYUI_URL}/prompt", json={"prompt": wf})
    if resp.status_code != 200:
        print(f"FAILED ({resp.status_code})")
        continue
    pid = resp.json()["prompt_id"]

    found = False
    for s in range(600):
        time.sleep(1)
        r = requests.get(f"{COMFYUI_URL}/history/{pid}")
        if r.status_code == 200 and r.json().get(pid):
            for out in r.json()[pid]["outputs"].values():
                for img in out.get("images", []):
                    img_r = requests.get(f"{COMFYUI_URL}/view?filename={img['filename']}&type=output")
                    out_path = out_dir / f"_wf_{name}.webp"
                    with open(out_path, "wb") as f:
                        f.write(img_r.content)
                    print(f"Done ({os.path.getsize(out_path)//1024}KB)")
                    found = True
                    break
                if found:
                    break
        if found:
            break
        if s % 10 == 0:
            print(f"{s}s ", end="", flush=True)
    if not found:
        print("TIMEOUT")
