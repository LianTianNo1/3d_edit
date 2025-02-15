import React from 'react';
import { Tree } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';

/**
 * 场景树组件 - 显示场景中的模型层级结构
 * @param {Object} props
 * @param {Array} props.models - 场景中的模型列表
 * @param {Object} props.selectedModel - 当前选中的模型
 * @param {Function} props.onSelect - 选中模型时的回调函数
 */
const SceneTree = ({ models, selectedModel, onSelect }) => {
  // 将模型数据转换为树形结构
  const treeData = models.map((model, index) => ({
    key: model.uuid, // 使用模型的 uuid 作为唯一标识
    title: model.name || `Model ${index + 1}`,
    icon: <AppstoreOutlined />, // 添加图标
    model: model
  }));
  console.log('看看-treeData', models)

  return (
    <div style={{ padding: '16px' }}>
      <h3>场景树 ({models.length} 个模型)</h3>
      <Tree
        // 树的数据源
        treeData={treeData}
        // 当前选中的节点 key 数组
        selectedKeys={[selectedModel?.uuid]}
        // 选择节点时的回调
        onSelect={(_, { node }) => onSelect(node.model)}
        // 显示连接线
        showLine
        // 显示图标
        showIcon
      />
    </div>
  );
};

export default SceneTree;
