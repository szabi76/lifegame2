# Application Icons

This directory contains application icons for the Windows executable.

## Required Files

### Windows
- `icon.ico` - Windows icon file (256x256 pixels minimum)
  - Used for: Executable icon, taskbar, window title bar
  - Recommended sizes: 16x16, 32x32, 48x48, 256x256
  - Format: ICO file with multiple embedded sizes

### Optional
- `icon.png` - PNG source file (512x512 or higher)
  - Used for: Development, web version
  - Can be converted to ICO using online tools

## Creating Icons

### Online Tools
1. **ICO Convert** - https://icoconvert.com/
   - Upload PNG
   - Select "Custom sizes"
   - Choose: 16, 32, 48, 256
   - Download ICO

2. **CloudConvert** - https://cloudconvert.com/png-to-ico
   - Upload high-res PNG
   - Convert to ICO
   - Download

### Design Guidelines

**Recommended Design:**
- Simple, recognizable shape
- High contrast for visibility at small sizes
- Avoid fine details (won't show at 16x16)
- Use colors from the game's theme
- Consider: Grid pattern, cell shapes, glowing effect

**Color Palette (from game):**
- Background: `#0a0a1a` (dark blue-black)
- Primary: `#00f0ff` (cyan)
- Secondary: `#ff00ff` (magenta)
- Accent: `#00ff88` (green)

### Example Icon Concepts

1. **Grid with Glider**
   - 5x5 grid
   - Classic glider pattern in cyan
   - Dark background

2. **Pulsating Cell**
   - Single large circle
   - Gradient from cyan to blue
   - Glow effect

3. **Multiple Cell Types**
   - 4 cells showing different shapes:
     - Square (normal)
     - Circle (plague)
     - Diamond (superbreed)
     - Hexagon (mutated)

## Default Icon

If no icon is provided, Electron will use a default icon. For production builds, always include a custom icon.

## Testing Icons

After creating your icon:
1. Place `icon.ico` in this `assets/` directory
2. Build the application: `npm run build`
3. Check the executable and installer
4. Verify icon appears in:
   - Windows Explorer
   - Taskbar (when running)
   - Alt+Tab switcher
   - Window title bar
   - Start menu (if installed)

## Current Status

⚠️ **No icon file present** - Using Electron default

To add an icon:
1. Create or download an appropriate ICO file
2. Save as `assets/icon.ico`
3. Rebuild the application
