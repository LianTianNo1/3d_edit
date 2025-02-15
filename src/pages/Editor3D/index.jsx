import React, { useState, useEffect, useRef } from 'react';
import { Layout } from 'antd';
import ThreeJSScene from './components/ThreeJSScene';
import SceneTree from './components/SceneTree';
import PropertyPanel from './components/PropertyPanel';
import ErrorBoundary from './components/ErrorBoundary';
import { cloneDeep } from 'lodash';
const { Sider, Content } = Layout;

const Editor3D = () => {
  // 选中的模型引用
  const selectedModelRef = useRef(null);
  // 场景中的模型列表
  const [sceneModels, setSceneModels] = useState([]);
  // 变换状态
  const [transformState, setTransformState] = useState({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  });

  // 处理模型选中
  const handleModelSelect = (model) => {
    // 如果选中的是同一个模型，不做任何处理
    if (model === selectedModelRef.current) return;

    // 只允许选择实际的模型对象
    if (model && (model.type === 'Group' || (model.isMesh && !model.isHelper))) {
      selectedModelRef.current = model;
      // 更新变换状态
      requestAnimationFrame(() => {
        setTransformState({
          position: {
            x: Number(model.position.x.toFixed(2)),
            y: Number(model.position.y.toFixed(2)),
            z: Number(model.position.z.toFixed(2))
          },
          rotation: {
            x: Number((model.rotation.x * 180 / Math.PI).toFixed(2)),
            y: Number((model.rotation.y * 180 / Math.PI).toFixed(2)),
            z: Number((model.rotation.z * 180 / Math.PI).toFixed(2))
          },
          scale: {
            x: Number(model.scale.x.toFixed(2)),
            y: Number(model.scale.y.toFixed(2)),
            z: Number(model.scale.z.toFixed(2))
          }
        });
      });
    } else {
      selectedModelRef.current = null;
      setTransformState({
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      });
    }
  };

  useEffect(() => {
    console.log("看看-sceneModels--0000", selectedModelRef.current)
  }, [selectedModelRef.current?.position])

  // 处理模型属性更新
  const handleModelUpdate = (type, value) => {
    if (!selectedModelRef.current) return;

    // 更新模型属性
    switch(type) {
      case 'position':
        selectedModelRef.current.position.set(value.x, value.y, value.z);
        break;
      case 'rotation':
        selectedModelRef.current.rotation.set(
          value.x * Math.PI / 180,
          value.y * Math.PI / 180,
          value.z * Math.PI / 180
        );
        break;
      case 'scale':
        selectedModelRef.current.scale.set(value.x, value.y, value.z);
        break;
      default:
        break;
    }

    // 更新变换状态
    requestAnimationFrame(() => {
      setTransformState(prev => ({
        ...prev,
        [type]: value
      }));
    });
  };

  // 同步 ThreeJS 的变换到状态
  const handleTransformChange = () => {
    if (!selectedModelRef.current) return;

    // 使用 requestAnimationFrame 来优化性能
    requestAnimationFrame(() => {
      setTransformState({
        position: {
          x: Number(selectedModelRef.current.position.x.toFixed(2)),
          y: Number(selectedModelRef.current.position.y.toFixed(2)),
          z: Number(selectedModelRef.current.position.z.toFixed(2))
        },
        rotation: {
          x: Number((selectedModelRef.current.rotation.x * 180 / Math.PI).toFixed(2)),
          y: Number((selectedModelRef.current.rotation.y * 180 / Math.PI).toFixed(2)),
          z: Number((selectedModelRef.current.rotation.z * 180 / Math.PI).toFixed(2))
        },
        scale: {
          x: Number(selectedModelRef.current.scale.x.toFixed(2)),
          y: Number(selectedModelRef.current.scale.y.toFixed(2)),
          z: Number(selectedModelRef.current.scale.z.toFixed(2))
        }
      });
    });
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider width={250} theme="light">
        <SceneTree
          models={sceneModels}
          selectedModel={selectedModelRef.current}
          onSelect={handleModelSelect}
        />
      </Sider>
      <Content>
        <ErrorBoundary>
          <ThreeJSScene
            onModelSelect={handleModelSelect}
            onModelsChange={setSceneModels}
            selectedModel={selectedModelRef.current}
            transformState={transformState}
            onTransformChange={handleTransformChange}
          />
        </ErrorBoundary>
      </Content>
      <Sider width={300} theme="light">
        <PropertyPanel
          selectedModel={selectedModelRef.current}
          transformState={transformState}
          onModelUpdate={handleModelUpdate}
        />
      </Sider>
    </Layout>
  );
};

export default Editor3D;
