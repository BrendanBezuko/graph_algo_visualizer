# Graph Visualiser

## Description

This project is a web application that graphically displays a Depth-First Search (DFS) algorithm and the Floyd-Warshall algorithm for finding the shortest paths.

**Warning:** Due to its computational intensity, this application may cause performance issues or crashes in some browsers.

## Built With

- Webpack
- Node.js
- Three.js

![Screenshot of Application](screenshots/graph_sim_cap.png)
![Screenshot of Application](screenshots/graph_sim_cap4.png)

## Animated Algorithms

- **DFS Algorithm:** Traverses complex graphs efficiently.
- **Floyd-Warshall Algorithm:** Finds the shortest path between nodes and stores the reconstruction of finding it, allowing for animation.

## Known Issues and Bugs

- **Spaghetti Code** Please don't think this is my best code. This was tricky to build, but it would greatly benefit from moving to a framework with a virtual dom, or just better decoupling in general. I probably won't fix this because I'm not a graphics programmer, but who knows I might check back later.
- **Floyd-Warshall Limitation:** There's an unidentified bug where the Floyd-Warshall algorithm doesn't always function as expected. Investigation and debugging are ongoing.
- **Does not scale correctly for MacOS:** The scale is incorrect on my new Macbook, but it was fine with Windows and Linux with an Nvidia GPU.
- **Lower Performance** Could benefit from implementing it with shaders taking the load off the CPU.
- **Other Performance issues** Unknown performance issues causing an unreasonable framerate drop.

## Future Improvements

- **Interactive Nodes:** Plans to add functionality for users to click on nodes to select paths manually.
- **Enhanced Graphical Models:** Upload custom weighted graphs rather than random graphs, and software for transforming a 3D mesh (STL file) into a weighted graph. Textures may also be an interesting feature to overlay maps or other demonstratives on 2D graphs.

## Installation and Usage

To get this project up and running on your local machine:

1. **Prerequisite: Install Node.js and npm:**

   - Ensure you have Node.js and npm installed on your system. If not, download and install from [Node.js official website](https://nodejs.org/).

2. **Clone the Repository:**

   - `git clone https://github.com/brendanb2023/graph_algo_visualizer.git`

3. **Install Dependencies:**
   - Navigate to the project directory and run:

```
npm install
```

4. **Run the Development Server:**
   - To start the development server, run:

```
npm run dev
```

- This will start the server and the application should be accessible on your local machine.
