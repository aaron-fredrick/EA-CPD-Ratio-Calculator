# EA CPD Ratio Calculator (CLI)

This is a simple tool for field members to calculate CPD (Continuing Professional Development) hours in valid 15-minute steps for Engineers Australia (EA) logging.

## Basic Goal & Purpose
When logging CPD items, you can often only enter a single Total Time for an activity, but it may cover multiple engineering fields. EA requires rounding to the nearest 15 minutes. This tool takes your total time and safely calculates the correct 15-minute chunk for each field based on ratios (N/A, Some, Half, Most, All) uniformly without overestimating your hours.

## Usage Guide
1. **Configure Fields**: Open `fields.conf` in any text editor. 
   - Remove the `#` at the start of any line to **enable** that engineering field for your session.
   - Add a `#` at the start of a line to **disable** it.
   - *Note: Risk Management and Business & Management are required and automatically included.*
2. **Run the Tool**:
   - Open a terminal and run: `python __main__.py`
3. **Enter Data**:
   - Enter your Total Hours and Minutes when prompted.
   - For each active field, select the appropriate ratio (1-5).
4. **View Results**:
   - The tool will output the exact, safe minutes to log for each field.

## Note on Web Version
A graphical, browser-based version of this tool is available on the `gh-pages` branch. We recommend using the web version for an even simpler point-and-click interface!
