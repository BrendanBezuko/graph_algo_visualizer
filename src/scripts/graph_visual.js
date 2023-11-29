import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as TWEEN from 'tween.js';
import Stats from 'stats.js';
import { GUI } from 'dat.gui';

import * as documentHelpers from './document_helpers.js';
import * as debuggingHelpers from './debugging_helpers.js';
import * as geoHelpers from './geo_helpers.js';


class Graph {

    constructor(numberOfNodes, graphDensity, scene, canvasConsole) {

        this.scene = scene;
        this.canvasConsole = canvasConsole;

        this.graphPath = null;
        this.graphEdges = null;
        this.graphNodes = null;
        this.graphOrigin = null;
        this.numberOfNodes = numberOfNodes;
        this.graphDensity = graphDensity;
        this.numberOfEdges = Math.round((numberOfNodes * (numberOfNodes - 1) / 2) * this.graphDensity);
        this.connectedGraph = false;
        this.graphExists = false;
        this.pathFound = false;
        this.adjacencyMatrix = null;
        this.pathMatrix = null; // for Floyd-warshall's algo

        this.incidentNode = null;
        this.exitNode = null;

        this.stdColor = {color: 0x0000ff};
        this.sequenceColor = {color: 0xff0000};
        this.pathColor = {color: 0x00ff00};
        this.incidentColor = {color: 0xffff00};
        this.terminationColor = {color: 0xff8c00};

        this.graphNodeSize = {radius: 0.07, res: 8};
    }

    createGraph(type) {

        this.graphOrigin = new THREE.Object3D();
        this.graphOrigin.position.set(0, 10, 0);
        this.scene.add(this.graphOrigin);

        let geoFunc;
        switch (type) {
            case 'sphere':
                geoFunc = geoHelpers.randomSpherePoint;
                break;
            case 'galaxy':
                geoFunc = geoHelpers.galaxyGenerator;
                break;
            case 'sphere_surface':
                geoFunc = geoHelpers.randomSphereSurface;
                break;
            case 'circle':
                geoFunc = geoHelpers.randomCircle;
                break;
            case 'circle_arc':
                geoFunc = geoHelpers.randomCircleArc;
                break;
            default:
                geoFunc = geoHelpers.randomSphereSurface;
                break;
        }

        this.nodePositionVectors = new Array(this.numberOfNodes);
        for (let i = 0; i < this.numberOfNodes; i++) {
            let pos = geoFunc(0, 2, 0, 15);
            this.nodePositionVectors[i] = new THREE.Vector3(pos[0], pos[1], pos[2]);
        }

        //create the graph nodes
        this.graphNodes = new Array(this.numberOfNodes);
        for (let i = 0; i < this.numberOfNodes; i++) {
            this.graphNodes[i] = this.createGraphNode(this.graphNodeSize, this.stdColor, this.nodePositionVectors[i]);
        }

        this.createRandomAdjacencyMatrix();

        this.graphExists = true;
    }

    destroyGraph() {

        this.graphExists = false;
        this.connectedGraph = false;

        this.graphSequence = null;
        this.graphPath = null;

        for (let i = 0; i < this.graphEdges.length; i++) {
            this.scene.remove(this.graphEdges[i]);
            this.graphEdges[i] = null;
        }
        this.graphEdges = null;

        for (let i = 0; i < this.graphNodes.length; i++) {
            this.scene.remove(this.graphNodes[i]);
            this.graphNodes[i] = null;
        }
        this.graphNodes = null;

        // this.graphEdges.forEach(function(e){
        //     console.log(e);
        //     console.log(this.scene);
        //     //this.scene.remove(e);
        //     e = null;
        // });
        //
        // this.graphNodes.forEach(function(e){
        //     this.scene.remove(e);
        //     e = null;
        // });

        this.scene.remove(this.graphOrigin);
        this.graphOrigin = null;
    }

    createGraphNode(size, color, position) {
        const geo = new THREE.SphereGeometry(size.radius, size.res, size.res);
        const material = new THREE.MeshBasicMaterial(color);
        const nodeMesh = new THREE.Mesh(geo, material);
        nodeMesh.position.set(position.x, position.y, position.z);
        nodeMesh.layers.set(3);
        this.graphOrigin.add(nodeMesh);
        return nodeMesh;
    }

    createGraphEdge(posVectors, vecV, vecW, color) {
        const edgeVecs = [];
        edgeVecs.push(posVectors[vecV]);
        edgeVecs.push(posVectors[vecW]);
        const geo = new THREE.BufferGeometry().setFromPoints(edgeVecs);
        const material = new THREE.LineBasicMaterial(color);
        const mesh = new THREE.Line(geo, material);
        mesh.layers.set(4);
        this.graphOrigin.add(mesh);
        return mesh;
    }

    createRandomAdjacencyMatrix() {

        this.adjacencyMatrix = [];

        //initialize matrix with negative values
        for (let i = 0; i < this.nodePositionVectors.length + 1; i++) {
            this.adjacencyMatrix[i] = new Array(this.nodePositionVectors.length + 1);
            for (let j = 0; j < this.nodePositionVectors.length + 1; j++) {
                this.adjacencyMatrix[i][j] = {weight: -1, mesh: null};
            }
        }

        //populate first row with position vector index
        for (let i = 0; i < this.nodePositionVectors.length; i++) {
            this.adjacencyMatrix[0][i + 1] = {weight: i, mesh: this.graphNodes[i]};
        }

        //populate first column with position vector index
        for (let i = 0; i < this.nodePositionVectors.length; i++) {
            this.adjacencyMatrix[i + 1][0] = {weight: i, mesh: this.graphNodes[i]};
        }

        let count = 0;
        this.graphEdges = new Array(this.numberOfEdges);
        while (count < this.numberOfEdges) {

            //choose two random vector indices
            let vecX = Math.floor(Math.random() * this.nodePositionVectors.length);
            let vecY = Math.floor(Math.random() * this.nodePositionVectors.length);

            //insure unique
            if (vecX === vecY) {
                continue;
            }

            //check if already adjacent
            if (this.adjacencyMatrix[vecX + 1][vecY + 1].weight !== -1) {
                continue;
            }

            //calculate squared distance
            let delta = this.nodePositionVectors[vecX].distanceToSquared(this.nodePositionVectors[vecY]);


            //set corresponding entries weights
            this.adjacencyMatrix[vecX + 1][vecY + 1].weight = delta;
            this.adjacencyMatrix[vecY + 1][vecX + 1].weight = delta;
            //create edges
            this.graphEdges[count] = this.createGraphEdge(this.nodePositionVectors, vecX, vecY, this.stdColor);
            this.adjacencyMatrix[vecY + 1][vecX + 1].mesh = this.graphEdges[count];
            this.adjacencyMatrix[vecX + 1][vecY + 1].mesh = this.graphEdges[count];

            count++;
        }

        //this.printAdjacencyMatrix();
    }

    printAdjacencyMatrix() {
        let printable2D = [];

        //initialize matrix with negative values
        for (let i = 0; i < this.adjacencyMatrix.length; i++) {
            printable2D[i] = new Array(this.adjacencyMatrix.length);
            for (let j = 0; j < this.adjacencyMatrix.length; j++) {
                printable2D[i][j] = this.adjacencyMatrix[i][j].weight;
            }
        }

        debuggingHelpers.print2DArray(printable2D);
    }

    //keeps the changes to the graphSequence and graphPath algorithm which algo must rest before running
    //resets the animation colors and layers of the graph
    resetGraphPath() {

        for (let i = 0; i < this.graphNodes.length; i++) {
            this.graphNodes[i].material = new THREE.MeshBasicMaterial(this.stdColor);
            this.graphNodes[i].layers.set(3);
        }

        for (let i = 0; i < this.graphEdges.length; i++) {
            this.graphEdges[i].material = new THREE.MeshBasicMaterial(this.stdColor);
            this.graphEdges[i].layers.set(4);
        }

        this.graphPath = null;
        this.pathFound = false;
    }

    runDFS() {

        if (!this.graphExists) {
            return;
        }

        this.graphPath = [];

        let visitedNodes = new Array(this.graphNodes.length);
        for (let i = 0; i < this.graphNodes.length; i++) {
            visitedNodes[i] = false;
        }

        this.incidentNode = 0;
        this.dfsUtility(0, visitedNodes);

        for (let i = 0; i < visitedNodes.length; i++) {
            if (!visitedNodes[i]) {
                break;
            }
            if (i === visitedNodes.length - 1) {
                this.connectedGraph = true;
            }
        }

        this.pathFound = true;

        //debugging
        //console.log(" dFSPath.length=" + this.graphPath.length);

        writeConsole("DFS complete");

        if(this.connectedGraph ){
            writeConsole("connected Graph");
        }
    }

    dfsUtility(nodeIndex, visitedNodes) {
        visitedNodes[nodeIndex] = true;
        //this.graphSequence.push(this.graphNodes[nodeIndex]);
        let pathElement = {mesh: this.graphNodes[nodeIndex], path: true};
        this.graphPath.push(pathElement);
        this.graphNodes[nodeIndex].layers.set(5);
        this.exitNode = nodeIndex;

        for (let i = 0; i < this.graphNodes.length; i++) {

            if (this.adjacencyMatrix[nodeIndex + 1][i + 1].weight !== -1) {

                //find the correct edge and add it to the sequence
                // for (let j = 0; j < this.graphEdges.length; j++) {
                //
                //     let edge = this.graphEdges[j];
                //     if ((edge.vecV === nodeIndex && edge.vecW === i) || (edge.vecV === i && edge.vecW === nodeIndex)) {
                //         //console.log("nodeindex=" + nodeIndex + " graphEdges[j].vecV=" + graphEdges[j].vecV + " graphEdges[j].vecW=" + graphEdges[j].vecW + " i=" + i + " j=" + j);
                //         let pathElement2 = {mesh: this.graphEdges[j].edge, path: false};
                //         if (!visitedNodes[i]) {
                //             this.graphEdges[j].edge.layers.set(3);
                //             pathElement2.path = true;
                //         }
                //         this.graphPath.push(pathElement2);
                //     }
                // }

                let edge = this.adjacencyMatrix[nodeIndex + 1][i + 1].mesh;
                let pathElement2 = {mesh: this.adjacencyMatrix[nodeIndex + 1][i + 1].mesh, path: false};

                //check if already in the path to avoid duplicates in graph path
                let alreadyScanned = false;
                this.graphPath.forEach((val) => {
                    if (val.mesh === edge) {
                        alreadyScanned = true;
                    }
                });

                if (!alreadyScanned) {
                    this.graphPath.push(pathElement2);
                }

                if (!visitedNodes[i]) {
                    pathElement2.mesh.layers.set(5);
                    pathElement2.path = true;
                    this.dfsUtility(i, visitedNodes);
                }
            }
        }
    }
//https://en.wikipedia.org/wiki/Floyd%E2%80%93Warshall_algorithm

    computeFloydWarshall() {

        //create Matrices
        let distanceMatrix = [];
        for (let i = 0; i < this.graphNodes.length; i++) {
            distanceMatrix[i] = [];
            for( let j =0; j < this.graphNodes.length; j++){
                distanceMatrix[i][j] = -1;
            }
        }

        this.pathMatrix = [];
        for (let i = 0; i < this.graphNodes.length; i++) {
            this.pathMatrix[i] = [];
            for( let j =0; j < this.graphNodes.length; j++){
                this.pathMatrix[i][j] = -1;
            }
        }

        // dist array of minimum distances initialized to inf
        // next array of vertex indices initialized to null
        //
        // procedure FloydWarshallWithPathReconstruction() is
        //     for each edge (u, v) do
        //         dist[u][v] ← w(u, v)  // The weight of the edge (u, v)
        //         next[u][v] ← v
        //     for each vertex v do
        //         dist[v][v] ← 0
        //         next[v][v] ← v
        for (let i = 0; i < distanceMatrix.length; i++) {
            for (let j = 0; j < distanceMatrix.length; j++) {
                distanceMatrix[i][j] = this.adjacencyMatrix[i + 1][j + 1].weight;
                this.pathMatrix[i][j] = -1;
                if (i === j) {
                    distanceMatrix[i][j] = 0;
                    this.pathMatrix[i][j] = j;
                }
            }

        }

        for (let i = 0; i < this.pathMatrix.length; i++) {
            for (let j = 0; j < this.pathMatrix.length; j++) {
                if (this.adjacencyMatrix[i + 1][j + 1].weight !== -1) {
                    this.pathMatrix[i][j] = j;
                }
            }
        }

        for (let i = 0; i < distanceMatrix.length; i++) {
            for (let j = 0; j < distanceMatrix.length; j++) {
                if (i === j) {
                    this.pathMatrix[i][j] = j;
                }
            }
        }

        //    for k from 1 to |V| do // standard Floyd-Warshall implementation
        //         for i from 1 to |V|
        //             for j from 1 to |V|
        //                 if dist[i][j] > dist[i][k] + dist[k][j] then
        //                     dist[i][j] ← dist[i][k] + dist[k][j]
        //                     next[i][j] ← next[i][k]

        for (let i = 0; i < distanceMatrix.length; i++) {
            for (let j = 0; j < distanceMatrix.length; j++) {
                for (let k = 0; k < distanceMatrix.length; k++) {

                    if (
                        (distanceMatrix[i][k] !== -1 && distanceMatrix[k][j] !== -1) &&  //handles the inf
                        ( (distanceMatrix[i][j] > distanceMatrix[i][k] + distanceMatrix[k][j]) || ( distanceMatrix[i][j] === -1  ))){
                        distanceMatrix[i][j] = distanceMatrix[i][k] + distanceMatrix[k][j];
                        this.pathMatrix[i][j] = this.pathMatrix[i][k];
                    }
                }
            }
        }

        writeConsole("Floyd-Warshall Algorithm Completed")
    }

//procedure Path(u, v)
//     if next[u][v] = null then
//         return []
//     path = [u]
//     while u ≠ v
//         u ← next[u][v]
//         path.append(u)
//     return path
    getFloydWarshallPath(u, v) {

        if (this.pathMatrix == null) {
            writeConsole("Path Matrix NOT computed");
            return;
        }

        if (this.pathMatrix[u][v] == -1) {
            writeConsole("Path not found");
            return;
        }

        this.incidentNode = u;
        this.exitNode = v;

        this.graphPath = [];

        this.graphPath.push({mesh: this.graphNodes[u], path: true});
        this.graphNodes[u].layers.set(5);
        let prev = u;
        while (u !== v) {
            prev = u;
            u = this.pathMatrix[u][v];
            this.adjacencyMatrix[u + 1][prev + 1].mesh.layers.set(5);
            this.graphPath.push({mesh: this.adjacencyMatrix[u + 1][prev + 1].mesh, path: true});
            this.graphNodes[u].layers.set(5);
            this.graphPath.push({mesh: this.graphNodes[u], path: true});
        }

        this.pathFound = true;
        writeConsole("Path Found");
    }

}

const canvas = document.getElementById('main_canvas');
const main_canvas_parent = document.getElementById('main_canvas_parent');
const dat_gui = document.getElementById('dat_gui');
const THREE_stats = document.getElementById('THREE_stats');
const canvasConsole = document.querySelector('#canvas_console');
const configButtonOne = document.querySelector('#graph_config_one');
const configButtonTwo = document.querySelector('#graph_config_two');
const configButtonThree = document.querySelector('#graph_config_three');
const configButtonFour = document.querySelector('#graph_config_four');

const configButtonParent = configButtonOne.parentElement;

let viewDimensions = documentHelpers.getWindowDimensions(document, window);
canvas.width = viewDimensions.width;
canvas.height = viewDimensions.height - configButtonParent.offsetHeight;

//render set up
const renderer = new THREE.WebGLRenderer({antialias: false, canvas: main_canvas});
main_canvas_parent.appendChild(renderer.domElement);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(canvas.width, canvas.height);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

//this.labelRenderer = new CSS2DRenderer();

// scene set up
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x181b1c);
scene.fog = new THREE.Fog(0x181b1c, 4, 50);

const camera = new THREE.PerspectiveCamera(100, canvas.width / canvas.height, 1, 2000);
const cameraInitPos = {x: 0, y: 10, z: 18};
camera.position.set(cameraInitPos.x, cameraInitPos.y, cameraInitPos.z);
camera.layers.enableAll();
camera.layers.toggle(2);
//layers
// 2 axesHelper
// 3 nodes
// 4 edges
// 5 path

const axesHelper = new THREE.AxesHelper(5);
axesHelper.layers.set(2);
axesHelper.position.set(-10, 0, 0);
scene.add(axesHelper);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target = new THREE.Vector3(0, 10, 0); // set the center
controls.maxPolarAngle = Math.PI / 2; // prevent the camera from going under the ground
controls.minDistance = 10;
controls.maxDistance = 20;
controls.zoomSpeed = 0.3;
controls.rotateSpeed = 0.3;
controls.enableDamping = true;
controls.update();

const stats = Stats();
stats.domElement.style.position = 'relative';
THREE_stats.appendChild(stats.domElement);

const floorGeometry = new THREE.PlaneGeometry(500, 500);
//const material = new THREE.MeshBasicMaterial({color: 0x0000ff});
//const texture = new THREE.TextureLoader().load('images/test.jpg');
//const floorMaterial = new THREE.MeshBasicMaterial({ map: texture});
const floorMaterial = new THREE.MeshPhongMaterial({color: 0x22292b});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI * 0.5;
floor.receiveShadow = true;
floor.position.set(0, -5, 0);
scene.add(floor);

//const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.2); // soft white light
//this.scene.add(ambientLight);

const spotLight1 = createSpotlight(0x00ffff);
const spotLight2 = createSpotlight(0x0c4d2d);
const spotLight3 = createSpotlight(0x05232b);
spotLight1.position.set(0, 10, 0);
spotLight2.position.set(0, 10, 0);
spotLight3.position.set(0, 10, 0);
scene.add(spotLight1, spotLight2, spotLight3);
//const lightHelper1 = new THREE.SpotLightHelper(spotLight1);
//const lightHelper2 = new THREE.SpotLightHelper(spotLight2);
//const lightHelper3 = new THREE.SpotLightHelper(spotLight3);

let graphAnimationDelay = 500;
let graphRotationSpeed = 0.004;
let graphNodes = 30;
let graphDensity = 0.2;
let graphGeo = 'sphere_surface';

let graph = new Graph(graphNodes, graphDensity, scene, canvasConsole);
graph.createGraph(graphGeo);

const guiControlDefs = {
    'Toggle console view': function () {
        camera.layers.toggle(1);
    },
    'Toggle axis helper': function () {
        camera.layers.toggle(2);
    },
    'Toggle greater graph': function () {
        camera.layers.toggle(3);
        camera.layers.toggle(4);
    },
    'Toggle path': function () {
        camera.layers.toggle(5);
    },'Toggle Nodes': function () {
        camera.layers.toggle(3);
    },
    'Toggle Edges': function () {
        camera.layers.toggle(4);
    },
    'New Graph': function () {
        graph.destroyGraph();
        writeConsole("Graph destroyed");
        graph = new Graph(graphNodes, graphDensity, scene, canvasConsole);
        graph.createGraph(graphGeo);
        writeConsole("graph Created")
    },
    'Reset Path Animations': function () {
        graph.resetGraphPath()
    },
    'DFS': function () {
        graph.runDFS();
        animateGraph(0);
    },
    'Floyd-Warshall': function () {
        //determine if graph is connected
        graph.runDFS();
        if (graph.connectedGraph) {
            graph.resetGraphPath();
            graph.computeFloydWarshall();
            graph.getFloydWarshallPath(graph.incidentNode, graph.exitNode);
            if (graph.pathFound) {
                animateGraph(0);
            }
        }else{
            writeConsole("Graph Must Be connected")
        }
    },
    numberOfNodesParam: graphNodes,
    graphDensity: graphDensity,
    graphAnimationDelay: graphAnimationDelay,
    graphRotationSpeed: graphRotationSpeed,
    graphGeometry: graphGeo
};

const GraphGeometries = ['sphere', 'sphere_surface', 'galaxy', 'circle_arc', 'circle'];

const gui = new GUI({autoPlace: false});
dat_gui.appendChild(gui.domElement);
//gui.domElement.id = 'dat_gui';

const infoFolder = gui.addFolder('Info');
infoFolder.close();
infoFolder.add(guiControlDefs, 'Toggle console view');
infoFolder.add(guiControlDefs, 'Toggle axis helper');

const graphControlsFolder = gui.addFolder('Graph Controls');
graphControlsFolder.open();
let graphControllerNodesQuantity = graphControlsFolder.add(guiControlDefs, 'numberOfNodesParam', 1, 2000, 1).onChange((val) => {
    graphNodes = val;
    //TODO: graph should be recycled???
});
let graphControllerGraphDensity = graphControlsFolder.add(guiControlDefs, 'graphDensity', 0, 1, 0.01).onChange((val) => {
    graphDensity = val;
});
let graphControllerGraphAnimationDelay = graphControlsFolder.add(guiControlDefs, 'graphAnimationDelay', 0, 1000, 10).onChange((val) => {
    graphAnimationDelay = val;
});
let graphControllerGraphRotationSpeed = graphControlsFolder.add(guiControlDefs, 'graphRotationSpeed', 0, 0.1, 0.0001).onChange((val) => {
    graphRotationSpeed = val;
});
graphControlsFolder.add(guiControlDefs, "New Graph");
graphControlsFolder.add(guiControlDefs, "Reset Path Animations");
graphControlsFolder.add(guiControlDefs, "DFS");
graphControlsFolder.add(guiControlDefs, "Floyd-Warshall");
graphControlsFolder.add(guiControlDefs, 'Toggle greater graph');
graphControlsFolder.add(guiControlDefs, 'Toggle path');
graphControlsFolder.add(guiControlDefs, 'Toggle Nodes');
graphControlsFolder.add(guiControlDefs, 'Toggle Edges');
graphControlsFolder.add(guiControlDefs, 'graphGeometry', GraphGeometries).onChange((val) => {
    graphGeo = val;
})
const cameraFolder = gui.addFolder('Camera');
cameraFolder.close();
cameraFolder.add(camera.position, 'x', -20, 20).step(0.1);
cameraFolder.add(camera.position, 'y', -20, 20).step(0.1);
cameraFolder.add(camera.position, 'z', -20, 20).step(0.1);


window.addEventListener('resize', onWindowResize, false);

/*
if (THREE.WebGLRenderer.isWebGLAvailable()) {
    */
    //loadGLTF();
    render();
    //animateLights();
    configButtonOne.addEventListener('click', configButtonOneFunction, false);
    configButtonTwo.addEventListener('click', configButtonTwoFunction, false);
    configButtonThree.addEventListener('click', configButtonThreeFunction, false);
    configButtonFour.addEventListener('click', configButtonFourFunction, false);

    /*
} else {
    const warning = THREE.WebGLRenderer.getWebGLErrorMessage();
    canvas.appendChild(warning);
}
*/

function render() {

    requestAnimationFrame(render);

    TWEEN.update();
    stats.update();
    controls.update();

    //if (lightHelper1) lightHelper1.update();
    //if (lightHelper2) lightHelper2.update();
    //if (lightHelper3) lightHelper3.update();

    if (graph.graphOrigin != null) {
        graph.graphOrigin.rotateY(graphRotationSpeed);
    }

    //this moves the html element with x and y variables
    //canvasConsole.style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;

    renderer.render(scene, camera);
    //labelRenderer.render(scene, camera);
}

function animateGraph(index) {

    if (index < graph.graphPath.length) {
        let obj = graph.graphPath[index];

        if (obj.mesh === graph.graphNodes[graph.incidentNode]) {
            obj.mesh.material = new THREE.MeshBasicMaterial(graph.incidentColor);
        } else if (obj.mesh === graph.graphNodes[graph.exitNode]) {
            obj.mesh.material = new THREE.MeshBasicMaterial(graph.terminationColor);
        } else if (obj.path) {
            obj.mesh.material = new THREE.MeshBasicMaterial(graph.pathColor);
        } else {
            obj.mesh.material = new THREE.MeshBasicMaterial(graph.sequenceColor);
        }
        setTimeout(animateGraph, graphAnimationDelay, ++index);
    }
}

function createSpotlight(color) {

    const newObj = new THREE.SpotLight(color, 2);

    newObj.castShadow = true;
    newObj.angle = 1;
    newObj.penumbra = 0.2;
    newObj.decay = 5;
    newObj.distance = 50;

    return newObj;
}

function writeConsole(txt) {
    const txtLine = document.createElement('p');
    txtLine.textContent = txt;
    txtLine.className = "console_txt";
    canvasConsole.appendChild(txtLine);
    canvasConsole.scrollTop = canvasConsole.scrollHeight;

}

function tweenSpotLights(light) {

    new TWEEN.Tween(light).to({
        angle: (Math.random() * 0.7) + 0.1,
        penumbra: Math.random() + 1
    }, Math.random() * 3000 + 2000)
        .easing(TWEEN.Easing.Quadratic.Out).start();

    new TWEEN.Tween(light.position).to({
        x: (Math.random() * 30) - 15,
        y: (Math.random() * 10) + 15,
        z: (Math.random() * 30) - 15
    }, Math.random() * 3000 + 2000)
        .easing(TWEEN.Easing.Quadratic.Out).start();

}

function tweenNodes(nodes) {

    for (let i = 0; i < max_nodes; i++) {

        let y = nodes[i].position.y;
        let z = nodes[i].position.z;
        let x = nodes[i].position.x;

        new TWEEN.Tween(nodes[i].position).to({
            x: x + Math.random() - 0.5,
            y: Math.abs(y + Math.random() - 0.5),
            z: z + Math.random() * 10 - 0.5
        }, Math.random() * 3000 + 2000)
            .easing(TWEEN.Easing.Quadratic.Out).start();
    }
}

function animateLights() {

    tweenSpotLights(spotLight1);
    tweenSpotLights(spotLight2);
    tweenSpotLights(spotLight3);

    tweenNodes(graphNodes);

    setTimeout(animateLights, 5000);
}

function onWindowResize() {

    let viewDimensions = documentHelpers.getWindowDimensions(document, window);
    canvas.width = viewDimensions.width;
    canvas.height = viewDimensions.height - configButtonParent.offsetHeight;
    camera.aspect = canvas.width / canvas.height;

    camera.updateProjectionMatrix();

    renderer.setSize(canvas.width, canvas.height);
}

function configButtonOneFunction() {

    graphNodes = 100;
    graphDensity = 0.5;
    graphAnimationDelay = 50;
    graphRotationSpeed = -0.004;
    graphGeo = 'sphere';
    //reset the camera position
    //controls.reset();
    camera.position.set(cameraInitPos.x, cameraInitPos.y, cameraInitPos.z);
    camera.layers.enable(3);
    camera.layers.enable(4);
    camera.layers.enable(5);
    //new graph
    graph.destroyGraph();
    graph = new Graph(graphNodes, graphDensity, scene, canvasConsole);
    graph.createGraph(graphGeo);
    //run the dfs and animation
    graph.runDFS();
    animateGraph(0);

    //update the gui values
    graphControllerGraphDensity.setValue(graphDensity);
    graphControllerGraphRotationSpeed.setValue(graphRotationSpeed);
    graphControllerGraphAnimationDelay.setValue(graphAnimationDelay);
    graphControllerNodesQuantity.setValue(graphNodes);
}

function configButtonTwoFunction() {

    graphNodes = 2000;
    graphDensity = 0;
    graphAnimationDelay = 50;
    graphRotationSpeed = 0.004;
    graphGeo = 'galaxy';
    //reset the camera position
    //controls.reset();
    camera.position.set(4, 20, 8);
    camera.layers.enable(3);
    camera.layers.enable(4);
    camera.layers.enable(5);
    //new graph
    graph.destroyGraph();
    graph = new Graph(graphNodes, graphDensity, scene, canvasConsole);
    graph.createGraph(graphGeo);
    //run the dfs and animation

    //update the gui values
    graphControllerGraphDensity.setValue(graphDensity);
    graphControllerGraphRotationSpeed.setValue(graphRotationSpeed);
    graphControllerGraphAnimationDelay.setValue(graphAnimationDelay);
    graphControllerNodesQuantity.setValue(graphNodes);
}

function configButtonThreeFunction() {

    graphNodes = 10;
    graphDensity = 0.3;
    graphAnimationDelay = 50;
    graphRotationSpeed = 0;
    graphGeo = 'circle';
    //reset the camera position
    //controls.reset();
    camera.position.set(0, 25, 10);
    camera.layers.enable(3);
    camera.layers.enable(4);
    camera.layers.enable(5);
    //new graph
    graph.destroyGraph();
    graph = new Graph(graphNodes, graphDensity, scene, canvasConsole);
    graph.createGraph(graphGeo);

    graph.runDFS();
    animateGraph(0);
    //run the dfs and animation

    //update the gui values
    graphControllerGraphDensity.setValue(graphDensity);
    graphControllerGraphRotationSpeed.setValue(graphRotationSpeed);
    graphControllerGraphAnimationDelay.setValue(graphAnimationDelay);
    graphControllerNodesQuantity.setValue(graphNodes);
}

function configButtonFourFunction() {

    graphNodes = 500;
    graphDensity = 0.01;
    graphAnimationDelay = 10;
    graphRotationSpeed = 0.004;
    graphGeo = 'galaxy';
    //reset the camera position
    //controls.reset();
    camera.position.set(4, 20, 8);
    camera.layers.enable(3);
    camera.layers.enable(4);
    camera.layers.enable(5);
    //new graph
    //update the gui values
    graphControllerGraphDensity.setValue(graphDensity);
    graphControllerGraphRotationSpeed.setValue(graphRotationSpeed);
    graphControllerGraphAnimationDelay.setValue(graphAnimationDelay);
    graphControllerNodesQuantity.setValue(graphNodes);

    graph.destroyGraph();
    graph = new Graph(graphNodes, graphDensity, scene, canvasConsole);
    graph.createGraph(graphGeo);
    //run the dfs and animation
    graph.runDFS();
    graph.resetGraphPath();
    graph.computeFloydWarshall();
    graph.getFloydWarshallPath(graph.incidentNode, graph.exitNode);
    camera.layers.toggle(4);
    if( graph.pathFound ) {
        animateGraph(0);
    }

}