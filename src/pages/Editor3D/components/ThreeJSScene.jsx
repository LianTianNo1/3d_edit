import React from 'react';
import { Upload, Button, Radio, message } from 'antd';
import { UploadOutlined, SaveOutlined, ImportOutlined } from '@ant-design/icons';
import { useThreeEditor } from '../../../hooks/useThreeEditor';
import { getFileInfo } from '../../../utils/threeUtils';

// 服务器配置
const SERVER_URL = 'http://localhost:921';

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

const ThreeJSScene = ({ containerRef }) => {
  const {
    selectedModel,
    transformState,
    setTransformMode,
    importModel,
    exportScene,
    importScene
  } = useThreeEditor(containerRef);

  // 处理文件上传
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const uploadResponse = await uploadFile(file);
      const fileInfo = getFileInfo(uploadResponse);
      await importModel(fileInfo.url, fileInfo);
      message.success('模型导入成功');
    } catch (error) {
      console.error('Error loading model:', error);
      message.error('模型导入失败');
    }
  };

  // 处理场景导出
  const handleExportScene = () => {
    const sceneData = exportScene();
    if (!sceneData) {
      message.error('场景未初始化');
      return;
    }

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

  // 处理场景导入
  const handleImportScene = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const sceneData = JSON.parse(e.target.result);
          await importScene(sceneData);
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
        gap: '10px',
        flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
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
            onClick={handleExportScene}
          >
            导出场景
          </Button>
          <Upload
            accept=".json"
            showUploadList={false}
            beforeUpload={(file) => {
              handleImportScene({ target: { files: [file] } });
              return false;
            }}
          >
            <Button icon={<ImportOutlined />}>
              导入场景
            </Button>
          </Upload>
        </div>
        {selectedModel && (
          <Radio.Group
            value={transformState.mode}
            onChange={(e) => setTransformMode(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="translate">移动</Radio.Button>
            <Radio.Button value="rotate">旋转</Radio.Button>
            <Radio.Button value="scale">缩放</Radio.Button>
          </Radio.Group>
        )}
      </div>
    </div>
  );
};

export default ThreeJSScene;
