import React, { useRef } from 'react';
import { Layout } from 'antd';
import ThreeJSScene from './components/ThreeJSScene';
import SceneTree from './components/SceneTree';
import PropertyPanel from './components/PropertyPanel';
import ErrorBoundary from './components/ErrorBoundary';
import { useThreeEditor } from '../../hooks/useThreeEditor';

const { Sider, Content } = Layout;

const Editor3D = () => {
  const containerRef = useRef(null);
  const {
    editor,
    selectedModel,
    models,
    transformState,
    updateModelTransform
  } = useThreeEditor(containerRef);

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider width={250} theme="light">
        <SceneTree
          models={models}
          selectedModel={selectedModel}
          onSelect={(model) => editor?.selectModel(model)}
        />
      </Sider>
      <Content>
        <ErrorBoundary>
          <ThreeJSScene containerRef={containerRef} />
        </ErrorBoundary>
      </Content>
      <Sider width={300} theme="light">
        <PropertyPanel
          selectedModel={selectedModel}
          transformState={transformState}
          onModelUpdate={updateModelTransform}
        />
      </Sider>
    </Layout>
  );
};

export default Editor3D;
