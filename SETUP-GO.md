# Setup Guide - Go Version (SUPER EASY!)

## Step 1: Install Go (One-Time, 5 Minutes)

1. **Download Go:**
   - Go to: **https://go.dev/dl/**
   - Click: `go1.21.x.windows-amd64.msi` (or latest version)
   - Download size: ~120 MB

2. **Install Go:**
   - Run the downloaded `.msi` file
   - Click "Next, Next, Next" (use all defaults)
   - Wait ~2 minutes
   - Click "Finish"

3. **Verify Installation:**
   - Open Command Prompt (Windows Key + R, type `cmd`, press Enter)
   - Type: `go version`
   - You should see: `go version go1.21.x windows/amd64`

**That's it! Go is installed!**

## Step 2: Build the Game (30 Seconds)

### Super Easy Way - Use the Script

1. Find the file: `build-go.bat`
2. **Double-click it**
3. Wait ~30 seconds
4. Game launches automatically!

Done! You now have `Advanced-Game-of-Life.exe`

### Manual Way (if you prefer)

Open Command Prompt in the game folder:

```cmd
REM Download dependencies (first time only, ~10 MB)
go mod download

REM Build the executable (~5 seconds)
go build -o Advanced-Game-of-Life.exe main.go

REM Run it!
Advanced-Game-of-Life.exe
```

## Step 3: Play!

Just double-click: `Advanced-Game-of-Life.exe`

**The .exe file is completely standalone:**
- No installation needed
- No dependencies needed
- Works on any Windows PC
- ~8 MB file size
- Starts in < 0.1 seconds

## Controls Reference

```
SPACE    - Play / Pause
R        - Random cells
C        - Clear all
S        - Step one generation
G        - Toggle grid
A        - Toggle aging colors
+/-      - Speed up/down
ESC      - Quit

Left Mouse   - Draw cells
Right Mouse  - Erase cells
```

## What If Something Goes Wrong?

### "go is not recognized"

**Problem:** Go not installed or not in PATH

**Solution:**
1. Reinstall Go from https://go.dev/dl/
2. Make sure to check "Add to PATH" during install
3. **Restart your computer**
4. Try again

### "cannot find package"

**Problem:** Dependencies not downloaded

**Solution:**
```cmd
go mod download
go mod tidy
```
Then rebuild.

### Build works but game doesn't start

**Problem:** Possible graphics driver issue

**Solutions:**
- Update your graphics drivers
- Check Windows is up to date
- Try running as Administrator

### Game is slow / laggy

**Solutions:**
- Close other programs
- Update graphics drivers
- Reduce grid size (edit main.go constants)

## Sharing the Game

To share with friends:

**Option 1: Just send the .exe**
- Find: `Advanced-Game-of-Life.exe`
- Upload to Google Drive / Dropbox / WeTransfer
- Share the link
- They download and double-click - done!

**Option 2: Create a ZIP**
```cmd
# In the game folder
zip lifegame2.zip Advanced-Game-of-Life.exe README-GO.md
```

Share the ZIP file.

## Making Changes

Want to modify the game?

1. **Edit `main.go`** with any text editor (Notepad, VS Code, etc.)
2. **Rebuild:** `go build -o game.exe main.go`
3. **Test:** Run `game.exe`
4. **Repeat!**

Rebuild takes only ~5 seconds!

## File Size Comparison

```
Electron Version:  170 MB  😰
Go Version:        ~8 MB   😊

170 MB ÷ 8 MB = 21x smaller!
```

## Build Time Comparison

```
Electron:  5-10 minutes ⏰
Go:        5 seconds    ⚡

That's 60-120x faster!
```

## Summary

✅ **Install Go** (one-time, 5 minutes)
✅ **Double-click build-go.bat** (30 seconds)
✅ **Get single .exe file** (~8 MB)
✅ **Share anywhere** (no dependencies!)
✅ **Native 60 FPS performance**

**Total time from zero to running game: 6 minutes** 🚀

That's it! Enjoy your super-fast, super-small Game of Life! 🎮✨
