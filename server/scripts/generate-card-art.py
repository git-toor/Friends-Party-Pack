"""
Exploding Kittens Card Art Generator v2
========================================
Generates ONLY artwork (not full cards). React composites
artwork + frame + text = final card.

Usage:
    # Generate with DreamShaper (default):
    python generate-card-art.py --card exploding_kitten
    python generate-card-art.py --card exploding_kitten --workflow dreamshaper

    # Switch workflow:
    python generate-card-art.py --card exploding_kitten --workflow wildcard
    python generate-card-art.py --card exploding_kitten --workflow sdxl_base

    # Generate all cards:
    python generate-card-art.py --all --workflow dreamshaper
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

WORKFLOWS = {
    "dreamshaper": {
        "checkpoint": "dreamshaperXL_alpha2Xl10.safetensors",
        "base": {
            "sampler_name": "dpmpp_2m",
            "scheduler": "karras",
            "steps": 35,
            "cfg": 6.0,
            "denoise": 1.0,
        },
        "hires": {
            "sampler_name": "dpmpp_2m",
            "scheduler": "karras",
            "steps": 15,
            "cfg": 6.0,
            "denoise": 0.35,
            "scale": 1.5,
        },
    },
    "wildcard": {
        "checkpoint": "wildcardxXL_v4Rundiffusion.safetensors",
        "base": {
            "sampler_name": "dpmpp_2m",
            "scheduler": "karras",
            "steps": 35,
            "cfg": 6.0,
            "denoise": 1.0,
        },
        "hires": {
            "sampler_name": "dpmpp_2m",
            "scheduler": "karras",
            "steps": 15,
            "cfg": 6.0,
            "denoise": 0.45,
            "scale": 1.5,
        },
    },
    "animagine": {
        "checkpoint": "animagine-xl-4.0-opt.safetensors",
        "base": {
            "sampler_name": "dpmpp_2m",
            "scheduler": "karras",
            "steps": 30,
            "cfg": 5.0,
            "denoise": 1.0,
        },
        "hires": {
            "sampler_name": "dpmpp_2m",
            "scheduler": "karras",
            "steps": 15,
            "cfg": 5.0,
            "denoise": 0.4,
            "scale": 1.5,
        },
    },
    "scribble": {
        "checkpoint": "sd_xl_base_1.0.safetensors",
        "base": {
            "sampler_name": "dpmpp_2m",
            "scheduler": "karras",
            "steps": 25,
            "cfg": 7.0,
            "denoise": 1.0,
        },
        "refine": {
            "sampler_name": "dpmpp_2m",
            "scheduler": "karras",
            "steps": 25,
            "cfg": 7.0,
            "denoise": 0.65,
            "controlnet": "controlnet-scribble-sdxl-1.0.safetensors",
            "controlnet_strength": 0.7,
        },
    },
    "sdxl_base": {
        "checkpoint": "sd_xl_base_1.0.safetensors",
        "base": {
            "sampler_name": "euler",
            "scheduler": "normal",
            "steps": 25,
            "cfg": 7.0,
            "denoise": 1.0,
        },
        "hires": None,
    },
    "flux": {
        "checkpoint": "flux1-dev.safetensors",
        "vae": "ae.safetensors",
        "clip1": "clip_l.safetensors",
        "clip2": "t5xxl_fp8_e4m3fn.safetensors",
        "base": {
            "sampler_name": "euler",
            "scheduler": "normal",
            "steps": 28,
            "cfg": 1.0,
            "denoise": 1.0,
        },
        "hires": None,
    },
}

CURRENT_WORKFLOW = "flux"

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

def build_full_prompt(prompts, card_data, variant="base", copy_num=None):
    style = prompts["master_style"][variant]["positive"]
    if variant in card_data:
        prompts_field = card_data[variant]
        if "prompts" in prompts_field and isinstance(prompts_field["prompts"], list):
            idx = min(copy_num or 0, len(prompts_field["prompts"]) - 1)
            subject = prompts_field["prompts"][idx]
        else:
            subject = prompts_field["prompt"]
    else:
        subject = card_data["base"]["prompt"]
    return f"{style}, {subject}"

def build_workflow(positive, negative, size, seed, workflow_name):
    cfg = WORKFLOWS[workflow_name]

    if workflow_name == "flux":
        return build_flux_workflow(positive, negative, size, seed, cfg)
    if cfg.get("refine"):
        return build_scribble_workflow(positive, negative, size, seed, cfg)

    return build_standard_workflow(positive, negative, size, seed, cfg)

def build_standard_workflow(positive, negative, size, seed, cfg):
    ckpt = cfg["checkpoint"]
    b = cfg["base"]

    nodes = {
        "4": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": ckpt}
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
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "seed": seed,
                "steps": b["steps"],
                "cfg": b["cfg"],
                "sampler_name": b["sampler_name"],
                "scheduler": b["scheduler"],
                "denoise": b["denoise"],
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0]
            }
        },
    }

    h = cfg.get("hires")
    if h:
        nodes["10"] = {
            "class_type": "LatentUpscaleBy",
            "inputs": {"upscale_method": "nearest-exact", "scale_by": h["scale"], "samples": ["3", 0]}
        }
        nodes["11"] = {
            "class_type": "KSampler",
            "inputs": {
                "seed": seed + 1,
                "steps": h["steps"],
                "cfg": h["cfg"],
                "sampler_name": h["sampler_name"],
                "scheduler": h["scheduler"],
                "denoise": h["denoise"],
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["10", 0]
            }
        }
        nodes["8"] = {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["11", 0], "vae": ["4", 2]}
        }
    else:
        nodes["8"] = {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["3", 0], "vae": ["4", 2]}
        }

    nodes["9"] = {
        "class_type": "SaveImage",
        "inputs": {"filename_prefix": "ek_art", "images": ["8", 0]}
    }

    return nodes

def build_scribble_workflow(positive, negative, size, seed, cfg):
    ckpt = cfg["checkpoint"]
    b = cfg["base"]
    r = cfg["refine"]

    nodes = {
        "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": ckpt}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"text": positive, "clip": ["4", 1]}},
        "7": {"class_type": "CLIPTextEncode", "inputs": {"text": negative, "clip": ["4", 1]}},
        "5": {"class_type": "EmptyLatentImage", "inputs": {"width": size[0], "height": size[1], "batch_size": 1}},
        "3": {"class_type": "KSampler", "inputs": {
            "seed": seed, "steps": b["steps"], "cfg": b["cfg"],
            "sampler_name": b["sampler_name"], "scheduler": b["scheduler"],
            "denoise": b["denoise"],
            "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0],
            "latent_image": ["5", 0]
        }},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
        "20": {"class_type": "Canny", "inputs": {
            "low_threshold": 0.4, "high_threshold": 0.8, "image": ["8", 0]
        }},
        "21": {"class_type": "ControlNetLoader", "inputs": {"control_net_name": r["controlnet"]}},
        "22": {"class_type": "ControlNetApply", "inputs": {
            "conditioning": ["6", 0], "control_net": ["21", 0],
            "image": ["20", 0], "strength": r["controlnet_strength"]
        }},
        "24": {"class_type": "VAEEncode", "inputs": {"pixels": ["8", 0], "vae": ["4", 2]}},
        "11": {"class_type": "KSampler", "inputs": {
            "seed": seed + 1, "steps": r["steps"], "cfg": r["cfg"],
            "sampler_name": r["sampler_name"], "scheduler": r["scheduler"],
            "denoise": r["denoise"],
            "model": ["4", 0], "positive": ["22", 0], "negative": ["7", 0],
            "latent_image": ["24", 0]
        }},
        "25": {"class_type": "VAEDecode", "inputs": {"samples": ["11", 0], "vae": ["4", 2]}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": "ek_art", "images": ["25", 0]}}
    }

    return nodes

def build_flux_workflow(positive, negative, size, seed, cfg):
    ckpt = cfg["checkpoint"]
    b = cfg["base"]

    nodes = {
        "ckpt": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": ckpt}},
        "dual_clip": {"class_type": "DualCLIPLoader", "inputs": {
            "clip_name1": cfg["clip1"], "clip_name2": cfg["clip2"], "type": "flux"
        }},
        "vae_loader": {"class_type": "VAELoader", "inputs": {"vae_name": cfg["vae"]}},
        "pos": {"class_type": "CLIPTextEncode", "inputs": {"text": positive, "clip": ["dual_clip", 0]}},
        "neg": {"class_type": "CLIPTextEncode", "inputs": {"text": negative, "clip": ["dual_clip", 0]}},
        "empty": {"class_type": "EmptyLatentImage", "inputs": {"width": size[0], "height": size[1], "batch_size": 1}},
        "ksampler": {"class_type": "KSampler", "inputs": {
            "seed": seed, "steps": b["steps"], "cfg": b["cfg"],
            "sampler_name": b["sampler_name"], "scheduler": b["scheduler"],
            "denoise": b["denoise"],
            "model": ["ckpt", 0], "positive": ["pos", 0], "negative": ["neg", 0],
            "latent_image": ["empty", 0]
        }},
        "vae_decode": {"class_type": "VAEDecode", "inputs": {"samples": ["ksampler", 0], "vae": ["vae_loader", 0]}},
        "save": {"class_type": "SaveImage", "inputs": {"filename_prefix": "ek_art", "images": ["vae_decode", 0]}},
    }

    return nodes

def generate_image(positive, negative, size=(768, 1024), seed=42, output_path=None, workflow_name=None):
    wf = workflow_name or CURRENT_WORKFLOW
    print(f"  Workflow: {wf}", end="", flush=True)

    workflow = build_workflow(positive, negative, size, seed, wf)

    timeout = 900 if wf == "flux" else 300

    try:
        print(f"  (seed={seed})...", end="", flush=True)
        response = requests.post(f"{COMFYUI_URL}/prompt", json={"prompt": workflow})
        response.raise_for_status()
        result = response.json()
        prompt_id = result.get("prompt_id")
        if not prompt_id:
            print(f" ERROR: {result}")
            return None

        for _ in range(timeout):
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

def generate_card(prompts, card_id, variant="base", manifest=None, copy_num=None):
    card_data = next((c for c in prompts["cards"] if c["id"] == card_id), None)
    if not card_data:
        print(f"Card '{card_id}' not found")
        return False

    variant_key = variant if variant in card_data else "base"
    if variant_key not in card_data:
        print(f"Card '{card_id}' has no '{variant}' variant")
        return False

    positive = build_full_prompt(prompts, card_data, variant_key, copy_num)
    negative = prompts["master_style"][variant]["negative"]
    size = card_data.get("size", [768, 1024])
    seed = card_data.get("seed_base", 42) + (1000 if variant == "nsfw" else 0)

    expansion = "nsfw" if variant == "nsfw" else "base"
    copy_suffix = f".copy{copy_num}" if copy_num is not None else ""
    filename = f"{card_id}.{variant}{copy_suffix}.webp"
    out_path = os.path.join(OUTPUT_DIR, expansion, filename)

    print(f"\n[{card_id}] ({variant}) copy={copy_num}")
    if "prompts" in card_data[variant_key]:
        subjects = card_data[variant_key]["prompts"]
        idx = min(copy_num or 0, len(subjects) - 1)
        print(f"  Subject: {subjects[idx][:70]}...")
    else:
        print(f"  Subject: {card_data[variant_key]['prompt'][:70]}...")

    result = generate_image(positive, negative, size, seed, out_path)

    if result and manifest is not None:
        if "cards" not in manifest:
            manifest["cards"] = {}
        if card_id not in manifest["cards"]:
            manifest["cards"][card_id] = {}
        if variant not in manifest["cards"][card_id]:
            manifest["cards"][card_id][variant] = []
        manifest["cards"][card_id][variant].append(f"/cards/{expansion}/{filename}")
        save_manifest(manifest)
        return True

    return result is not None

def generate_card_back(prompts, manifest=None):
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
    global CURRENT_WORKFLOW

    parser = argparse.ArgumentParser(description="Exploding Kittens Card Art Generator v2")
    parser.add_argument("--card", help="Generate a single card by ID")
    parser.add_argument("--nsfw", action="store_true", help="Use NSFW variant")
    parser.add_argument("--all", action="store_true", help="Generate all cards")
    parser.add_argument("--sample", action="store_true", help="Generate 5 sample cards to lock style")
    parser.add_argument("--back", action="store_true", help="Generate card back")
    parser.add_argument("--continue", dest="continue_gen", action="store_true",
                        help="Continue from last generated (skip existing files)")
    parser.add_argument("--workflow", choices=list(WORKFLOWS.keys()), default="scribble",
                        help="Workflow preset (default: scribble)")

    args = parser.parse_args()
    CURRENT_WORKFLOW = args.workflow

    print(f"Using workflow: {CURRENT_WORKFLOW}")
    print(f"  Checkpoint: {WORKFLOWS[CURRENT_WORKFLOW]['checkpoint']}")
    wf_cfg = WORKFLOWS[CURRENT_WORKFLOW]
    if CURRENT_WORKFLOW == "flux":
        print(f"  VAE: {wf_cfg['vae']}  CLIP: {wf_cfg['clip1']}, {wf_cfg['clip2']}")
        print(f"  Steps: {wf_cfg['base']['steps']}  CFG: {wf_cfg['base']['cfg']}")
    elif "refine" in wf_cfg:
        print(f"  Pass 1: {wf_cfg['base']['steps']} steps  Pass 2 (scribble ControlNet): {wf_cfg['refine']['steps']} steps")
    else:
        h = wf_cfg.get("hires")
        print(f"  Base: {wf_cfg['base']['steps']} steps  Hires: {h['steps'] if h else 'none'} steps")

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
            copies = card.get("copies", 1)
            for copy_num in range(copies):
                print(f"\n[{i+1}/{total}] copy {copy_num+1}/{copies}", end="")
                ok = generate_card(prompts, card["id"], "base", manifest, copy_num)
                if not ok and args.continue_gen:
                    print("  Skipping...")
                    continue
                if args.nsfw and "nsfw" in card:
                    generate_card(prompts, card["id"], "nsfw", manifest, copy_num)

    if not any([args.card, args.all, args.sample, args.back]):
        print("Usage:")
        print("  python generate-card-art.py --card <id>")
        print("  python generate-card-art.py --card <id> --workflow dreamshaper")
        print("  python generate-card-art.py --card <id> --workflow wildcard")
        print("  python generate-card-art.py --card <id> --workflow sdxl_base")
        print("  python generate-card-art.py --all --workflow dreamshaper")
        print("\nWorkflows:")
        for name, cfg in WORKFLOWS.items():
            h = cfg.get("hires")
            print(f"  {name}: {cfg['checkpoint']}  base={cfg['base']['steps']}st hires={h['steps'] if h else 'none'}st")

    print(f"\nManifest: {MANIFEST_FILE}")

if __name__ == "__main__":
    main()
