import os

# Disable MKLDNN which often causes issues on Windows
os.environ['FLAGS_use_mkldnn'] = '0'

import re
import cv2
import numpy as np
import paddle
from paddleocr import PaddleOCR
from datetime import datetime

# Initialize PaddleOCR (2.x API)
# use_angle_cls=True to handle rotated text
# use_gpu=False for CPU environments
ocr = PaddleOCR(use_angle_cls=True, lang='en', use_gpu=False, show_log=False)

def parse_medicine_info(ocr_results):
    """
    Parses OCR results to extract medicine information.
    ocr_results: List of results from PaddleOCR 2.x [ [[box], (text, confidence)], ... ]
    """
    text_data = [] # List of (text, confidence, box_height)
    
    if not ocr_results:
        return None

    for line in ocr_results:
        if isinstance(line, list):
            for res in line:
                if isinstance(res, list) and len(res) == 2:
                    text = res[1][0]
                    conf = res[1][1]
                    # Estimate font size from box height
                    box = res[0]
                    height = abs(box[2][1] - box[0][1])
                    text_data.append((text, conf, height))

    if not text_data:
        return None

    # Filter out very low confidence results
    text_data = [t for t in text_data if t[1] > 0.5]
    
    full_text = "\n".join([t[0] for t in text_data])
    
    info = {
        "name": "",
        "generic_name": "",
        "batch_number": "",
        "expiry_date": "",
        "mrp": 0.0,
        "raw_text": full_text
    }

    # Junk keywords to exclude when guessing names
    junk_keywords = [
        'exp', 'batch', 'mrp', 'rs', 'lot', 'mfg', 'date', 'only', 'tabs', 'caps', 'injection',
        'composition', 'dosage', 'schedule', 'warning', 'store in', 'keep out', 'manufactured',
        'marketed', 'reach of children', 'physician', 'prescription', 'temperature', 'moisture',
        'light', 'tablet contains', 'each film coated', 'equivalent to', 'directions', 'indication',
        'side effects', 'use under', 'licence', 'regd', 'trademark', 'co. ltd', 'distributor'
    ]

    # 1. Extraction (Expiry, Batch, MRP) using same regex logic
    expiry_patterns = [
        r'EXP(?:\.|\s+DATE)?[:\s]+(\d{1,2}[/-]\d{2,4})',
        r'EXPIRY[:\s]+(\d{1,2}[/-]\d{2,4})',
        r'BEST\s+BEFORE[:\s]+(\d{1,2}[/-]\d{2,4})',
        r'VALID\s+UPTO[:\s]+(\d{1,2}[/-]\d{2,4})',
        r'(\d{1,2}/\d{2,4})'
    ]
    for pattern in expiry_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match:
            date_str = match.group(1).replace('-', '/')
            try:
                parts = date_str.split('/')
                if len(parts) == 2:
                    month, year = parts
                    month = month.zfill(2)
                    if len(year) == 2: year = "20" + year
                    info["expiry_date"] = f"{year}-{month}-01"
                    break
                elif len(parts) == 3:
                    day, month, year = parts
                    month = month.zfill(2)
                    day = day.zfill(2)
                    if len(year) == 2: year = "20" + year
                    info["expiry_date"] = f"{year}-{month}-{day}"
                    break
            except: pass

    batch_patterns = [
        r'BATCH(?:\s+NO)?\.?[:\s]+([A-Z0-9/-]+)',
        r'B\.?NO\.?[:\s]+([A-Z0-9/-]+)',
        r'LOT[:\s]+([A-Z0-9/-]+)',
        r'B/N[:\s]*([A-Z0-9/-]+)'
    ]
    for pattern in batch_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match:
            info["batch_number"] = match.group(1).strip()
            break

    mrp_patterns = [
        r'MRP[:\s]+(?:RS\.?|₹)?\s*(\d+(?:[,.]\d{2})?)',
        r'(?:RS\.?|₹)\s*(\d+(?:[,.]\d{2})?)'
    ]
    for pattern in mrp_patterns:
        match = re.search(pattern, full_text, re.IGNORECASE)
        if match:
            mrp_val = match.group(1).replace(',', '.')
            info["mrp"] = float(mrp_val)
            break

    # 2. Guessing Brand Name and Generic Name
    # Heuristics: 
    # - Brand names are usually shorter (1-3 words), high font size (box height), and early in the scan.
    # - Generic names are often in brackets () or contain "IP", "BP", "USP".

    candidates = []
    for text, conf, height in text_data:
        lower_text = text.lower()
        if any(kw in lower_text for kw in junk_keywords):
            continue
        if len(text) < 3 or len(text) > 40:
            continue
        candidates.append({'text': text, 'height': height, 'conf': conf})

    if candidates:
        # Sort by height (descending) then confidence
        candidates.sort(key=lambda x: (x['height'], x['conf']), reverse=True)
        
        # 1st Guess for Brand Name: Largest text that isn't junk
        info["name"] = candidates[0]['text']

        # Look for Generic Name
        # Priority 1: Text in brackets
        bracket_match = re.search(r'\(([^)]+)\)', full_text)
        if bracket_match:
            info["generic_name"] = bracket_match.group(1).strip()
        
        # Priority 2: Text with IP/BP/USP standards
        if not info["generic_name"]:
            for cand in candidates:
                if any(std in cand['text'] for std in [' IP', ' BP', ' USP']):
                    # Clean the standard suffix
                    clean_text = re.sub(r'\s+(?:IP|BP|USP).*$', '', cand['text'], flags=re.IGNORECASE).strip()
                    info["generic_name"] = clean_text
                    break
        
        # Priority 3: Second largest candidate if it's different enough from name
        if not info["generic_name"] and len(candidates) > 1:
            if candidates[1]['text'] != info["name"]:
                info["generic_name"] = candidates[1]['text']

    return info

def extract_info_from_image(image_path):
    """
    Runs PaddleOCR on an image and parses the results.
    """
    # 2.x API uses ocr() method
    result = ocr.ocr(image_path, cls=True)
    if not result:
        return None
    
    return parse_medicine_info(result)
