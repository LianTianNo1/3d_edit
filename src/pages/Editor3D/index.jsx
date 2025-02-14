import React, { useState, useEffect } from 'react';
import { Layout } from 'antd';
import ThreeJSScene from './components/ThreeJSScene';
import SceneTree from './components/SceneTree';
import PropertyPanel from './components/PropertyPanel';
import ErrorBoundary from './components/ErrorBoundary';
import { cloneDeep } from 'lodash';
const { Sider, Content } = Layout;

const Editor3D = () => {
  // 选中的模型状态
  const [selectedModel, setSelectedModel] = useState(null);
  // 场景中的模型列表
  const [sceneModels, setSceneModels] = useState([]);

  // 处理模型选中
  const handleModelSelect = (model) => {
    // 只允许选择实际的模型对象
    if (model && (model.type === 'Group' || (model.isMesh && !model.isHelper))) {
      // console.log("看看-handleModelSelect", model)
      // // 用 lodash 深拷贝 model
      // const clonedModel = cloneDeep(model);
      // setSelectedModel(clonedModel);
      setSelectedModel(model);
    } else {
      setSelectedModel(null);
    }
  };

  useEffect(() => {
    console.log("看看-sceneModels--0000", selectedModel)
  }, [selectedModel?.position])

  // 处理模型属性更新
  const handleModelUpdate = (type, value) => {
    if (!selectedModel) return;

    // 更新模型属性
    switch(type) {
      case 'position':
        selectedModel.position.set(value.x, value.y, value.z);
        break;
      case 'rotation':
        selectedModel.rotation.set(
          value.x * Math.PI / 180,
          value.y * Math.PI / 180,
          value.z * Math.PI / 180
        );
        break;
      case 'scale':
        selectedModel.scale.set(value.x, value.y, value.z);
        break;
      default:
        break;
    }
    setSelectedModel(selectedModel);
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider width={250} theme="light">
        <SceneTree
          models={sceneModels}
          selectedModel={selectedModel}
          onSelect={handleModelSelect}
        />
      </Sider>
      <Content>
        <ErrorBoundary>
          <ThreeJSScene
            onModelSelect={handleModelSelect}
            onModelsChange={setSceneModels}
            selectedModel={selectedModel}
          />
        </ErrorBoundary>
      </Content>
      <Sider width={300} theme="light">
        <PropertyPanel
          selectedModel={selectedModel}
          onModelUpdate={handleModelUpdate}
        />
      </Sider>
    </Layout>
  );
};

export default Editor3D;
