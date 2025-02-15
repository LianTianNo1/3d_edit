import * as THREE from 'three';

// 向量转换
export const vector3ToObject = (vector) => {
  return {
    x: vector.x,
    y: vector.y,
    z: vector.z
  };
};

// 颜色转换
export const colorToHex = (color) => {
  return '#' + color.getHexString();
};

// 材质信息获取
export const getMaterialInfo = (material) => {
  if (!material) return null;
  return {
    color: colorToHex(material.color),
    opacity: material.opacity,
    transparent: material.transparent,
    side: material.side
  };
};

// 创建默认材质
export const createDefaultMaterial = () => {
  return new THREE.MeshPhongMaterial({
    color: 0x808080,
    side: THREE.DoubleSide
  });
};

// 计算模型包围盒
export const computeModelBounds = (object) => {
  const box = new THREE.Box3().setFromObject(object);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  return { box, center, size };
};

// 计算理想缩放比例
export const computeIdealScale = (size, targetSize = 10) => {
  const maxDimension = Math.max(size.x, size.y, size.z);
  return targetSize / maxDimension;
};

// 格式化数值
export const formatNumber = (value, precision = 2) => {
  return Number(value.toFixed(precision));
};

// 角度与弧度转换
export const degToRad = (degrees) => {
  return degrees * Math.PI / 180;
};

export const radToDeg = (radians) => {
  return radians * 180 / Math.PI;
};

// 文件信息处理
export const getFileInfo = (serverResponse) => {
  return {
    name: serverResponse.filename,
    size: serverResponse.size,
    url: serverResponse.url,
    filename: serverResponse.filename
  };
};
