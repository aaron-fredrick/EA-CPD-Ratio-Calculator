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

def snap_ratio(total_time, actual_mins):
    """
    Finds the EA Option (0, 0.25, 0.50, 0.75, 1.0) that results in a
    calculated time closest to the user's actual minutes spent.
    EA logic uses: floor((total * ratio) / 15) * 15
    """
    options = [0.0, 0.25, 0.50, 0.75, 1.0]
    best_ratio = 0.0
    min_diff = float('inf')
    
    for r in options:
        # EA's internal calculation
        calc = math.floor((total_time * r) / 15.0) * 15
        diff = abs(calc - actual_mins)
        
        # If multiple ratios yield the same closest time, 
        # we pick the one that prioritizes safety or accuracy.
        # We'll take the first one encountered (lowest ratio) to be conservative.
        if diff < min_diff:
            min_diff = diff
            best_ratio = int(r * 100)
    
    # If the user spent time (>0) but the best ratio is N/A (0), 
    # we force at least "Some (25%)" to ensure it's logged.
    if actual_mins > 0 and best_ratio == 0:
        best_ratio = 25
        
    return best_ratio

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
    print("EA CPD Reverse Ratio Calculator (v2)")
    print("="*65)
    print("This version finds the BEST EA BUTTON for your minutes.")
    print("="*65 + "\n")

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
    print(f"{'2. Select these Options for the fields:':<40} | {'EA Claim':<7}")
    print("-" * 65)
    
    for field, mins in time_spans.items():
        snapped = snap_ratio(total_time, mins)
        # Using the safe step rounding user requested for the final check:
        adjusted_minutes = math.floor((total_time * (snapped / 100.0)) / 15) * 15
        
        label = get_label(snapped)
        print(f"{field:<40} | {label:<15} -> {adjusted_minutes}m")

    print("="*65)
    print("\nNote: Snap logic improved to pick the Radio Button closest to your actual spent minutes.")

if __name__ == "__main__":
    main()
