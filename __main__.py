import math
import os

COMMON_FIELDS = ["Risk Management", "Business & Management"]

RATIO_MAP = {
    "1": ("N/A (0%)", 0.0),
    "2": ("Some (25%)", 0.25),
    "3": ("Half (50%)", 0.50),
    "4": ("Most (75%)", 0.75),
    "5": ("All (100%)", 1.0)
}

def load_fields(config_path="fields.conf"):
    """Load active fields from the conf file, ignoring lines that start with #."""
    active_fields = []
    if not os.path.exists(config_path):
        print(f"Warning: {config_path} not found. Only common fields will be processed.")
        return active_fields
        
    with open(config_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                active_fields.append(line)
    return active_fields

def get_ratio_choice(field_name):
    print(f"\nSelect ratio for '{field_name}':")
    for key, (label, _) in RATIO_MAP.items():
        print(f"  {key} - {label}")
    
    while True:
        choice = input("Enter choice (1-5): ").strip()
        if choice in RATIO_MAP:
            return RATIO_MAP[choice]
        print("Invalid choice. Please enter a number between 1 and 5.")

def calculate_time(total_minutes, ratio_pct):
    """
    Safely calculates time in 15 minute increments.
    e.g., if total=30m, 50%=15m, 75%=22.5m (floored to 15m steps = 15m)
    Formula: floor((total * ratio) / 15) * 15
    """
    return math.floor((total_minutes * ratio_pct) / 15) * 15

def main():
    print("="*50)
    print("EA CPD Hours Ratio Calculator")
    print("="*50)
    
    # Get total time
    print("\nEnter your Total CPD Time:")
    try:
        hours_str = input("Hours: ").strip()
        mins_str = input("Minutes: ").strip()
        
        hours = int(hours_str) if hours_str else 0
        minutes = int(mins_str) if mins_str else 0
    except ValueError:
        print("Invalid input for time. Must be numbers. Exiting.")
        return
        
    total_minutes = (hours * 60) + minutes
    if total_minutes == 0:
        print("Total time is 0. Exiting.")
        return
        
    print(f"\nTotal Time set: {total_minutes} minutes.")

    # Load configured active fields
    active_additional_fields = load_fields()
    all_fields = COMMON_FIELDS + active_additional_fields
    
    results = {}
    
    # Prompt for each field
    for field in all_fields:
        label, pct = get_ratio_choice(field)
        calculated_minutes = calculate_time(total_minutes, pct)
        results[field] = {
            "ratio_label": label,
            "calculated_minutes": calculated_minutes
        }
        
    # Print Summary
    print("\n" + "="*50)
    print("CPD ALLOCATION SUMMARY")
    print("="*50)
    print(f"Total Logged Time: {total_minutes} minutes ({hours}h {minutes}m)")
    print("-" * 50)
    print(f"{'Field':<35} | {'Minutes':<7}")
    print("-" * 50)
    for field, data in results.items():
        if data['calculated_minutes'] > 0:
            print(f"{field:<35} | {data['calculated_minutes']:<7}")
    print("="*50)
    print("\nNote: Times are conservatively rounded down to the nearest 15-minute step.")

if __name__ == "__main__":
    main()
