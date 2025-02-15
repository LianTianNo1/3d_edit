import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

class ModelManager {
  constructor(editor) {
    this.editor = editor;
    this.loader = new OBJLoader();
  }

  async loadModel(url, fileInfo) {
    try {
      const object = await this.loader.loadAsync(url);

      if (!object) {
        throw new Error('加载的对象为空');
      }

      // 处理模型
      this.processModel(object, fileInfo);

      // 添加到场景并更新模型列表
      this.editor.scene.add(object);
      this.editor.models.push(object);

      // 触发模型列表更新事件
      this.editor.events.emit('models-change', this.editor.models);

      // 自动选中新加载的模型
      this.editor.selectModel(object);

      return object;
    } catch (error) {
      console.error('Error loading model:', error);
      throw error;
    }
  }

  processModel(object, fileInfo) {
    // 检查和处理网格
    let hasMesh = false;
    object.traverse((child) => {
      if (child.isMesh) {
        hasMesh = true;
        this.processMesh(child);
      }
    });

    if (!hasMesh) {
      console.warn('No meshes found in loaded object');
    }

    // 计算和调整大小
    this.adjustModelSize(object);

    // 设置模型信息
    object.name = fileInfo.name;
    object.userData.fileInfo = fileInfo;
  }

  processMesh(mesh) {
    // 添加默认材质
    if (!mesh.material) {
      mesh.material = new THREE.MeshPhongMaterial({
        color: 0x808080,
        side: THREE.DoubleSide
      });
    }

    // 确保材质的双面渲染
    mesh.material.side = THREE.DoubleSide;

    // 开启阴影
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  }

  adjustModelSize(object) {
    // 计算包围盒
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // 计算理想大小
    const maxDimension = Math.max(size.x, size.y, size.z);
    const targetSize = 10; // 目标大小
    const scale = targetSize / maxDimension;

    // 调整位置和大小
    object.position.copy(center).multiplyScalar(-1);
    object.scale.multiplyScalar(scale);
    object.position.y += targetSize / 4; // 稍微抬高模型
  }

  removeModel(model) {
    const index = this.editor.models.indexOf(model);
    if (index !== -1) {
      this.editor.models.splice(index, 1);
      this.editor.scene.remove(model);

      // 如果删除的是当前选中的模型，取消选中
      if (this.editor.selectedModel === model) {
        this.editor.selectModel(null);
      }

      // 触发模型列表更新事件
      this.editor.events.emit('models-change', this.editor.models);
    }
  }

  clearModels() {
    // 保存当前模型列表的副本
    const modelsToRemove = [...this.editor.models];

    // 清除所有模型
    modelsToRemove.forEach(model => {
      this.removeModel(model);
    });
  }
}

export default ModelManager;
