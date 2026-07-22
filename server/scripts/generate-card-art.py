"""
Exploding Kittens Card Art Generator v2
========================================
Generates ONLY artwork (not full cards). React composites
artwork + frame + text = final card.

Reference workflows:
  C:\\AI_Workspace\\Cryptarch\\ST-comfyui-sdxl-workflow-template.json
  C:\\AI_Workspace\\Cryptarch\\ST-comfyui-region-workflow.json
  C:\\AI_Workspace\\Cryptarch\\ST-comfyui-map-workflow.json

Usage:
    # Generate 5 sample cards to lock style:
    python generate-card-art.py --sample
    
    # Generate all cards:
    python generate-card-art.py --all
    
    # Generate a single card:
    python generate-card-art.py --card exploding_kitten
    
    # Generate NSFW variant:
    python generate-card-art.py --card exploding_kitten --nsfw
"""

import json
import os
import sys
import time
import argparse
from pathlib import Path

COMFYUI_URL = "http://localhost:8188"
PROMPTS_FILE = "card-prompts.json"
OUTPUT_DIR = "../../client/public/cards"
MANIFEST_FILE = f"{OUTPUT_DIR}/manifest.json"
SAMPLE_IDS = ["exploding_kitten", "defuse", "attack", "nope", "skip"]

try:
    import requests
except ImportError:
    print("ERROR: requests not installed. Run: pip install requests")
    sys.exit(1)

def load_prompts():
    script_dir = Path(__file__).parent
    with open(script_dir / PROMPTS_FILE, encoding='utf-8') as f:
        return json.load(f)

def load_manifest():
    if os.path.exists(MANIFEST_FILE):
        with open(MANIFEST_FILE, encoding='utf-8') as f:
            return json.load(f)
    return {"version": "2.0", "cards": {}, "card_back": {}}

def save_manifest(manifest):
    os.makedirs(os.path.dirname(MANIFEST_FILE), exist_ok=True)
    with open(MANIFEST_FILE, "w", encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)

def build_full_prompt(prompts, card_data, variant="base"):
    """Combine master style + card-specific prompt + quality tags."""
    style = prompts["master_style"][variant]
    subject = card_data[variant]["prompt"] if variant in card_data else card_data["base"]["prompt"]
    
    quality = "8k quality, sharp details, beautiful lighting, SDXL masterpiece"
    composition = "centered character, full body, isolated on transparent background, designed as collectible card game artwork"
    
    return f"{subject}, {style['positive']}, {composition}, {quality}"

def generate_image(positive, negative, size=(768, 1024), seed=42, output_path=None):
    """
    Sends prompt to ComfyUI. Designed to work with a transparent-background
    workflow (e.g., using RMBG or similar background removal node).
    
    Replace the workflow JSON below with your actual 
    ST-comfyui-sdxl-workflow-template.json if different.
    """
    workflow = {
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "seed": seed,
                "steps": 25,
                "cfg": 7.0,
                "sampler_name": "euler",
                "scheduler": "normal",
                "denoise": 1,
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0]
            }
        },
        "4": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"}
        },
        "5": {
            "class_type": "EmptyLatentImage",
            "inputs": {"width": size[0], "height": size[1], "batch_size": 1}
        },
        "6": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": positive, "clip": ["4", 1]}
        },
        "7": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": negative, "clip": ["4", 1]}
        },
        "8": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["3", 0], "vae": ["4", 2]}
        },
        "9": {
            "class_type": "SaveImage",
            "inputs": {"filename_prefix": "ek_art", "images": ["8", 0]}
        }
    }
    
    try:
        print(f"  Queueing prompt (seed={seed})...", end="", flush=True)
        response = requests.post(f"{COMFYUI_URL}/prompt", json={"prompt": workflow})
        response.raise_for_status()
        result = response.json()
        prompt_id = result.get("prompt_id")
        if not prompt_id:
            print(f" ERROR: {result}")
            return None
        
        for _ in range(180):
            time.sleep(1)
            status_resp = requests.get(f"{COMFYUI_URL}/history/{prompt_id}")
            if status_resp.status_code == 200:
                history = status_resp.json()
                if prompt_id in history:
                    outputs = history[prompt_id].get("outputs", {})
                    for node_id, node_output in outputs.items():
                        images = node_output.get("images", [])
                        if images:
                            img_data = images[0]
                            img_url = f"{COMFYUI_URL}/view?filename={img_data['filename']}&subfolder={img_data.get('subfolder', '')}&type=output"
                            img_resp = requests.get(img_url)
                            img_resp.raise_for_status()
                            if output_path:
                                os.makedirs(os.path.dirname(output_path), exist_ok=True)
                                with open(output_path, "wb") as f:
                                    f.write(img_resp.content)
                                print(f" -> {os.path.relpath(output_path)}")
                            return img_resp.content
            print(".", end="", flush=True)
        
        print(" TIMEOUT")
        return None
        
    except requests.exceptions.ConnectionError:
        print(f"\n  ERROR: Cannot connect to ComfyUI at {COMFYUI_URL}")
        return None
    except Exception as e:
        print(f"\n  ERROR: {e}")
        return None

def generate_card(prompts, card_id, variant="base", manifest=None):
    """Generate artwork for a single card variant."""
    card_data = next((c for c in prompts["cards"] if c["id"] == card_id), None)
    if not card_data:
        print(f"Card '{card_id}' not found")
        return False
    
    variant_key = variant if variant in card_data else "base"
    if variant_key not in card_data:
        print(f"Card '{card_id}' has no '{variant}' variant")
        return False
    
    positive = build_full_prompt(prompts, card_data, variant_key)
    negative = prompts["master_style"][variant]["negative"]
    size = card_data.get("size", [768, 1024])
    seed = card_data.get("seed_base", 42) + (1000 if variant == "nsfw" else 0)
    
    expansion = "nsfw" if variant == "nsfw" else "base"
    filename = f"{card_id}.{variant}.webp"
    out_path = os.path.join(OUTPUT_DIR, expansion, filename)
    
    print(f"\n[{card_id}] ({variant})")
    print(f"  Subject: {card_data[variant_key]['prompt'][:70]}...")
    
    result = generate_image(positive, negative, size, seed, out_path)
    
    if result and manifest is not None:
        if "cards" not in manifest:
            manifest["cards"] = {}
        if card_id not in manifest["cards"]:
            manifest["cards"][card_id] = {}
        manifest["cards"][card_id][variant] = f"/cards/{expansion}/{filename}"
        save_manifest(manifest)
        return True
    
    return result is not None

def generate_card_back(prompts, manifest=None):
    """Generate card back artwork."""
    back = prompts.get("card_back", {})
    
    for variant in ["base", "nsfw"]:
        if variant not in back:
            continue
        
        data = back[variant]
        prompt = data["prompt"]
        neg = prompts["master_style"][variant if variant != "nsfw" else "nsfw"]["negative"]
        seed = 42 if variant == "base" else 1042
        
        filename = f"card_back.{variant}.webp"
        out_path = os.path.join(OUTPUT_DIR, filename)
        
        print(f"\n[card_back] ({variant})")
        result = generate_image(prompt, neg, (768, 1024), seed, out_path)
        
        if result and manifest is not None:
            if "card_back" not in manifest:
                manifest["card_back"] = {}
            manifest["card_back"][variant] = f"/cards/{filename}"
            save_manifest(manifest)

def main():
    parser = argparse.ArgumentParser(description="Exploding Kittens Card Art Generator v2")
    parser.add_argument("--card", help="Generate a single card by ID")
    parser.add_argument("--nsfw", action="store_true", help="Use NSFW variant")
    parser.add_argument("--all", action="store_true", help="Generate all cards")
    parser.add_argument("--sample", action="store_true", help="Generate 5 sample cards to lock style")
    parser.add_argument("--back", action="store_true", help="Generate card back")
    parser.add_argument("--continue", dest="continue_gen", action="store_true",
                        help="Continue from last generated (skip existing files)")
    
    args = parser.parse_args()
    
    prompts = load_prompts()
    manifest = load_manifest()
    cards = prompts.get("cards", [])
    
    if args.back or args.all:
        generate_card_back(prompts, manifest)
    
    if args.card:
        generate_card(prompts, args.card, "nsfw" if args.nsfw else "base", manifest)
    
    if args.sample:
        print("=" * 50)
        print("Generating 5 sample cards to lock art style...")
        print("Check the results. If you like the style, run --all")
        print("=" * 50)
        for cid in SAMPLE_IDS:
            card_data = next((c for c in cards if c["id"] == cid), None)
            if card_data:
                generate_card(prompts, cid, "base", manifest)
                if args.nsfw and "nsfw" in card_data:
                    generate_card(prompts, cid, "nsfw", manifest)
        generate_card_back(prompts, manifest)
    
    if args.all:
        total = len(cards)
        for i, card in enumerate(cards):
            print(f"\n[{i+1}/{total}] ", end="")
            ok = generate_card(prompts, card["id"], "base", manifest)
            if not ok and args.continue_gen:
                print("  Skipping...")
                continue
            if args.nsfw and "nsfw" in card:
                generate_card(prompts, card["id"], "nsfw", manifest)
    
    if not any([args.card, args.all, args.sample, args.back]):
        print("Usage:")
        print("  python generate-card-art.py --sample     # 5 test cards")
        print("  python generate-card-art.py --all        # all cards")
        print("  python generate-card-art.py --card <id>  # single card")
        print("  python generate-card-art.py --sample --nsfw  # with NSFW")
    
    print(f"\nManifest: {MANIFEST_FILE}")

if __name__ == "__main__":
    main()
