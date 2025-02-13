import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

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
  const modelsRef = useRef([]);

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
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);
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

    // 创建更大的网格辅助线
    const gridHelper = new THREE.GridHelper(
      30,  // 网格总大小
      30,  // 网格分段数
      0x888888,  // 主网格线颜色
      0xcccccc   // 次网格线颜色
    );
    scene.add(gridHelper);

    // 创建更大的坐标轴辅助线
    const axesHelper = new THREE.AxesHelper(15);
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
      requestAnimationFrame(animate);

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // 确保所有模型都在场景中
      modelsRef.current.forEach(model => {
        if (!scene.children.includes(model)) {
          scene.add(model);
        }
      });

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
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

      // 清理前保存模型引用
      modelsRef.current = scene.children.filter(child =>
        child.type === 'Group' || // OBJ 加载的模型通常是 Group
        (child.isMesh && !child.isHelper) // 或者是网格但不是辅助对象
      );

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
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('Starting to load file:', file.name);

    // 创建OBJLoader对象
    const loader = new OBJLoader();
    // 创建文件URL
    const objectUrl = URL.createObjectURL(file);

    try {
      console.log('Loading model from URL:', objectUrl);
      // 加载模型
      const object = await loader.loadAsync(objectUrl);
      console.log('Raw loaded object:', object);

      // 检查加载的对象
      if (!object) {
        console.error('Loaded object is null');
        return;
      }

      // 检查模型的几何体
      let hasMesh = false;
      // 遍历模型中的所有子对象
      object.traverse((child) => {
        // 如果子对象是网格对象，则设置标志
        if (child.isMesh) {
          hasMesh = true;
          console.log('Found mesh in model:', {
            name: child.name,
            vertices: child.geometry.attributes.position.count,
            material: child.material
          });
        }
      });

      if (!hasMesh) {
        console.warn('No meshes found in loaded object');
      }

      // 计算模型包围盒
      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      console.log('Model bounds:', {
        center: center.toArray(),
        size: size.toArray()
      });

      // 计算模型的理想大小
      const maxDimension = Math.max(size.x, size.y, size.z);
      const targetSize = 10; // 目标大小，可以根据需要调整
      const scale = targetSize / maxDimension;

      // 调整模型位置和大小
      object.position.copy(center).multiplyScalar(-1); // 将模型居中
      object.scale.multiplyScalar(scale); // 缩放模型到目标大小

      // 稍微抬高模型，避免与网格重叠
      object.position.y += targetSize / 4;

      // 确保模型可见
      object.traverse((child) => {
        if (child.isMesh) {
          // 添加默认材质
          if (!child.material) {
            child.material = new THREE.MeshPhongMaterial({
              color: 0x808080,
              side: THREE.DoubleSide
            });
            console.log('Added default material to mesh');
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

      // 检查场景是否存在
      if (!sceneRef.current) {
        console.error('Scene reference is null');
        return;
      }

      // 将模型添加到场景中
      sceneRef.current.add(object);
      console.log('Added object to scene. Scene children count:', sceneRef.current.children.length);
      modelsRef.current.push(object);

      // 调整相机位置以更好地查看模型
      const cameraDistance = targetSize * 2;
      if (cameraRef.current) {
        cameraRef.current.position.set(
          cameraDistance,
          cameraDistance * 0.8,
          cameraDistance
        );
        cameraRef.current.lookAt(0, targetSize / 4, 0);
      }

      // 更新控制器目标点
      if (controlsRef.current) {
        controlsRef.current.target.set(0, targetSize / 4, 0);
        controlsRef.current.update();
      }

      // 更新模型列表时过滤掉辅助对象和光源
      onModelsChange(prevModels => {
        // 只保留实际的模型对象
        const newModels = [...prevModels, object].filter(model =>
          model.type === 'Group' || // OBJ 加载的模型通常是 Group
          (model.isMesh && !model.isHelper) // 或者是网格但不是辅助对象
        );
        console.log('Updated models list. New count:', newModels.length);
        return newModels;
      });

    } catch (error) {
      console.error('Error loading model:', error);
      // 输出更详细的错误信息
      if (error.stack) {
        console.error('Error stack:', error.stack);
      }
    } finally {
      URL.revokeObjectURL(objectUrl);
      console.log('Cleaned up object URL');
    }
  };

  // 添加相机控制器的限制
  useEffect(() => {
    if (controlsRef.current) {
      // 限制相机距离
      controlsRef.current.minDistance = 5;
      controlsRef.current.maxDistance = 100;

      // 限制垂直旋转角度
      controlsRef.current.minPolarAngle = 0.1; // 接近但不等于0，防止相机到达正上方
      controlsRef.current.maxPolarAngle = Math.PI * 0.85; // 略小于 PI，防止相机到达正下方

      // 平滑控制
      controlsRef.current.enableDamping = true;
      controlsRef.current.dampingFactor = 0.05;
    }
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <Upload
        accept=".obj"
        showUploadList={false}
        beforeUpload={(file) => {
          handleFileUpload({ target: { files: [file] } });
          return false; // 阻止自动上传
        }}
      >
        <Button
          icon={<UploadOutlined />}
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 1000
          }}
        >
          导入模型
        </Button>
      </Upload>
    </div>
  );
};

export default ThreeJSScene;
