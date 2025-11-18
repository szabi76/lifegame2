# Troubleshooting - Go Version

## Problem: Game builds but nothing happens when clicked

This is usually caused by one of these issues:

### **Step 1: Try Debug Build First**

Double-click:
```
build-debug.bat
```

This builds a version WITH console output. You'll see:
- Any error messages
- Initialization progress
- What's failing

**Look for error messages in the console window!**

### **Common Issues & Solutions**

#### Issue 1: "Failed to create window" or Silent Crash

**Cause:** Graphics drivers or OpenGL version

**Solutions:**

1. **Update Graphics Drivers:**
   - NVIDIA: https://www.nvidia.com/Download/index.aspx
   - AMD: https://www.amd.com/en/support
   - Intel: https://www.intel.com/content/www/us/en/download-center/home.html

2. **Check OpenGL Support:**
   - raylib needs OpenGL 3.3+
   - Most modern GPUs support this
   - Update Windows to latest version

3. **Try Windowed Mode** (already default)

4. **Reduce Screen Size** (if you have a small monitor):
   Edit `main.go`, change:
   ```go
   const (
       screenWidth   = 1280  // Changed from 1920
       screenHeight  = 720   // Changed from 1080
       cellSize      = 8
   )
   ```
   Then rebuild.

#### Issue 2: Missing DLL Error

**Error Message:** "The code execution cannot proceed because X.dll was not found"

**Solution:**

On Windows, raylib is statically linked, but if you see DLL errors:

1. Install Visual C++ Redistributable:
   - Download: https://aka.ms/vs/17/release/vc_redist.x64.exe
   - Install and restart

2. Install DirectX End-User Runtime:
   - Download: https://www.microsoft.com/en-us/download/details.aspx?id=35
   - Install and restart

#### Issue 3: Antivirus Blocking

**Symptom:** Executable won't run or immediately closes

**Solution:**

1. Check Windows Defender / Your Antivirus
2. Add exception for `Advanced-Game-of-Life.exe`
3. Try running as Administrator (right-click → Run as Administrator)

#### Issue 4: "Application was unable to start correctly (0xc000007b)"

**Cause:** 32-bit/64-bit mismatch

**Solution:**

Make sure you built for 64-bit Windows:
```cmd
go build -o game.exe main.go
```

If problem persists, try:
```cmd
set GOARCH=amd64
go build -o game.exe main.go
```

#### Issue 5: Black Screen / Frozen Window

**Cause:** Graphics initialization issue

**Solutions:**

1. Update graphics drivers
2. Disable any screen recording software
3. Try running with integrated graphics instead of dedicated GPU
4. Check Windows Display Settings (should be at 100% scale)

### **Step 2: Try Simpler Build**

If the above doesn't work, let's build a minimal test version:

**Create `test.go`:**
```go
package main

import (
	"fmt"
	rl "github.com/gen2brain/raylib-go/raylib"
)

func main() {
	fmt.Println("Starting minimal raylib test...")

	rl.InitWindow(800, 600, "Raylib Test")
	defer rl.CloseWindow()

	if !rl.IsWindowReady() {
		fmt.Println("ERROR: Window creation failed!")
		return
	}

	fmt.Println("Window created! Close the window to exit.")

	for !rl.WindowShouldClose() {
		rl.BeginDrawing()
		rl.ClearBackground(rl.RayWhite)
		rl.DrawText("Raylib Works!", 190, 200, 20, rl.Black)
		rl.EndDrawing()
	}
}
```

**Build and run:**
```cmd
go build -o test.exe test.go
test.exe
```

If this works, the problem is in the game code. If this fails too, it's a raylib/graphics issue.

### **Step 3: Check System Requirements**

**Minimum Requirements:**
- Windows 10 or 11 (64-bit)
- OpenGL 3.3+ capable graphics card
- Updated graphics drivers
- Screen resolution: 1920x1080 (or modify code for smaller)

**Check OpenGL Version:**

1. Download OpenGL Extensions Viewer: https://www.realtech-vr.com/home/glview
2. Install and run
3. Check OpenGL version (should be 3.3 or higher)

### **Step 4: Alternative - Use Software Rendering**

If hardware doesn't support OpenGL 3.3:

Edit `main.go` and add before `InitWindow`:
```go
os.Setenv("LIBGL_ALWAYS_SOFTWARE", "1")
```

This forces software rendering (slower but more compatible).

### **Step 5: Detailed Debug Output**

Run from Command Prompt to see all output:

```cmd
cd path\to\your\game
game-debug.exe
```

Copy all output and check for errors.

### **Common Error Messages**

#### "glfw: platform: failed to create window"
- **Solution:** Update graphics drivers
- **Solution:** Reduce screen resolution in code

#### "Failed to initialize GLAD"
- **Solution:** OpenGL not supported, update drivers
- **Solution:** Try software rendering

#### "Access violation" or immediate crash
- **Solution:** Run as Administrator
- **Solution:** Disable antivirus temporarily
- **Solution:** Check Windows Event Viewer for details

### **Getting More Help**

If none of the above works:

1. **Check Windows Event Viewer:**
   - Press Windows Key + X
   - Click "Event Viewer"
   - Go to Windows Logs → Application
   - Look for errors at the time you ran the game

2. **Provide This Information:**
   - Windows version (run `winver`)
   - Graphics card (run `dxdiag`)
   - Full error message from debug build
   - Any errors from Event Viewer

3. **Try on Different Computer:**
   - If it works elsewhere, it's a local system issue
   - If it fails everywhere, might be code issue

### **Quick Test Script**

Create `test-system.bat`:
```batch
@echo off
echo System Information:
echo.
echo Windows Version:
ver
echo.
echo Graphics Card:
wmic path win32_VideoController get name
echo.
echo OpenGL Support:
echo (Download OpenGL Extensions Viewer to check)
echo https://www.realtech-vr.com/home/glview
echo.
pause
```

Run this to gather system info.

### **Last Resort: Contact Me**

If nothing works, open a GitHub issue with:
- Output from `build-debug.bat`
- Windows version
- Graphics card model
- Any error messages
- Event Viewer errors

I'll help you figure it out!

---

## Common Working Solutions

**90% of issues are solved by:**
1. ✅ Running `build-debug.bat` to see errors
2. ✅ Updating graphics drivers
3. ✅ Installing Visual C++ Redistributable
4. ✅ Reducing screen resolution in code
5. ✅ Running as Administrator
