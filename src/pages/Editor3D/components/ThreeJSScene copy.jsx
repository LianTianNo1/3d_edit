import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

/**
 * Three.js 场景组件
 * @param {Object} props
 * @param {Function} props.onModelSelect - 模型选中回调函数
 * @param {Function} props.onModelsChange - 场景模型列表变化回调函数
 * @param {Object} props.selectedModel - 当前选中的模型对象
 */
const ThreeJSScene = ({ onModelSelect, onModelsChange, selectedModel }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  // 初始化场景
  useEffect(() => {
    if (!containerRef.current) return;

    // 创建场景
    const scene = new THREE.Scene();
    // 设置场景背景颜色
    scene.background = new THREE.Color(0xf0f0f0);
    // 将场景对象存储在 ref 中
    sceneRef.current = scene;

    // 创建相机 参数：视角、宽高比、近裁剪面、远裁剪面
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    // 设置相机位置
    camera.position.set(0, 0, 5);
    // 将相机对象存储在 ref 中
    cameraRef.current = camera;

    // 创建渲染器 参数：抗锯齿、透明背景
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    // 设置渲染器尺寸
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    // 设置渲染器像素比
    renderer.setPixelRatio(window.devicePixelRatio);
    // 将渲染器对象存储在 ref 中
    rendererRef.current = renderer;

    // 创建控制器 参数：相机、渲染器DOM元素
    const controls = new OrbitControls(camera, renderer.domElement);
    // 启用阻尼
    controls.enableDamping = true;
    // 阻尼因子
    controls.dampingFactor = 0.05;
    // 启用缩放
    controls.enableZoom = true;
    // 启用旋转
    controls.enableRotate = true;
    // 启用平移
    controls.enablePan = true;
    // 将控制器对象存储在 ref 中
    controlsRef.current = controls;

    // 创建环境光 参数：颜色、强度
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    // 将环境光添加到场景中
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(1, 1, 1);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-1, 0.5, -1);
    scene.add(directionalLight2);

    // 创建网格辅助线 参数：网格大小、网格数量
    const gridHelper = new THREE.GridHelper(10, 10);
    // 将网格辅助线添加到场景中
    scene.add(gridHelper);

    // 创建坐标轴辅助线 参数：坐标轴长度
    const axesHelper = new THREE.AxesHelper(5);
    // 将坐标轴辅助线添加到场景中
    scene.add(axesHelper);

    // 启用阴影
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 处理窗口大小变化
    const handleResize = () => {
      if (!containerRef.current) return;

      // 更新相机宽高比
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      // 更新相机投影矩阵
      camera.updateProjectionMatrix();
      // 更新渲染器尺寸
      renderer.setSize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    };
    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);

    // 处理模型选中
    const handleModelSelect = (event) => {
      // 获取容器矩形
      const rect = containerRef.current.getBoundingClientRect();
      // 计算鼠标位置
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // 从相机创建射线
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      // 获取场景中所有网格对象
      const objects = [];
      scene.traverse((object) => {
        // 如果对象是网格对象，则添加到对象列表中
        if (object.isMesh) {
          objects.push(object);
        }
      });

      // 获取射线与场景中所有网格对象的交点
      const intersects = raycasterRef.current.intersectObjects(objects);

      // 如果交点存在，则选中第一个交点对应的网格对象
      if (intersects.length > 0) {
        // 获取交点对应的网格对象
        const selectedObject = intersects[0].object;
        // 调用 onModelSelect 回调函数，传递选中对象
        onModelSelect(selectedObject);
      } else {
        // 如果没有交点，则取消选中
        onModelSelect(null);
      }
    };
    // 监听渲染器DOM元素的点击事件
    renderer.domElement.addEventListener('click', handleModelSelect);

    // 渲染动画
    const animate = () => {
      // 请求动画帧
      requestAnimationFrame(animate);
      // 更新控制器
      controls.update();
      // 渲染场景
      renderer.render(scene, camera);
    };
    animate();

    // 将渲染器DOM元素添加到容器中
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 修改清理函数
    return () => {
      // 移除窗口大小变化监听
      window.removeEventListener('resize', handleResize);
      // 移除渲染器DOM元素的点击事件监听
      renderer.domElement.removeEventListener('click', handleModelSelect);

      // 停止动画循环
      renderer.setAnimationLoop(null);

      // 清理场景中的所有对象
      while(scene.children.length > 0) {
        scene.remove(scene.children[0]);
      }

      // 安全地移除渲染器DOM元素
      if (containerRef.current && containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }

      // 释放资源
      renderer.dispose();
      controls.dispose();
    };
  }, [onModelSelect]);

  /**
   * 处理模型加载
   * @param {Event} event - 文件上传事件
   */
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 创建OBJLoader对象
    const loader = new OBJLoader();
    // 创建文件URL
    const objectUrl = URL.createObjectURL(file);

    try {
      // 加载模型
      const object = await loader.loadAsync(objectUrl);

      // 计算模型包围盒
      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // 计算合适的缩放比例
      const maxSize = Math.max(size.x, size.y, size.z);
      const scale = 5 / maxSize; // 将模型缩放到合适大小

      // 调整模型位置和大小
      object.position.copy(center).multiplyScalar(-1); // 将模型居中
      object.scale.multiplyScalar(scale); // 缩放模型

      // 确保模型可见
      object.traverse((child) => {
        if (child.isMesh) {
          // 添加默认材质
          if (!child.material) {
            child.material = new THREE.MeshPhongMaterial({
              color: 0x808080,
              side: THREE.DoubleSide
            });
          }
          // 确保材质的双面渲染
          child.material.side = THREE.DoubleSide;
          // 开启阴影
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // 设置模型名称
      object.name = file.name;

      // 将模型添加到场景中
      sceneRef.current.add(object);

      // 更新相机位置以查看整个模型
      const distance = size.length() * 2;
      cameraRef.current.position.set(distance, distance, distance);
      cameraRef.current.lookAt(0, 0, 0);

      // 更新控制器
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();

      // 调用 onModelsChange 回调函数，传递模型列表
      onModelsChange(prevModels => [...prevModels, object]);

      console.log('Model loaded successfully:', {
        name: file.name,
        position: object.position,
        scale: object.scale,
        children: object.children.length
      });

    } catch (error) {
      console.error('Error loading model:', error);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <input
        type="file"
        accept=".obj"
        onChange={handleFileUpload}
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 1000
        }}
      />
    </div>
  );
};

export default ThreeJSScene;
