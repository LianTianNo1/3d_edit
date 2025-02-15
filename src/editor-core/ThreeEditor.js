import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';
import EventEmitter from './EventEmitter';

class ThreeEditor {
  constructor(container) {
    this.container = container;
    this.events = new EventEmitter();

    // 场景相关
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.orbitControls = null;
    this.transformControls = null;

    // 工具相关
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // 状态相关
    this.selectedModel = null;
    this.models = [];

    this.init();
  }

  init() {
    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initControls();
    this.initLights();
    this.initHelpers();
    this.initEvents();
    this.animate();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(10, 10, 10);
    this.camera.lookAt(0, 0, 0);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
  }

  initControls() {
    // 轨道控制器
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.minDistance = 5;
    this.orbitControls.maxDistance = 100;
    this.orbitControls.minPolarAngle = 0.1;
    this.orbitControls.maxPolarAngle = Math.PI * 0.85;

    // 变换控制器
    this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
    this.transformControls.addEventListener('dragging-changed', (event) => {
      this.orbitControls.enabled = !event.value;
    });

    // 监听变换事件
    this.transformControls.addEventListener('change', () => {
      if (this.transformControls.object) {
        this.events.emit('transform-change', this.transformControls.object);
      }
    });

    // 监听鼠标按下事件
    this.transformControls.addEventListener('mouseDown', () => {
      if (this.transformControls.object) {
        this.events.emit('transform-start', this.transformControls.object);
      }
    });

    // 监听鼠标释放事件
    this.transformControls.addEventListener('mouseUp', () => {
      if (this.transformControls.object) {
        this.events.emit('transform-end', this.transformControls.object);
      }
    });

    this.scene.add(this.transformControls.getHelper());
  }

  initLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(1, 1, 1);
    this.scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-1, 0.5, -1);
    this.scene.add(directionalLight2);
  }

  initHelpers() {
    const gridHelper = new THREE.GridHelper(30, 30, 0x888888, 0xcccccc);
    this.scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(15);
    this.scene.add(axesHelper);
  }

  initEvents() {
    window.addEventListener('resize', this.handleResize.bind(this));
    this.renderer.domElement.addEventListener('click', this.handleClick.bind(this));
  }

  handleResize() {
    if (!this.container) return;

    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  handleClick(event) {
    const rect = this.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const objects = this.models.filter(model =>
      model.type === 'Group' || (model.isMesh && !model.isHelper)
    );

    const intersects = this.raycaster.intersectObjects(objects, true);
    if (intersects.length > 0) {
      // 获取最顶层的模型对象
      let selectedObject = intersects[0].object;
      while (selectedObject.parent && !this.models.includes(selectedObject)) {
        selectedObject = selectedObject.parent;
      }
      this.selectModel(selectedObject);
    } else {
      this.selectModel(null);
    }
  }

  selectModel(model) {
    // 如果选中的是同一个模型，不做任何处理
    if (model === this.selectedModel) return;

    this.selectedModel = model;
    if (model) {
      this.transformControls.attach(model);
    } else {
      this.transformControls.detach();
    }
    this.events.emit('model-select', model);
  }

  setTransformMode(mode) {
    if (this.transformControls) {
      this.transformControls.setMode(mode);
    }
  }

  addModel(model) {
    this.scene.add(model);
    this.models.push(model);
    this.events.emit('models-change', this.models);
  }

  removeModel(model) {
    this.scene.remove(model);
    this.models = this.models.filter(m => m !== model);
    this.events.emit('models-change', this.models);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    if (this.orbitControls) {
      this.orbitControls.update();
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  dispose() {
    window.removeEventListener('resize', this.handleResize);
    this.renderer.domElement.removeEventListener('click', this.handleClick);

    this.renderer.dispose();
    this.orbitControls.dispose();
    this.transformControls.dispose();

    while(this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }

    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

export default ThreeEditor;
