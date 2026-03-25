import math
import os

COMMON_FIELDS = ["Risk Management", "Business & Management"]

def load_fields(config_path="fields.conf"):
    """Load active fields from the conf file, ignoring lines that start with #."""
    active_fields = []
    if not os.path.exists(config_path):
        return active_fields
        
    with open(config_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                active_fields.append(line)
    return active_fields

def snap_ratio(raw_ratio):
    """
    Snaps a percentage (0-100) to the nearest of EA's allowed options:
    0 (N/A), 25 (Some), 50 (Half), 75 (Most), 100 (All)
    If the ratio > 0 but rounds to 0%, bumps it to 25% (Some) so CPD isn't lost.
    """
    thresholds = [0, 25, 50, 75, 100]
    snapped = min(thresholds, key=lambda t: abs(t - raw_ratio))
    if raw_ratio > 0 and snapped == 0:
        return 25
    return snapped

def get_label(snapped_pct):
    labels = {
        0: "N/A (0%)",
        25: "Some (25%)",
        50: "Half (50%)",
        75: "Most (75%)",
        100: "All (100%)"
    }
    return labels.get(snapped_pct, "Unknown")

def main():
    print("="*65)
    print("EA CPD Reverse Ratio Calculator")
    print("="*65)
    print("Enter the ACTUAL time spent explicitly for each component.")
    print("The tool will output the total time to enter in EA, and")
    print("which Option/Ratio to select for each field.\n")

    active_additional = load_fields()
    all_fields = COMMON_FIELDS + active_additional
    
    time_spans = {}
    for field in all_fields:
        while True:
            val = input(f"Enter minutes spent on '{field}' (or hit Enter for 0): ").strip()
            if not val:
                val = 0
            try:
                mins = int(val)
                if mins > 0:
                    time_spans[field] = mins
                break
            except ValueError:
                print("  Invalid input. Please enter a whole number.")

    if not time_spans:
        print("\nNo time was entered. Exiting.")
        return

    # Total actual time rounded UP to nearest 15 for CPD logging
    raw_total = sum(time_spans.values())
    total_time = int(math.ceil(raw_total / 15.0) * 15)

    if total_time == 0:
        print("\nTotal rounded time is 0. Exiting.")
        return

    print("\n" + "="*65)
    print("RESULTS TO ENTER IN EA PORTAL:")
    print("="*65)
    print(f"1. Enter TOTAL TIME: {total_time} minutes ({total_time//60}h {total_time%60}m)")
    print("-" * 65)
    print(f"{'2. Select these Options for the fields:':<40}")
    print("-" * 65)
    
    for field, mins in time_spans.items():
        raw_pct = (mins / total_time) * 100
        snapped = snap_ratio(raw_pct)
        # Using the safe step rounding user requested for the final check:
        adjusted_minutes = math.floor((total_time * (snapped / 100.0)) / 15) * 15
        
        label = get_label(snapped)
        print(f"{field:<35} | {label:<12} -> (EA calculates {adjusted_minutes}m)")

    print("="*65)

if __name__ == "__main__":
    main()
