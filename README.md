# Nova

Nova is an AI assistant created to enhance the Windows 10 experience.

## User Guide

### For Developers

#### Prerequisites

Install the following:

- [Visual Studio Code](https://code.visualstudio.com)
- [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools)
  - Select during install:
    - Desktop Development with C++
    - Latest Windows 10 SDK (10.0.20348.0, as of writing)
    - Latest MSVC x64/x86 Build Tools (MSVC v143 – VS 2022 C++ x64/x86 build tools, as of writing)
- [Rustup](https://www.rust-lang.org/tools/install)
- [Node.js](https://nodejs.org)
- [Git](https://git-scm.com/downloads/win)
- [GitHub Account](https://github.com)

> Install all with default settings except Visual Studio, where you must select the modules above.

#### Step 1: Clone the Repository

```sh
git clone https://github.com/sandunwira/Nova.git
```

#### Step 2: Install Dependencies

Open the folder in Visual Studio Code, then in the terminal run:

```sh
npm install
```

Then install the Tauri CLI:

```sh
cd src-tauri
cargo install tauri-cli@1.6.5
```

#### Step 3: Run the Application

From the project root, run:

```sh
cargo tauri dev
```

This will compile and run the debug version of Nova.

---

### For Windows Users

#### Step 1: Download the Installer

- Go to [Nova Releases](https://github.com/sandunwira/Nova/releases)
- Download the latest `.msi` file.

#### Step 2: Install Nova

- Run the `.msi` installer with default settings.
- **Note:** Windows Defender may warn about the installer. This is a common false positive; you can safely proceed.

#### Step 3: Launch Nova

- After installation, launch Nova from the Start Menu or desktop shortcut and enjoy!

---

Tested on Tauri Version: 1.6.5
