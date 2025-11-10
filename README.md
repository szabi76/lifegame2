# Advanced Game of Life

An enhanced implementation of Conway's Game of Life with advanced cellular mechanics, visual effects, and interactive features.

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

#### 🦠 Plague Cells (Red Circles)
- Infectious disease that spreads through the population
- Consume 2× resources per generation
- 25% infection chance to neighbors
- 40% mortality chance after age 5
- Auto-infect cells born in chaos zones

#### ⭐ Superbreed Cells (Gold Diamonds)
- Enhanced survival (1-4 neighbors instead of 2-3)
- Can birth new cells with only 2 neighbors
- 30% chance to pass trait to offspring

#### ✨ Cleaner Cells (Cyan Pulsating)
- Remove special properties from neighboring cells
- Emit sparkle particle effects
- 30% chance to spread cleaner trait

#### 🧬 Mutated Cells (Purple Hexagons)
- Result of random mutations (5% default rate, adjustable 0-20%)
- Gain superbreed survival abilities
- Keep original specialty traits

### Environmental Systems

#### ⚡ Resource/Energy System
- Each cell location has a resource level (0-100%)
- Living cells consume resources per generation
- Resources regenerate slowly at 0.5% per generation
- Low resources (<30%) increase death chance by 30%
- Birth requires >20% resources

#### 💥 Catastrophe System
- Random disaster events with 10-20 cell radius
- Creates lasting chaos zones with pulsating markers
- Auto-plagues cells born in affected areas
- Spawns colorful explosion particles

### Visual Features

#### 🎨 Themes
Choose from 5 color themes:
- **Neon** (default)
- **Ocean**
- **Sunset**
- **Matrix**
- **Fire**

#### 📐 Classic Patterns
Pre-built patterns for exploration:
- Glider
- Pulsar
- LWSS (Lightweight Spaceship)
- Gosper Glider Gun
- Pentadecathlon
- Acorn

#### ✨ Particle Effects
- **Explosion**: Colorful bursts from catastrophes
- **Sparkle**: Cyan twinkles from cleaner cells
- **Death**: Gray particles from cell destruction

#### 📊 Data Visualization
- **Population Timeline**: 100-generation history graph
- **Bar Chart**: Real-time cell type distribution
- **Statistics Dashboard**: Generation count, population, FPS

### 🧪 Reaction-Diffusion Chemistry

Gray-Scott reaction-diffusion system that creates organic patterns:
- **Presets**: Coral, Mitosis, Waves, Maze, Fingerprint
- **Adjustable Parameters**: Feed rate, kill rate, diffusion coefficients
- **Resource Coupling**: Interacts with Game of Life resource system
- **Opacity Control**: Blend chemistry layer with cellular automata

## Getting Started

### Prerequisites
- A modern web browser with HTML5 Canvas support
- No build tools or dependencies required!

### Installation

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

### Cellular Automata
The simulation follows Conway's Game of Life rules with extensions:
1. **Birth**: Dead cell with exactly 3 neighbors becomes alive
2. **Survival**: Live cell with 2-3 neighbors survives
3. **Death**: All other cells die from loneliness or overcrowding

### Resource Model
Cells compete for limited resources in their location, creating realistic population dynamics and preventing infinite growth.

### Mutation System
Random mutations create evolutionary pressure, allowing advantageous traits to spread through the population.

### Reaction-Diffusion
The Gray-Scott model simulates chemical reactions that create organic, lifelike patterns independent of cellular automata rules.

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## License

This project is open source and available under the MIT License.

## Acknowledgments

- John Conway for creating the original Game of Life
- The cellular automata community for inspiration
- Gray-Scott reaction-diffusion model researchers

## Future Enhancements

Potential features for future versions:
- Save/load grid states
- Custom rule sets (e.g., HighLife, Day & Night)
- Multi-threaded computation for larger grids
- Pattern recognition and statistics
- Network multiplayer mode

---

**Enjoy exploring the fascinating world of cellular automata!** 🎮✨
