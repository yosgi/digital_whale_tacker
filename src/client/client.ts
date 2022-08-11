import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
// @ts-ignore
import { Water } from './object/water';
// @ts-ignore
import { Sky } from './object/sky';
import { GUI } from 'dat.gui';
import Stats from 'three/examples/jsm/libs/stats.module'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
console.log(Water)
// @ts-ignore
let container, stats: any, water: any, sun: any ;
let camera:THREE.PerspectiveCamera, scene: THREE.Scene, renderer: THREE.WebGLRenderer;
let controls,mesh:THREE.Mesh ;

init();
animate();

function init() {

    container = document.getElementById('container');

    //

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container && container.appendChild(renderer.domElement);

    //

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
    camera.position.set(30, 30, 100);

    //

    sun = new THREE.Vector3();

    // Water

    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);

    water = new Water(
        waterGeometry,
        {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load('textures/waternormals.jpg', function (texture) {

                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

            }),
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 3.7,
            fog: scene.fog !== undefined
        }
    );

    water.rotation.x = - Math.PI / 2;

    scene.add(water);

    // Skybox

    const sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);

    const skyUniforms = sky.material.uniforms;

    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;

    const parameters = {
        elevation: 2,
        azimuth: 180
    };

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    let renderTarget:THREE.WebGLRenderTarget;

    function updateSun() {

        const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
        const theta = THREE.MathUtils.degToRad(parameters.azimuth);

        sun.setFromSphericalCoords(1, phi, theta);

        sky.material.uniforms['sunPosition'].value.copy(sun);
        water.material.uniforms['sunDirection'].value.copy(sun).normalize();

        if (renderTarget !== undefined) renderTarget.dispose();

        renderTarget = pmremGenerator.fromScene(sky);

        scene.environment = renderTarget.texture;

    }

    updateSun();

    //

    const geometry = new THREE.BoxGeometry(30, 30, 30);
    const material = new THREE.MeshStandardMaterial({ roughness: 0 });

    mesh = new THREE.Mesh(geometry, material);
    // scene.add(mesh);

    //

    controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI * 0.495;
    controls.target.set(0, 10, 0);
    controls.minDistance = 40.0;
    controls.maxDistance = 200.0;
    controls.update();

    //

    stats = new ( Stats as any )();
    container && container.appendChild(stats.dom);

    // GUI

    const gui = new GUI();

    const folderSky = gui.addFolder('Sky');
    folderSky.add(parameters, 'elevation', 0, 90, 0.1).onChange(updateSun);
    folderSky.add(parameters, 'azimuth', - 180, 180, 0.1).onChange(updateSun);
    folderSky.open();

    const waterUniforms = water.material.uniforms;

    const folderWater = gui.addFolder('Water');
    folderWater.add(waterUniforms.distortionScale, 'value', 0, 8, 0.1).name('distortionScale');
    folderWater.add(waterUniforms.size, 'value', 0.1, 10, 0.1).name('size');
    folderWater.open();

    //

    window.addEventListener('resize', onWindowResize);

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}
const objLoader = new OBJLoader()
objLoader.load(
    'whale-obj/whale.obj',
    (object) => {
        // (object.children[0] as THREE.Mesh).material = material
        // object.traverse(function (child) {
        //     if ((child as THREE.Mesh).isMesh) {
        //         (child as THREE.Mesh).material = material
        //     }
        // })
        const material = new THREE.MeshStandardMaterial({ roughness: 0 });
        console.log(object.children)
        console.log(object)
        for(let i = 0; i < object.children.length; i++){
            if (i !== 2) {
                scene.add(object.children[i])
            }
        }
        
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
    },
    (error) => {
        console.log(error)
    }
)

function animate() {

    requestAnimationFrame(animate);
    render();
    stats.update();

}

function render() {

    const time = performance.now() * 0.001;

    mesh.position.y = Math.sin(time) * 20 + 5;
    mesh.rotation.x = time * 0.5;
    mesh.rotation.z = time * 0.51;

    water.material.uniforms['time'].value += 1.0 / 60.0;

    renderer.render(scene, camera);

}