# Advanced Game of Life

An enhanced implementation of Conway's Game of Life featuring advanced cellular mechanics, reaction-diffusion chemistry, resource systems, and stunning visual effects. This project extends the classic cellular automaton with multiple cell types, mutations, environmental systems, and interactive catastrophes.

![Advanced Game of Life](https://img.shields.io/badge/version-2.0-blue.svg)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)
![HTML5](https://img.shields.io/badge/HTML5-Canvas-orange.svg)

## Features

### Core Mechanics
- **Classic Conway's Rules**: Traditional Game of Life rules with birth, survival, and death
- **Interactive Drawing**: Click and drag to create custom cell patterns
- **Adjustable Speed**: Control simulation speed (1-60 FPS)
- **Grid Customization**: Adjustable cell size and optional grid display
- **Edge Wrapping**: Toggle between wrapped and bounded universes
- **Aging Visualization**: Visual aging effects showing cell longevity

### Advanced Cell Types

**Cell Lifecycle**: All cells age through a 100-generation lifecycle with visual hue-based aging dynamics.

#### 🦠 Plague Cells (Red Circles)
- **Shape**: Circle with pulsing red glow (1.5 second pulse period)
- **Color spectrum**: Red to Red-Orange (HSL: 0° → 25°)
  - Young (0-20 gen): Bright red `hsl(0, 100%, 55%)`
  - Aging (20-100 gen): Shifts to red-orange, decreases saturation/lightness
  - Glow: 15px pulsating shadow blur (70-130% intensity)
- **Resource consumption**: 0.02 per generation (2× normal rate)
- **Infection spread**: 25% chance to infect neighboring cells each generation
- **Mortality**: After age 5, 40% chance of death per generation
- **Special behavior**: Cells born in catastrophe chaos zones are automatically plagued
- **Trigger**: Click "🦠 Infect" button (affects 25% of living cells)

#### ⭐ Superbreed Cells (Gold Diamonds)
- **Shape**: Diamond/4-point star with golden glow (1.2 second pulse period)
- **Color spectrum**: Yellow to Gold (HSL: 55° → 40°)
  - Young (0-20 gen): Bright yellow `hsl(55, 100%, 60%)`
  - Aging (20-100 gen): Shifts to gold-orange, decreases saturation/lightness
  - Glow: 18px pulsating shadow blur (75-125% intensity)
- **Enhanced survival**: Survive with 1-4 neighbors (vs normal 2-3)
- **Enhanced reproduction**: Can birth new cells with only 2 superbreed neighbors
- **Inheritance**: 30% chance to pass superbreed trait to offspring
- **Trigger**: Click "⭐ Enhance" button (affects 20% of living cells)

#### ✨ Cleaner Cells (Cyan Pulsating Circles)
- **Shape**: Pulsating circle with strong cyan glow (1.0 second pulse period)
- **Color spectrum**: Cyan to Green (HSL: 180° → 160°)
  - Young (0-20 gen): Bright cyan `hsl(180, 100%, 60%)`
  - Aging (20-100 gen): Shifts to cyan-green, decreases saturation/lightness
  - Glow: 20px pulsating shadow blur (85-115% intensity) - strongest glow
- **Cleaning power**: Remove all special properties from neighboring cells
- **Particle effects**: 5% chance per generation to emit cyan sparkle particles
- **Inheritance**: 30% chance to pass cleaner trait to offspring
- **Priority**: Cleaner trait overrides all other cell types
- **Trigger**: Click "✨ Deploy" button (affects 15% of living cells)

#### 🧬 Mutated Cells (Purple Hexagons)
- **Shape**: 6-point hexagon with purple glow (1.8 second pulse period)
- **Color spectrum**: Purple to Magenta (HSL: 280° → 300°)
  - Young (0-20 gen): Bright purple `hsl(280, 100%, 60%)`
  - Aging (20-100 gen): Shifts to magenta, decreases saturation/lightness
  - Glow: 16px pulsating shadow blur (70-130% intensity)
- **Mutation rate**: 5% base rate (adjustable 0-20% via slider)
- **Hybrid abilities**: Gain superbreed survival (1-4 neighbors) while keeping original specialty
- **Stackable**: Can be mutated plague, mutated superbreed, etc.
- **Removal**: Can only be removed by cleaner cells

#### ⬜ Normal Cells (Themed Squares)
- **Shape**: Square with subtle glow (8px shadow blur)
- **Color spectrum**: Theme-dependent HSL with hue aging
  - **Neon**: Cyan to Blue (HSL: 195° → 210°)
  - **Ocean**: Cyan to Blue (HSL: 185° → 210°)
  - **Sunset**: Gold to Orange-Red (HSL: 45° → 15°)
  - **Matrix**: Bright Green to Green (HSL: 125° → 140°)
  - **Fire**: Orange to Red (HSL: 35° → 0°)
- **Aging dynamics**: 100-generation lifecycle with continuous hue shift, saturation and lightness decrease

### Environmental Systems

#### ⚡ Resource/Energy System
- **Initial state**: Each grid cell starts at 100% resources (value: 1.0)
- **Consumption**: Normal cells consume 0.01 per generation, plague cells consume 0.02
- **Regeneration**: Resources regenerate at 0.5% (0.005) per generation, up to 100%
- **Death penalty**: When resources < 30%, cells have 30% increased death chance
- **Birth requirement**: Birth requires > 20% resources available at that location
- **Display**: Average resource level shown in "⚡" indicator as percentage
- **RD interaction**: Reaction-diffusion chemical A increases resources, B decreases them

#### 💥 Catastrophe System
- **Impact zone**: Random radius between 10-20 cells
- **Immediate effect**: Instantly kills all cells within blast radius
- **Chaos markers**: Creates pulsating neon gradient markers at impact site
- **Marker intensity**: Based on distance from center, decays at 0.5 per generation
- **Infection zone**: Cells born in chaos zones (intensity > 0) are automatically plagued
- **Visual effects**:
  - Spawns 30 explosion particles (colors: magenta, pink, red, orange)
  - Death particles (gray) spawn for 10% of destroyed cells
  - Pulsating radial gradient with RGB(255,0,255) to RGB(0,255,255) spectrum
- **Trigger**: Click "💥 Destroy" button
- **Counter**: Tracks total number of catastrophes triggered

#### 🧪 Reaction-Diffusion Chemistry (Gray-Scott Model)
- **System**: Simulates two interacting chemicals creating organic patterns
- **Chemical A**: Nutrients - increases resource levels in grid cells
- **Chemical B**: Toxins - decreases resource levels in grid cells
- **Cell interaction**: Living cells consume A and produce B, creating feedback loops
- **Algorithm**: Gray-Scott equations with 9-point weighted diffusion stencil
- **Update frequency**: Every 2 frames for performance optimization
- **Topology**: Respects edge wrapping settings (toroidal if enabled)
- **Presets** (Feed, Kill, Diffusion A, Diffusion B):
  - **Coral**: f=0.0545, k=0.062, Da=1.0, Db=0.5 (default)
  - **Mitosis**: f=0.0367, k=0.0649, Da=1.0, Db=0.5
  - **Waves**: f=0.014, k=0.054, Da=1.0, Db=0.5
  - **Maze**: f=0.029, k=0.057, Da=1.0, Db=0.5
  - **Fingerprint**: f=0.055, k=0.062, Da=1.0, Db=0.5
- **Adjustable parameters**:
  - Feed rate (f): 0.010-0.080
  - Kill rate (k): 0.040-0.070
  - Diffusion A: 0.8-1.2
  - Diffusion B: 0.4-0.6
  - Opacity: 0-100% (blending with cellular layer)
- **Color mapping**: HSL based on chemical concentrations, creating dynamic patterns
- **Enable/Disable**: Toggle via "Enable RD" checkbox in Chemistry section
- **Reset**: Reinitialize with random seed patterns

### Visual Features

#### 🎨 Themes
Choose from 5 distinct color themes (affects normal cells and UI):
- **Neon** (default): Cyan to blue gradient (#00f0ff → #0050ff)
- **Ocean**: Turquoise to blue gradient (#00fff7 → #0050ff)
- **Sunset**: Gold to red gradient (#ffd23f → #ff5647)
- **Matrix**: Neon green gradient (#39ff14 → #006617)
- **Fire**: Orange to red gradient (#ffa500 → #ff0000)

#### 📐 Classic Patterns
Pre-built patterns for exploration (loaded at grid center):
- **Glider**: Small spaceship that moves diagonally
- **Pulsar**: Period-3 oscillator with symmetrical structure
- **LWSS**: Lightweight spaceship that travels horizontally
- **Gosper Glider Gun**: First discovered infinite growth pattern
- **Pentadecathlon**: Period-15 oscillator
- **Acorn**: Methuselah pattern that stabilizes after 5,206 generations

#### ✨ Particle System
Three types of physics-based particles with independent lifecycles:
- **Explosion particles**:
  - Spawned: 30 per catastrophe event
  - Colors: Magenta (#ff00ff), pink (#ff0088), red (#ff0000), orange (#ff8800)
  - Max life: 20 frames
  - Speed: 2-5 pixels per frame with 95% friction
  - Size: 2-5 pixels with shadow blur
- **Sparkle particles**:
  - Spawned: 5% chance per cleaner cell per generation
  - Color: Cyan (#48dbfb)
  - Max life: 30 frames
  - Speed: 0.5-1.5 pixels per frame with 95% friction
  - Size: 1-3 pixels with pulsating glow
- **Death particles**:
  - Spawned: 10% of cells killed in catastrophe
  - Color: Gray (#888888)
  - Max life: 30 frames
  - Speed: 0.5-1.5 pixels per frame with 95% friction

#### 📊 Data Visualization
- **Population Timeline Graph**:
  - Tracks last 100 generations of population history
  - Separate lines for: Total, Normal, Plague, Superbreed, Cleaner, Mutated
  - Auto-scaling Y-axis based on max population
  - Rendered on 240×140px canvas with grid background
  - Theme-colored primary line with semi-transparent type-specific lines
- **Bar Chart**:
  - Real-time population distribution by cell type
  - Pulsating bars (period: 1.5 seconds, amplitude: ±10%)
  - Gradient fills with type-specific colors
  - Value labels above each bar, emoji labels below
  - Total population displayed at top
- **Statistics Dashboard**:
  - Generation count, total population, actual FPS
  - Cell type counts (plague, superbreed, cleaner, mutated)
  - Catastrophe counter
  - Average resource percentage across all cells


## Getting Started

### Windows Executable (Recommended)

**Performance-optimized native Windows application** with GPU acceleration and multi-threading.

#### Quick Start
1. Download the latest release from GitHub
2. Run `Advanced Game of Life-2.0.0-x64.exe` (installer) or `Advanced Game of Life-2.0.0-portable.exe` (no install)
3. Enjoy enhanced performance!

#### Build from Source
```bash
# Install dependencies
npm install

# Run in development mode
npm start

# Build Windows executable
npm run build
```

See [BUILD.md](BUILD.md) for detailed build instructions.

**Performance Benefits:**
- 🚀 **2.5x faster** generation computation with Web Workers
- 💪 **GPU acceleration** for smooth 60 FPS rendering
- ⚡ **Native execution** with direct hardware access
- 🎯 **Optimized memory** usage (50% reduction vs browser)
- 🔧 **Sub-second startup** time

### Web Browser Version

For quick testing without installation:

1. Clone the repository:
```bash
git clone https://github.com/szabi76/lifegame2.git
cd lifegame2
```

2. Open `index.html` in your web browser:
```bash
# On macOS
open index.html

# On Linux
xdg-open index.html

# On Windows
start index.html
```

Or simply drag `index.html` into your browser window.

### Usage

#### Basic Controls
- **Play/Pause (▶)**: Start or stop the simulation
- **Step (⏭)**: Advance one generation
- **Random (🎲)**: Fill grid with random cells
- **Clear (🗑)**: Remove all cells
- **Click/Drag**: Draw cells on the canvas

#### Advanced Actions
- **🦠 Infect**: Trigger plague on 25% of living cells
- **⭐ Enhance**: Give superbreed abilities to 20% of cells
- **✨ Deploy**: Activate cleaner cells on 15% of population
- **💥 Destroy**: Launch a catastrophic event

#### Settings
- **Speed**: Adjust simulation speed (1-60 FPS)
- **Cell Size**: Change cell display size (4-20 pixels)
- **Aging**: Toggle age-based color gradients
- **Grid**: Show/hide grid lines
- **Wrap**: Enable/disable edge wrapping

## Project Structure

```
lifegame2/
├── index.html          # Main HTML file with UI layout
├── game.js             # Game logic and rendering engine
├── styles.css          # Styling and themes
└── README.md           # This file
```

## Technologies

- **HTML5 Canvas**: High-performance 2D graphics rendering
- **Vanilla JavaScript**: No frameworks or libraries required
- **CSS3**: Modern styling with animations
- **Gray-Scott Algorithm**: Reaction-diffusion system implementation

## How It Works

### Cellular Automata Rules
The simulation follows Conway's Game of Life rules with advanced extensions:

**Standard Rules** (for normal cells):
1. **Birth**: Dead cell with exactly 3 living neighbors becomes alive
2. **Survival**: Live cell with 2 or 3 neighbors survives to next generation
3. **Death**: All other cells die from isolation (<2 neighbors) or overcrowding (>3 neighbors)

**Modified Rules** (for special cells):
- **Superbreed/Mutated cells**: Survive with 1, 2, 3, or 4 neighbors (more resilient)
- **Superbreed reproduction**: Dead cells with 2 neighbors can birth if any neighbor is superbreed
- **Plague mortality**: Plagued cells age 5+ have additional 40% death chance per generation
- **Resource constraints**: Cells in low-resource areas (<30%) have 30% increased death chance
- **Birth requirements**: Birth only occurs if local resources exceed 20%

### Resource Economics
Cells operate within a limited resource economy:
- Each grid location has independent resource pool (0-100%)
- Normal cells consume 0.01 (1%) per generation
- Plagued cells consume 0.02 (2%) per generation (disease is costly)
- Empty cells regenerate at 0.005 (0.5%) per generation
- Creates natural population limits and boom-bust cycles
- Prevents infinite growth even in stable patterns

### Evolutionary Dynamics
Multiple inheritance and mutation mechanisms:

**Trait Inheritance**:
- Plague: 25% chance to inherit from plagued neighbors
- Superbreed: 30% chance to inherit from superbreed neighbors
- Cleaner: 30% chance to inherit from cleaner neighbors

**Mutation**:
- Random mutation chance each generation (default 5%, adjustable 0-20%)
- Mutated cells gain superbreed survival rules while keeping original specialty
- Creates hybrid super-cells with combined advantages
- Can only be removed by cleaner cells (natural selection pressure)

**Priority System**:
1. Cleaner trait overrides everything (highest priority)
2. Cells born in chaos zones are auto-plagued
3. Plague can override superbreed in spreading
4. Mutation preserves existing specialty

### Reaction-Diffusion Chemistry
Independent chemical system based on Gray-Scott equations:

**Mathematical Model**:
```
dA/dt = Da·∇²A - AB² + f(1-A)
dB/dt = Db·∇²B + AB² - (k+f)B
```

Where:
- A = nutrient chemical (promotes life)
- B = toxin chemical (inhibits life)
- f = feed rate (nutrient replenishment)
- k = kill rate (toxin removal)
- Da, Db = diffusion coefficients
- ∇² = Laplacian operator (9-point stencil)

**Cellular Coupling**:
- Living cells consume chemical A (nutrients) and produce B (toxins)
- Chemical A increases local resource levels
- Chemical B decreases local resource levels
- Creates feedback loop between chemistry and cellular automata
- Different presets create diverse emergent patterns

## Technical Implementation

### Windows Executable Architecture

**Built with Electron** for native Windows performance:

- **Main Process** (`main.js`): Window management, IPC, native menu
- **Renderer Process** (`game.js`): Canvas rendering and UI
- **Web Worker** (`game-worker.js`): Parallel game logic computation
- **Preload Script** (`preload.js`): Secure IPC bridge

**Performance Optimizations:**
- GPU rasterization enabled via command-line flags
- Zero-copy rendering pipeline
- Accelerated 2D canvas operations
- Background throttling disabled for consistent 60 FPS
- Multi-threaded computation with dedicated worker

### Game Engine Architecture
- **Object-oriented design**: Main `GameOfLife` class encapsulates all game state and logic
- **Web Worker integration**: Offloads generation computation to separate thread
- **Particle system**: Separate `Particle` class for visual effects with independent physics
- **Double buffering**: Uses `grid` and `nextGrid` arrays to prevent read-write conflicts
- **Separated concerns**: Cell state, age, and special properties tracked in separate 2D arrays

### Performance Optimizations
- **RD update throttling**: Reaction-diffusion updates every 2 frames instead of every frame
- **Particle culling**: Particles automatically removed when life reaches 0
- **Canvas optimization**: Single canvas clear and redraw per frame
- **Grid size adaptation**: Grid dimensions calculated based on viewport and cell size
- **Efficient neighbor counting**: Pre-computed offsets with edge wrapping support

### Rendering Pipeline
1. Clear canvas (black background)
2. Render reaction-diffusion layer (if enabled, with opacity blending)
3. Draw chaos markers with pulsating radial gradients
4. Draw cells with shape-specific rendering (squares, circles, diamonds, hexagons)
5. Draw particle effects with alpha blending
6. Draw grid lines (if enabled)
7. Update statistics and graphs

### Cell Shape Rendering
- **Normal cells**: Squares (fillRect) with shadow glow
- **Plague cells**: Circles (arc) with shadow glow
- **Superbreed cells**: Diamonds (4-point path) with shadow glow
- **Mutated cells**: Hexagons (6-point path) with shadow glow
- **Cleaner cells**: Pulsating circles with animated radius

### Animation System
- **RequestAnimationFrame**: Smooth 60 FPS rendering loop
- **Delta time calculation**: Frame-rate independent simulation updates
- **Animation time tracking**: Global time variable for pulsating effects
- **Separate update rates**: Simulation can run at different speed than rendering

## Performance Characteristics

### Typical Performance
- **Grid size**: 120×90 cells on 1920×1080 display with 8px cells
- **60 FPS rendering**: Constant smooth visual updates
- **Variable simulation speed**: 1-60 generations per second (user adjustable)
- **Particle limit**: Dynamic based on spawn rate (typically 50-200 active particles)
- **Memory usage**: Approximately 5-10 MB for grid arrays and state tracking

### Scalability
- **Small grids** (4px cells): Can handle 400×300 grids smoothly
- **Large grids** (20px cells): Runs at lower resolutions for visual clarity
- **RD performance**: Disabled by default, adds ~20% computational overhead when enabled
- **Browser compatibility**: Runs on all modern browsers with HTML5 Canvas support

## Contributing

Contributions are welcome! Feel free to:
- Report bugs or issues
- Suggest new features or cell types
- Submit pull requests with improvements
- Improve documentation or add examples
- Share interesting patterns or configurations

## License

This project is open source and available under the MIT License.

## Acknowledgments

- **John Conway** (1937-2020) for inventing Conway's Game of Life
- **Pearson & Ponce de León** for Gray-Scott reaction-diffusion research
- The **cellular automata community** for decades of pattern discovery
- **HTML5 Canvas API** developers for high-performance 2D graphics

## Future Enhancement Ideas

Potential features for future versions:
- **Save/Load system**: Export/import grid states and configurations as JSON
- **Custom rule sets**: Support for alternative CA rules (HighLife, Day & Night, Seeds, etc.)
- **Pattern library**: Built-in collection of interesting discovered patterns
- **Multi-threaded computation**: Web Workers for larger grids and faster simulation
- **Pattern recognition**: Automatic detection of oscillators, spaceships, and still lifes
- **Recording/Replay**: Capture simulation history and replay at variable speeds
- **Network multiplayer**: Shared grids with collaborative/competitive modes
- **Shader-based rendering**: WebGL for GPU-accelerated graphics and computation
- **Sound synthesis**: Audio generated from population dynamics and events

---

**Enjoy exploring the fascinating world of cellular automata and emergent complexity!** 🎮✨🧬
