# How to publish a new version (step by step)

You need: Git, and the GitHub CLI (`gh`) logged in (`gh auth status` should say "Logged in"). Run everything in **Git Bash** inside the game folder.

1. **Save your changes**
   ```
   git add -A
   git commit -m "What I changed"
   git push
   ```
2. **Pick the new version number** (look at the last one with `gh release list`):
   - small fix → bump the last number: `v1.0.1` → `v1.0.2`
   - new stuff → bump the middle: `v1.0.2` → `v1.1.0`

   Then put the same number (without the `v`) in **`js/version.js`** (`const GAME_VERSION = '1.0.2';`), commit and push again. The in-game **UPDATE GAME** button refuses a release whose zip has a different number.
3. **Make the game zip** (game files only, no art tools). Replace `v1.0.1` with your version:
   ```
   git archive --format=zip --prefix=RumbleArena/ -o RumbleArena-v1.0.1.zip HEAD index.html js sprites stages sounds Play.bat tools/play.ps1 tools/server.ps1 tools/update.ps1 tools/devserver.py README.md CREDITS.md
   ```
4. **Publish the release** (this also creates the version tag):
   ```
   gh release create v1.0.1 RumbleArena-v1.0.1.zip --title "Rumble Arena v1.0.1" --notes "What's new: ..."
   ```
5. **Delete the zip** from your folder (the owner's rule):
   ```
   rm RumbleArena-v1.0.1.zip
   ```
6. Check it on https://github.com/NGJHD/rumble-arena/releases

**To play a release on another PC:** download the zip from the Releases page, unzip it, double-click `Play.bat`.
After that, **Options → UPDATE GAME** in the game fetches each new release by itself (copies made with `git clone` use `git pull` instead).
