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

def EA_Calculation(totalTimeEA, ratioPct):
    """
    Simulates EA's internal division logic:
    1. floor(total * ratio / 100)
    2. round(result / 15) * 15
    """
    intermediate = math.floor(totalTimeEA * (ratioPct / 100.0))
    # Python 3 rounds to nearest even for .5. 
    # To match standard rounding used in calc, we use a custom round help if needed,
    # but standard round(82/15) is 5 (75m). round(41/15) is 3 (45m).
    return int(round(intermediate / 15.0) * 15)

def snap_ratio(total_time, actual_mins):
    """
    Finds the EA Option (0, 0.25, 0.50, 0.75, 1.0) that results in a
    calculated time closest to the user's actual minutes spent.
    """
    ratios = [0, 25, 50, 75, 100]
    best_ratio = 0
    min_diff = float('inf')
    
    for r in ratios:
        if actual_mins > 0 and r == 0:
            continue
        calc = EA_Calculation(total_time, r)
        diff = abs(calc - actual_mins)
        
        if diff < min_diff or (diff == min_diff and r > best_ratio):
            min_diff = diff
            best_ratio = r
            
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
    print("EA CPD Ratio Calculator (CLI)")
    print("v0.2.0-beta")
    print("="*65)
    print("Determines the exact EA Portal options for your field times.")
    print("="*65 + "\n")

    active_additional = load_fields()
    all_fields = COMMON_FIELDS + active_additional
    
    time_spans = {}
    for field in all_fields:
        while True:
            val = input(f"Enter minutes spent on '{field}' (or Enter for 0): ").strip()
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

    # Find the optimal Total Time that minimizes the error across all fields
    raw_total = sum(time_spans.values())
    
    best_total = 15
    min_error = float('inf')
    best_diff_from_sum = float('inf')
    
    for t in range(15, 6015, 15):
        current_error = 0
        for field, mins in time_spans.items():
            r = snap_ratio(t, mins)
            ea = EA_Calculation(t, r)
            current_error += abs(ea - mins)
            
        diff_from_sum = abs(t - raw_total)
        if current_error < min_error or (current_error == min_error and diff_from_sum < best_diff_from_sum):
            min_error = current_error
            best_diff_from_sum = diff_from_sum
            best_total = t

    total_time = best_total

    print("\n" + "="*65)
    print("RESULTS TO ENTER IN EA PORTAL:")
    print("="*65)
    print(f"1. Enter TOTAL TIME: {total_time} minutes ({total_time//60}h {total_time%60}m)")
    print("-" * 65)
    print(f"{'2. Select these Options for the fields:':<40} | {'EA Claim':<12}")
    print("-" * 65)
    
    for field, mins in time_spans.items():
        snapped = snap_ratio(total_time, mins)
        ea_mins = EA_Calculation(total_time, snapped)
        
        label = get_label(snapped)
        print(f"{field:<40} | {label:<15} -> {ea_mins//60}h {ea_mins%60}m")

    print("="*65)

if __name__ == "__main__":
    main()
