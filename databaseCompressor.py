#!/usr/bin/env python3
"""
Process a JSON list of Magic: The Gathering cards (Scryfall format) and for each
unique card name, select the print with the highest price among either 'usd'
or 'usd_foil'. Output a new JSON list containing only the 'name', 'set', and
'collector_number' of those selected prints.

Usage:
    python select_highest_price.py input.json > output.json
    cat input.json | python select_highest_price.py > output.json
"""

import sys
import json
from collections import defaultdict

def safe_float(value):
    """Convert a string to float, return None if conversion fails or value is None."""
    if value is None:
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None

def max_price(card):
    """Return the highest numeric price among 'usd' and 'usd_foil' for a card."""
    prices = card.get('prices', {})
    usd = safe_float(prices.get('usd'))
    usd_foil = safe_float(prices.get('usd_foil'))
    # Filter out None values and take max
    if usd_foil:
        return usd_foil, True
    if usd:
        return usd, False
    return None, False

def best_print_by_price(prints):
    """From a list of cards, return the one with the highest max_price()."""
    best = None
    best_val = -1.0
    bestIsFoil = False

    for card in prints:
        if card["lang"] != "en":
            continue
        price, isFoil = max_price(card)
        if price is not None and price > best_val:
            best_val = price
            best = card
            bestIsFoil = isFoil
    return best,bestIsFoil

def main():
    with open("bulkdata.json", 'r', encoding='utf-8') as f:
        cards = json.load(f)

    # Group cards by name
    name_to_cards = defaultdict(list)
    for card in cards:
        name = card.get('name')
        if name:
            name_to_cards[name].append(card)

    result = {}
    for name, prints in name_to_cards.items():
        # Separate full‑art prints from the rest
        full_art_prints = [c for c in prints if c.get('full_art') is True]
        candidate = None

        if full_art_prints:
            candidate,isFoil = best_print_by_price(full_art_prints)

        # If no full‑art print had a price (or none existed), fall back to all prints
        if candidate is None:
            candidate,isFoil = best_print_by_price(prints)

        if candidate:
            result[candidate['name']]={
                'name': candidate['name'],
                'set': candidate['set'],
                'collector_number': candidate['collector_number'],
                'is_foil': isFoil
            }


    # Write the result to output.json
    with open("database.json", 'w', encoding='utf-8') as out_f:
        json.dump(result, out_f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    main()