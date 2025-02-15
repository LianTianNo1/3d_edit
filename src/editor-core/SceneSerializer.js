import * as THREE from 'three';

class SceneSerializer {
  constructor(editor, modelManager) {
    this.editor = editor;
    this.modelManager = modelManager;
  }

  // 工具函数：将 Vector3 转换为普通对象
  vector3ToObject(vector) {
    return {
      x: vector.x,
      y: vector.y,
      z: vector.z
    };
  }

  // 工具函数：将 Color 转换为十六进制字符串
  colorToHex(color) {
    return '#' + color.getHexString();
  }

  // 工具函数：获取材质信息
  getMaterialInfo(material) {
    if (!material) return null;
    return {
      color: this.colorToHex(material.color),
      opacity: material.opacity,
      transparent: material.transparent,
      side: material.side
    };
  }

  // 导出场景
  exportScene() {
    const { scene, camera, models } = this.editor;

    return {
      sceneInfo: {
        version: '1.0.0',
        name: 'My 3D Scene',
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString()
      },

      // 相机信息
      camera: {
        position: this.vector3ToObject(camera.position),
        rotation: this.vector3ToObject(camera.rotation),
        fov: camera.fov,
        near: camera.near,
        far: camera.far
      },

      // 灯光信息
      lights: scene.children
        .filter(child => child.isLight)
        .map(light => ({
          type: light.type,
          color: this.colorToHex(light.color),
          intensity: light.intensity,
          ...(light.position && { position: this.vector3ToObject(light.position) }),
          ...(light.target && { target: this.vector3ToObject(light.target.position) })
        })),

      // 模型信息
      models: models.map(model => ({
        id: model.uuid,
        name: model.name,
        type: model.type,
        fileInfo: model.userData.fileInfo || {
          name: model.name,
          localStoragePath: `models/${model.uuid}_${model.name}`
        },
        position: this.vector3ToObject(model.position),
        rotation: this.vector3ToObject(model.rotation),
        scale: this.vector3ToObject(model.scale),
        visible: model.visible,
        material: model.material ? this.getMaterialInfo(model.material) : null
      }))
    };
  }

  // 导入场景
  async importScene(sceneData) {
    // 验证场景数据版本
    if (!sceneData.sceneInfo || sceneData.sceneInfo.version !== '1.0.0') {
      throw new Error('不支持的场景文件版本');
    }

    // 清空当前场景中的模型
    this.modelManager.clearModels();

    // 恢复相机位置
    if (sceneData.camera) {
      const { position, rotation, fov, near, far } = sceneData.camera;
      this.editor.camera.position.set(position.x, position.y, position.z);
      this.editor.camera.rotation.set(rotation.x, rotation.y, rotation.z);
      this.editor.camera.fov = fov;
      this.editor.camera.near = near;
      this.editor.camera.far = far;
      this.editor.camera.updateProjectionMatrix();
    }

    // 恢复灯光
    this.editor.scene.children
      .filter(child => child.isLight)
      .forEach(light => this.editor.scene.remove(light));

    sceneData.lights.forEach(lightData => {
      let light;
      switch (lightData.type) {
        case 'AmbientLight':
          light = new THREE.AmbientLight(lightData.color, lightData.intensity);
          break;
        case 'DirectionalLight':
          light = new THREE.DirectionalLight(lightData.color, lightData.intensity);
          if (lightData.position) {
            light.position.set(
              lightData.position.x,
              lightData.position.y,
              lightData.position.z
            );
          }
          if (lightData.target) {
            light.target.position.set(
              lightData.target.x,
              lightData.target.y,
              lightData.target.z
            );
          }
          break;
      }
      if (light) this.editor.scene.add(light);
    });

    // 加载模型
    for (const modelData of sceneData.models) {
      try {
        const modelUrl = modelData.fileInfo.url;
        if (!modelUrl) {
          throw new Error('模型URL不存在');
        }

        const object = await this.modelManager.loadModel(modelUrl, modelData.fileInfo);

        // 恢复模型变换
        object.position.set(
          modelData.position.x,
          modelData.position.y,
          modelData.position.z
        );
        object.rotation.set(
          modelData.rotation.x,
          modelData.rotation.y,
          modelData.rotation.z
        );
        object.scale.set(
          modelData.scale.x,
          modelData.scale.y,
          modelData.scale.z
        );

        // 恢复材质
        if (modelData.material) {
          object.traverse((child) => {
            if (child.isMesh) {
              child.material = new THREE.MeshPhongMaterial({
                color: modelData.material.color,
                opacity: modelData.material.opacity,
                transparent: modelData.material.transparent,
                side: modelData.material.side
              });
            }
          });
        }
      } catch (error) {
        console.error(`Error loading model ${modelData.fileInfo.name}:`, error);
        throw error;
      }
    }
  }
}

export default SceneSerializer;
