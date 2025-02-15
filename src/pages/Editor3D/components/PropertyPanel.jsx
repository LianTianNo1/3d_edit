import React from 'react';
import { Collapse, InputNumber, Space } from 'antd';

const PropertyPanel = ({ selectedModel, transformState, onModelUpdate }) => {
  if (!selectedModel) {
    return <div style={{ padding: 16 }}>请选择一个模型</div>;
  }

  // 创建折叠面板的配置项
  const items = [
    {
      key: 'position',
      label: '位置',
      children: (
        <Space direction="vertical">
          <div>
            X: <InputNumber
              value={transformState.position.x}
              onChange={v => onModelUpdate('position', { ...transformState.position, x: v })}
              step={0.1}
            />
          </div>
          <div>
            Y: <InputNumber
              value={transformState.position.y}
              onChange={v => onModelUpdate('position', { ...transformState.position, y: v })}
              step={0.1}
            />
          </div>
          <div>
            Z: <InputNumber
              value={transformState.position.z}
              onChange={v => onModelUpdate('position', { ...transformState.position, z: v })}
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
              value={transformState.rotation.x}
              onChange={v => onModelUpdate('rotation', { ...transformState.rotation, x: v })}
              step={1}
            />
          </div>
          <div>
            Y: <InputNumber
              value={transformState.rotation.y}
              onChange={v => onModelUpdate('rotation', { ...transformState.rotation, y: v })}
              step={1}
            />
          </div>
          <div>
            Z: <InputNumber
              value={transformState.rotation.z}
              onChange={v => onModelUpdate('rotation', { ...transformState.rotation, z: v })}
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
              value={transformState.scale.x}
              onChange={v => onModelUpdate('scale', { ...transformState.scale, x: v })}
              step={0.1}
              min={0.1}
            />
          </div>
          <div>
            Y: <InputNumber
              value={transformState.scale.y}
              onChange={v => onModelUpdate('scale', { ...transformState.scale, y: v })}
              step={0.1}
              min={0.1}
            />
          </div>
          <div>
            Z: <InputNumber
              value={transformState.scale.z}
              onChange={v => onModelUpdate('scale', { ...transformState.scale, z: v })}
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
