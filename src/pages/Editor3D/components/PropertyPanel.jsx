import React, { useEffect, useState, useCallback } from 'react';
import { Collapse, InputNumber, Space } from 'antd';
import { debounce } from 'lodash';  // 需要添加lodash依赖

const PropertyPanel = ({ selectedModel, onModelUpdate }) => {
  // 添加本地状态来跟踪属性值
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
  const [scale, setScale] = useState({ x: 1, y: 1, z: 1 });

  // 使用useCallback包装更新函数，避免重复创建
  const updateModelValues = useCallback(() => {
    console.log("看看-selectedModel", selectedModel)
    if (selectedModel) {
      setPosition({
        x: Number(selectedModel.position.x.toFixed(2)),
        y: Number(selectedModel.position.y.toFixed(2)),
        z: Number(selectedModel.position.z.toFixed(2))
      });
      setRotation({
        x: Number((selectedModel.rotation.x * 180 / Math.PI).toFixed(2)),
        y: Number((selectedModel.rotation.y * 180 / Math.PI).toFixed(2)),
        z: Number((selectedModel.rotation.z * 180 / Math.PI).toFixed(2))
      });
      setScale({
        x: Number(selectedModel.scale.x.toFixed(2)),
        y: Number(selectedModel.scale.y.toFixed(2)),
        z: Number(selectedModel.scale.z.toFixed(2))
      });
    }
  }, [selectedModel]);

  // 使用防抖处理频繁更新
  const debouncedUpdate = useCallback(
    debounce(updateModelValues, 16),  // 约60fps的更新频率
    [updateModelValues]
  );

  // 监听选中模型变化
  useEffect(() => {
    console.log("看看-selectedModel-变化了", selectedModel)
    if (selectedModel) {
      debouncedUpdate();
    }
    return () => {
      debouncedUpdate.cancel();
    };
  }, [selectedModel, debouncedUpdate]);

  if (!selectedModel) {
    return <div style={{ padding: 16 }}>请选择一个模型</div>;
  }

  /**
   * 处理位置变化
   * @param {string} axis - 坐标轴 ('x', 'y', 'z')
   * @param {number} value - 新的位置值
   */
  const handlePositionChange = (axis, value) => {
    if (value === null) return;  // 处理输入框清空的情况
    const newPosition = { ...position, [axis]: value };
    setPosition(newPosition);
    onModelUpdate('position', newPosition);
  };

  /**
   * 处理旋转变化
   * @param {string} axis - 旋转轴 ('x', 'y', 'z')
   * @param {number} value - 新的旋转角度（度）
   */
  const handleRotationChange = (axis, value) => {
    if (value === null) return;  // 处理输入框清空的情况
    const newRotation = { ...rotation, [axis]: value };
    setRotation(newRotation);
    onModelUpdate('rotation', newRotation);
  };

  /**
   * 处理缩放变化
   * @param {string} axis - 缩放轴 ('x', 'y', 'z')
   * @param {number} value - 新的缩放值
   */
  const handleScaleChange = (axis, value) => {
    if (value === null) return;  // 处理输入框清空的情况
    const newScale = { ...scale, [axis]: value };
    setScale(newScale);
    onModelUpdate('scale', newScale);
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
              value={position.x}
              onChange={v => handlePositionChange('x', v)}
              step={0.1}
            />
          </div>
          <div>
            Y: <InputNumber
              value={position.y}
              onChange={v => handlePositionChange('y', v)}
              step={0.1}
            />
          </div>
          <div>
            Z: <InputNumber
              value={position.z}
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
              value={rotation.x}
              onChange={v => handleRotationChange('x', v)}
              step={1}
            />
          </div>
          <div>
            Y: <InputNumber
              value={rotation.y}
              onChange={v => handleRotationChange('y', v)}
              step={1}
            />
          </div>
          <div>
            Z: <InputNumber
              value={rotation.z}
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
              value={scale.x}
              onChange={v => handleScaleChange('x', v)}
              step={0.1}
              min={0.1}
            />
          </div>
          <div>
            Y: <InputNumber
              value={scale.y}
              onChange={v => handleScaleChange('y', v)}
              step={0.1}
              min={0.1}
            />
          </div>
          <div>
            Z: <InputNumber
              value={scale.z}
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
