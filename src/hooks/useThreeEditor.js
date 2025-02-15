import { useEffect, useRef, useState, useCallback } from 'react';
import ThreeEditor from '../editor-core/ThreeEditor';
import ModelManager from '../editor-core/ModelManager';
import SceneSerializer from '../editor-core/SceneSerializer';

export function useThreeEditor(containerRef) {
  const editorRef = useRef(null);
  const modelManagerRef = useRef(null);
  const sceneSerializerRef = useRef(null);

  const [selectedModel, setSelectedModel] = useState(null);
  const [models, setModels] = useState([]);
  const [transformState, setTransformState] = useState({
    mode: 'translate',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  });

  // 更新变换状态的辅助函数
  const updateTransformState = useCallback((model) => {
    if (!model) return;

    setTransformState(prev => ({
      ...prev,
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
    }));
  }, []);

  // 初始化编辑器
  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;

    // 创建编辑器实例
    const editor = new ThreeEditor(containerRef.current);
    editorRef.current = editor;

    // 创建模型管理器
    const modelManager = new ModelManager(editor);
    modelManagerRef.current = modelManager;

    // 创建场景序列化器
    const sceneSerializer = new SceneSerializer(editor, modelManager);
    sceneSerializerRef.current = sceneSerializer;

    // 监听事件
    editor.events.on('model-select', (model) => {
      setSelectedModel(model);
      if (model) {
        updateTransformState(model);
      } else {
        setTransformState(prev => ({
          ...prev,
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        }));
      }
    });

    editor.events.on('models-change', (newModels) => {
      setModels(newModels);
    });

    editor.events.on('transform-change', (model) => {
      if (model) {
        updateTransformState(model);
      }
    });

    // 清理函数
    return () => {
      editor.events.clear();
      editor.dispose();
      editorRef.current = null;
      modelManagerRef.current = null;
      sceneSerializerRef.current = null;
    };
  }, [containerRef, updateTransformState]);

  // 更新模型变换
  const updateModelTransform = useCallback((type, value) => {
    if (!selectedModel) return;

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

    setTransformState(prev => ({
      ...prev,
      [type]: value
    }));
  }, [selectedModel]);

  // 设置变换模式
  const setTransformMode = useCallback((mode) => {
    if (editorRef.current) {
      editorRef.current.setTransformMode(mode);
      setTransformState(prev => ({
        ...prev,
        mode
      }));
    }
  }, []);

  // 导入模型
  const importModel = useCallback(async (url, fileInfo) => {
    if (!modelManagerRef.current) return;
    try {
      await modelManagerRef.current.loadModel(url, fileInfo);
    } catch (error) {
      console.error('导入模型失败:', error);
      throw error;
    }
  }, []);

  // 导出场景
  const exportScene = useCallback(() => {
    if (!sceneSerializerRef.current) return null;
    return sceneSerializerRef.current.exportScene();
  }, []);

  // 导入场景
  const importScene = useCallback(async (sceneData) => {
    if (!sceneSerializerRef.current) return;
    try {
      await sceneSerializerRef.current.importScene(sceneData);
    } catch (error) {
      console.error('导入场景失败:', error);
      throw error;
    }
  }, []);

  return {
    editor: editorRef.current,
    selectedModel,
    models,
    transformState,
    updateModelTransform,
    setTransformMode,
    importModel,
    exportScene,
    importScene
  };
}
