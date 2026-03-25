# EA CPD Ratio Calculator (CLI)

This is a simple tool for field members to calculate CPD (Continuing Professional Development) hours for Engineers Australia (EA) logging.

## Basic Goal & Purpose
When logging CPD items, EA requires you to enter ONE Total Time and then select ratios (N/A, Some, Half, Most, All) for the engineering fields involved. This can be mathematically annoying when you know exactly how many minutes you spent on each field, but aren't sure which radio buttons perfectly match your times in EA's 15-minute system.

This tool solves that: you input the **actual minutes** you spent on each field, and the tool calculates the total rounded time to input in EA *and* tells you exactly which Options (Some, Half, etc) to select.

## Usage Guide
1. **Configure Fields**: Open `fields.conf` in any text editor. 
   - Remove the `#` at the start of any line to **enable** that engineering field for your session.
   - Add a `#` at the start of a line to **disable** it.
   - *Note: Risk Management and Business & Management are required and automatically included.*
2. **Run the Tool**:
   - Open a terminal and run: `python __main__.py`
3. **Enter Data**:
   - Enter your actually spent minutes for each field when prompted.
4. **View Results**:
   - The tool will output the exact Total Time to enter into EA, and the specific ratios to click!

## Note on Web Version
A graphical, browser-based version of this tool is available on the `gh-pages` branch. We recommend using the web version for an even simpler point-and-click interface where you can enter Hours AND Minutes per field!
