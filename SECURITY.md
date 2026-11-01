# Security

This plugin is provided as is, and no support channel is offered.

## What the plugin does on your computer

- Runs `git status --porcelain` in your vault folder when Obsidian closes, and when you use **Check working tree now**.
- Reads the output to decide whether to show a warning.
- Makes **no network requests**, and **never modifies, stages or commits files**.

The complete source is the single file [`main.js`](main.js), which you can read before installing.
