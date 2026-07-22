"""
Exploding Kittens Card Art Generator
====================================
Generates card art using ComfyUI API.

Setup:
1. Install requirements: pip install requests pillow
2. Start ComfyUI with API enabled (--listen)
3. Update COMFYUI_URL below
4. Run: python generate-card-art.py

Usage:
    # Generate a single card for preview:
    python generate-card-art.py --card exploding_kitten --variant base
    
    # Generate all cards:
    python generate-card-art.py --all
    
    # Generate NSFW variants only:
    python generate-card-art.py --all --nsfw

The workflow templates referenced come from:
  C:\\AI_Workspace\\Cryptarch\\ST-comfyui-sdxl-workflow-template.json
  C:\\AI_Workspace\\Cryptarch\\ST-comfyui-region-workflow.json
  C:\\AI_Workspace\\Cryptarch\\ST-comfyui-map-workflow.json
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

# Try to import requests
try:
    import requests
except ImportError:
    print("ERROR: requests not installed. Run: pip install requests")
    sys.exit(1)

def load_prompts():
    script_dir = Path(__file__).parent
    with open(script_dir / PROMPTS_FILE) as f:
        return json.load(f)

def load_manifest():
    if os.path.exists(MANIFEST_FILE):
        with open(MANIFEST_FILE) as f:
            return json.load(f)
    return {"version": "1.0", "cards": {}, "card_back": {}}

def save_manifest(manifest):
    os.makedirs(os.path.dirname(MANIFEST_FILE), exist_ok=True)
    with open(MANIFEST_FILE, "w") as f:
        json.dump(manifest, f, indent=2)

def generate_image(prompt, negative_prompt, size=(512, 768), seed=42, output_path=None):
    """
    Sends a prompt to ComfyUI API and saves the result.
    
    This uses a simplified prompt format. For production use,
    replace with your actual ComfyUI workflow JSON (from the 
    ST-comfyui-sdxl-workflow-template.json reference).
    """
    # Simple SDXL prompt via ComfyUI API
    workflow = {
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "seed": seed,
                "steps": 20,
                "cfg": 7.5,
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
            "inputs": {"text": prompt, "clip": ["4", 1]}
        },
        "7": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": negative_prompt, "clip": ["4", 1]}
        },
        "8": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["3", 0], "vae": ["4", 2]}
        },
        "9": {
            "class_type": "SaveImage",
            "inputs": {"filename_prefix": "ek_card", "images": ["8", 0]}
        }
    }
    
    try:
        # Queue the prompt
        response = requests.post(f"{COMFYUI_URL}/prompt", json={"prompt": workflow})
        response.raise_for_status()
        result = response.json()
        prompt_id = result.get("prompt_id")
        
        if not prompt_id:
            print(f"  ERROR: No prompt_id in response: {result}")
            return None
        
        print(f"  Queued: {prompt_id}", end="")
        
        # Poll for completion
        for _ in range(120):  # 2 minute timeout
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
                            # Download the image
                            img_url = f"{COMFYUI_URL}/view?filename={img_data['filename']}&subfolder={img_data.get('subfolder', '')}&type=output"
                            img_resp = requests.get(img_url)
                            img_resp.raise_for_status()
                            
                            if output_path:
                                os.makedirs(os.path.dirname(output_path), exist_ok=True)
                                with open(output_path, "wb") as f:
                                    f.write(img_resp.content)
                                print(f" -> {output_path}")
                            
                            return img_resp.content
            print(".", end="", flush=True)
        
        print(" TIMEOUT")
        return None
        
    except requests.exceptions.ConnectionError:
        print(f"\n  ERROR: Cannot connect to ComfyUI at {COMFYUI_URL}")
        print(f"  Make sure ComfyUI is running: python main.py --listen")
        return None
    except Exception as e:
        print(f"\n  ERROR: {e}")
        return None

def generate_card(prompts, card_id, variant="base", output_dir=OUTPUT_DIR, manifest=None):
    """Generate art for a single card variant."""
    all_cards = prompts.get("cards", [])
    card_data = next((c for c in all_cards if c["id"] == card_id), None)
    if not card_data:
        print(f"Card '{card_id}' not found in prompts")
        return False
    
    prompt_key = f"{variant}_prompt"
    if prompt_key not in card_data:
        print(f"Card '{card_id}' has no {variant} prompt")
        return False
    
    expansion = card_data["expansion"]
    prompt = card_data[prompt_key]
    style = prompts.get("style", {})
    negative = style.get("negative", "")
    
    if variant == "nsfw":
        negative = style.get("nsfw_negative", negative)
    
    full_prompt = f"{prompt}, {style.get('base', '')}"
    size = card_data.get("size", [512, 768])
    seed = card_data.get("seed_base", 42) + (1000 if variant == "nsfw" else 0)
    
    filename = f"{card_id}.{variant}.webp"
    out_path = os.path.join(output_dir, expansion, filename)
    
    print(f"\nGenerating: {card_id} ({variant})")
    print(f"  Prompt: {full_prompt[:80]}...")
    
    result = generate_image(full_prompt, negative, size, seed, out_path)
    
    if result and manifest is not None:
        if "cards" not in manifest:
            manifest["cards"] = {}
        if card_id not in manifest["cards"]:
            manifest["cards"][card_id] = {}
        manifest["cards"][card_id][variant] = f"/cards/{expansion}/{filename}"
        save_manifest(manifest)
        return True
    
    return result is not None

def generate_card_back(prompts, output_dir=OUTPUT_DIR, manifest=None):
    """Generate card back art."""
    back_data = prompts.get("card_back", {})
    style = prompts.get("style", {})
    
    for variant in ["base", "nsfw"]:
        prompt_key = f"{variant}_prompt"
        if prompt_key not in back_data:
            continue
        
        prompt = f"{back_data[prompt_key]}, {style.get('base', '')}"
        negative = style.get("negative", "") if variant == "base" else style.get("nsfw_negative", "")
        seed = 42 if variant == "base" else 1042
        
        filename = f"card_back.{variant}.webp"
        out_path = os.path.join(output_dir, filename)
        
        print(f"\nGenerating: card_back ({variant})")
        result = generate_image(prompt, negative, (512, 768), seed, out_path)
        
        if result and manifest is not None:
            if "card_back" not in manifest:
                manifest["card_back"] = {}
            manifest["card_back"][variant] = f"/cards/{filename}"
            save_manifest(manifest)

def main():
    parser = argparse.ArgumentParser(description="Generate Exploding Kittens card art")
    parser.add_argument("--card", help="Generate a single card by ID")
    parser.add_argument("--variant", choices=["base", "nsfw"], default="base", help="Variant to generate")
    parser.add_argument("--all", action="store_true", help="Generate all cards")
    parser.add_argument("--nsfw", action="store_true", help="Include NSFW variants")
    parser.add_argument("--back", action="store_true", help="Generate card back")
    
    args = parser.parse_args()
    
    prompts = load_prompts()
    manifest = load_manifest()
    cards = prompts.get("cards", [])
    
    if args.back or (args.all and not args.card):
        print("=" * 50)
        print("Generating card back art...")
        generate_card_back(prompts, manifest=manifest)
    
    if args.card:
        generate_card(prompts, args.card, args.variant, manifest=manifest)
    
    if args.all:
        print("=" * 50)
        print(f"Generating {'NSFW ' if args.nsfw else ''}card art for {len(cards)} cards...")
        
        for i, card in enumerate(cards):
            print(f"\n[{i+1}/{len(cards)}] ", end="")
            generate_card(prompts, card["id"], "base", manifest=manifest)
            
            if args.nsfw and "nsfw_prompt" in card:
                generate_card(prompts, card["id"], "nsfw", manifest=manifest)
    
    print("\n" + "=" * 50)
    print(f"Manifest saved to: {MANIFEST_FILE}")
    print("Done!")

if __name__ == "__main__":
    main()
