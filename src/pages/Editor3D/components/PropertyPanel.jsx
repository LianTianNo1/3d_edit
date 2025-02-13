import React from 'react';
import { Collapse, InputNumber, Space } from 'antd';

const PropertyPanel = ({ selectedModel, onModelUpdate }) => {
  if (!selectedModel) {
    return <div style={{ padding: 16 }}>请选择一个模型</div>;
  }

  /**
   * 处理位置变化
   * @param {string} axis - 坐标轴 ('x', 'y', 'z')
   * @param {number} value - 新的位置值
   */
  const handlePositionChange = (axis, value) => {
    const position = {
      x: selectedModel.position.x,
      y: selectedModel.position.y,
      z: selectedModel.position.z,
      [axis]: value
    };
    onModelUpdate('position', position);
  };

  /**
   * 处理旋转变化
   * @param {string} axis - 旋转轴 ('x', 'y', 'z')
   * @param {number} value - 新的旋转角度（度）
   */
  const handleRotationChange = (axis, value) => {
    const rotation = {
      // 将弧度转换为角度显示
      x: selectedModel.rotation.x * 180 / Math.PI,
      y: selectedModel.rotation.y * 180 / Math.PI,
      z: selectedModel.rotation.z * 180 / Math.PI,
      [axis]: value
    };
    onModelUpdate('rotation', rotation);
  };

  /**
   * 处理缩放变化
   * @param {string} axis - 缩放轴 ('x', 'y', 'z')
   * @param {number} value - 新的缩放值
   */
  const handleScaleChange = (axis, value) => {
    const scale = {
      x: selectedModel.scale.x,
      y: selectedModel.scale.y,
      z: selectedModel.scale.z,
      [axis]: value
    };
    onModelUpdate('scale', scale);
  };

  // 创建折叠面板的配置项
  const items = [
    {
      key: 'position',
      label: '位置',
      children: (
        <Space direction="vertical">
          <div>
            X: <InputNumber
              value={selectedModel.position.x}
              onChange={v => handlePositionChange('x', v)}
              step={0.1}
            />
          </div>
          <div>
            Y: <InputNumber
              value={selectedModel.position.y}
              onChange={v => handlePositionChange('y', v)}
              step={0.1}
            />
          </div>
          <div>
            Z: <InputNumber
              value={selectedModel.position.z}
              onChange={v => handlePositionChange('z', v)}
              step={0.1}
            />
          </div>
        </Space>
      )
    },
    {
      key: 'rotation',
      label: '旋转',
      children: (
        <Space direction="vertical">
          <div>
            X: <InputNumber
              value={selectedModel.rotation.x * 180 / Math.PI}
              onChange={v => handleRotationChange('x', v)}
              step={1}
            />
          </div>
          <div>
            Y: <InputNumber
              value={selectedModel.rotation.y * 180 / Math.PI}
              onChange={v => handleRotationChange('y', v)}
              step={1}
            />
          </div>
          <div>
            Z: <InputNumber
              value={selectedModel.rotation.z * 180 / Math.PI}
              onChange={v => handleRotationChange('z', v)}
              step={1}
            />
          </div>
        </Space>
      )
    },
    {
      key: 'scale',
      label: '缩放',
      children: (
        <Space direction="vertical">
          <div>
            X: <InputNumber
              value={selectedModel.scale.x}
              onChange={v => handleScaleChange('x', v)}
              step={0.1}
              min={0.1}
            />
          </div>
          <div>
            Y: <InputNumber
              value={selectedModel.scale.y}
              onChange={v => handleScaleChange('y', v)}
              step={0.1}
              min={0.1}
            />
          </div>
          <div>
            Z: <InputNumber
              value={selectedModel.scale.z}
              onChange={v => handleScaleChange('z', v)}
              step={0.1}
              min={0.1}
            />
          </div>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '16px' }}>
      <Collapse
        defaultActiveKey={['position', 'rotation', 'scale']}
        items={items}
      />
    </div>
  );
};

export default PropertyPanel;
