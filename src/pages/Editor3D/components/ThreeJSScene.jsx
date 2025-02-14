import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Upload, Button, message } from 'antd';
import { UploadOutlined, SaveOutlined, ImportOutlined } from '@ant-design/icons';
import { DragControls } from 'three/examples/jsm/controls/DragControls';

// 服务器配置
const SERVER_URL = 'http://localhost:921';

// 工具函数：将 Vector3 转换为普通对象
const vector3ToObject = (vector) => {
  return {
    x: vector.x,
    y: vector.y,
    z: vector.z
  };
};

// 工具函数：将 Color 转换为十六进制字符串
const colorToHex = (color) => {
  return '#' + color.getHexString();
};

// 工具函数：获取材质信息
const getMaterialInfo = (material) => {
  if (!material) return null;
  return {
    color: colorToHex(material.color),
    opacity: material.opacity,
    transparent: material.transparent,
    side: material.side
  };
};

// 修改文件信息处理函数
const getFileInfo = (serverResponse) => {
  return {
    name: serverResponse.filename,
    size: serverResponse.size,
    url: serverResponse.url,
    filename: serverResponse.filename
  };
};

// 修改文件上传函数
const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${SERVER_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('上传失败');
    }

    const result = await response.json();
    if (result.code !== 200) {
      throw new Error(result.message || '上传失败');
    }

    return result.data;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

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
  const dragControlsRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

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

    // 创建拖拽控制器
    const dragControls = new DragControls([], camera, renderer.domElement);
    dragControlsRef.current = dragControls;

    // 开始拖拽时
    dragControls.addEventListener('dragstart', (event) => {
      setIsDragging(true);
      // 禁用轨道控制器
      if (controlsRef.current) {
        controlsRef.current.enabled = false;
      }
    });

    // 拖拽过程中
    dragControls.addEventListener('drag', (event) => {
      // 限制Y轴移动（可选，如果需要限制在地平面上移动）
      // event.object.position.y = event.object.userData.initialY || 0;

      // 通知位置更新
      if (onModelSelect && event.object) {
        // 更新选中对象的位置
        const updatedObject = event.object;
        // 强制更新选中状态，触发属性面板更新
        // onModelSelect(null);  // 先取消选中
        onModelSelect(updatedObject);  // 再重新选中
        // console.log("看看-updatedObject", updatedObject)
      }
    });

    // 结束拖拽时
    dragControls.addEventListener('dragend', (event) => {
      setIsDragging(false);
      // 恢复轨道控制器
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
      }
      // 确保最后一次更新
      if (onModelSelect && event.object) {
        onModelSelect(event.object);
      }
    });

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
      if (isDragging) return; // 如果正在拖拽，不处理选中

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

  // 监听选中模型变化
  useEffect(() => {
    if (!dragControlsRef.current) return;

    if (selectedModel) {
      // 更新可拖拽对象
      dragControlsRef.current.setObjects([selectedModel]);
    } else {
      // 清空可拖拽对象
      dragControlsRef.current.setObjects([]);
      // 确保轨道控制器被启用
      if (controlsRef.current) {
        controlsRef.current.enabled = true;
      }
    }
  }, [selectedModel]);

  // 导出场景为JSON
  const exportSceneToJSON = () => {
    if (!sceneRef.current || !cameraRef.current) {
      message.error('场景未初始化');
      return;
    }
    console.log("看看-modelsRef", modelsRef.current)

    const sceneData = {
      sceneInfo: {
        version: '1.0.0',
        name: 'My 3D Scene',
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString()
      },

      // 相机信息
      camera: {
        position: vector3ToObject(cameraRef.current.position),
        rotation: vector3ToObject(cameraRef.current.rotation),
        fov: cameraRef.current.fov,
        near: cameraRef.current.near,
        far: cameraRef.current.far
      },

      // 灯光信息
      lights: sceneRef.current.children
        .filter(child => child.isLight)
        .map(light => ({
          type: light.type,
          color: colorToHex(light.color),
          intensity: light.intensity,
          ...(light.position && { position: vector3ToObject(light.position) }),
          ...(light.target && { target: vector3ToObject(light.target.position) })
        })),
      // 模型信息
      models: modelsRef.current.map(model => ({
        id: model.uuid,
        name: model.name,
        type: model.type,
        fileInfo: model.userData.fileInfo || {
          name: model.name,
          localStoragePath: `models/${model.uuid}_${model.name}`
        },
        position: vector3ToObject(model.position),
        rotation: vector3ToObject(model.rotation),
        scale: vector3ToObject(model.scale),
        visible: model.visible,
        material: model.material ? getMaterialInfo(model.material) : null
      }))
    };

    // 创建并下载JSON文件
    const blob = new Blob([JSON.stringify(sceneData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'scene.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    message.success('场景已导出');
  };

  // 修改handleFileUpload方法
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      // 上传文件到服务器
      const uploadResponse = await uploadFile(file);
      const fileInfo = getFileInfo(uploadResponse);

      // 创建OBJLoader对象
      const loader = new OBJLoader();

      // 从服务器加载模型
      const object = await loader.loadAsync(fileInfo.url);

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

      // 保存文件信息
      object.userData.fileInfo = fileInfo;

      // 将模型添加到场景
      sceneRef.current.add(object);
      modelsRef.current.push(object);

      // 更新模型列表
      onModelsChange(prevModels => {
        const newModels = [...prevModels, object].filter(model =>
          model.type === 'Group' ||
          (model.isMesh && !model.isHelper)
        );
        return newModels;
      });

      message.success('模型导入成功');
    } catch (error) {
      console.error('Error loading model:', error);
      message.error('模型导入失败');
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

  // 修改导入场景方法
  const importSceneFromJSON = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const sceneData = JSON.parse(e.target.result);

          // 验证场景数据版本
          if (!sceneData.sceneInfo || sceneData.sceneInfo.version !== '1.0.0') {
            message.error('不支持的场景文件版本');
            return;
          }

          // 清空当前场景中的模型
          modelsRef.current.forEach(model => {
            sceneRef.current.remove(model);
          });
          modelsRef.current = [];

          // 恢复相机位置
          if (sceneData.camera) {
            const { position, rotation, fov, near, far } = sceneData.camera;
            cameraRef.current.position.set(position.x, position.y, position.z);
            cameraRef.current.rotation.set(rotation.x, rotation.y, rotation.z);
            cameraRef.current.fov = fov;
            cameraRef.current.near = near;
            cameraRef.current.far = far;
            cameraRef.current.updateProjectionMatrix();
          }

          // 恢复灯光
          sceneRef.current.children
            .filter(child => child.isLight)
            .forEach(light => sceneRef.current.remove(light));

          sceneData.lights.forEach(lightData => {
            let light;
            switch (lightData.type) {
              case 'AmbientLight':
                light = new THREE.AmbientLight(lightData.color, lightData.intensity);
                break;
              case 'DirectionalLight':
                light = new THREE.DirectionalLight(lightData.color, lightData.intensity);
                if (lightData.position) {
                  light.position.set(
                    lightData.position.x,
                    lightData.position.y,
                    lightData.position.z
                  );
                }
                if (lightData.target) {
                  light.target.position.set(
                    lightData.target.x,
                    lightData.target.y,
                    lightData.target.z
                  );
                }
                break;
              // 可以添加其他类型的灯光支持
            }
            if (light) sceneRef.current.add(light);
          });

          // 加载模型
          const loader = new OBJLoader();
          for (const modelData of sceneData.models) {
            try {
              // 使用保存的服务器URL加载模型
              const modelUrl = modelData.fileInfo.url;
              if (!modelUrl) {
                throw new Error('模型URL不存在');
              }

              const object = await loader.loadAsync(modelUrl);

              // 恢复模型变换
              object.position.set(
                modelData.position.x,
                modelData.position.y,
                modelData.position.z
              );
              object.rotation.set(
                modelData.rotation.x,
                modelData.rotation.y,
                modelData.rotation.z
              );
              object.scale.set(
                modelData.scale.x,
                modelData.scale.y,
                modelData.scale.z
              );

              // 保存文件信息
              object.userData.fileInfo = modelData.fileInfo;

              // 恢复材质
              if (modelData.material) {
                object.traverse((child) => {
                  if (child.isMesh) {
                    child.material = new THREE.MeshPhongMaterial({
                      color: modelData.material.color,
                      opacity: modelData.material.opacity,
                      transparent: modelData.material.transparent,
                      side: modelData.material.side
                    });
                  }
                });
              }

              // 添加到场景
              sceneRef.current.add(object);
              modelsRef.current.push(object);
            } catch (error) {
              console.error(`Error loading model ${modelData.fileInfo.name}:`, error);
              message.warning(`模型 ${modelData.fileInfo.name} 加载失败: ${error.message}`);
            }
          }

          // 更新模型列表
          onModelsChange(modelsRef.current);
          message.success('场景导入成功');
        } catch (error) {
          console.error('Error parsing scene data:', error);
          message.error('场景文件格式错误');
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Error reading scene file:', error);
      message.error('读取场景文件失败');
    }
  };

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 1000,
        display: 'flex',
        gap: '10px'
      }}>
        <Upload
          accept=".obj"
          showUploadList={false}
          beforeUpload={(file) => {
            handleFileUpload({ target: { files: [file] } });
            return false;
          }}
        >
          <Button icon={<UploadOutlined />}>
            导入模型
          </Button>
        </Upload>
        <Button
          icon={<SaveOutlined />}
          onClick={exportSceneToJSON}
        >
          导出场景
        </Button>
        <Upload
          accept=".json"
          showUploadList={false}
          beforeUpload={(file) => {
            importSceneFromJSON({ target: { files: [file] } });
            return false;
          }}
        >
          <Button icon={<ImportOutlined />}>
            导入场景
          </Button>
        </Upload>
      </div>
      {/* 添加拖拽提示 */}
      {selectedModel && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            padding: '8px 12px',
            background: 'rgba(0,0,0,0.6)',
            color: 'white',
            borderRadius: '4px',
            zIndex: 1000
          }}
        >
          {isDragging ? '正在拖拽模型...' : '长按模型可拖拽'}
        </div>
      )}
    </div>
  );
};

export default ThreeJSScene;
