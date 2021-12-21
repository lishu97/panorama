/*!
* Photo Sphere Viewer 4.0.0-SNAPSHOT
* @copyright 2014-2015 Jérémy Heleine
* @copyright 2015-2021 Damien "Mistic" Sorel
* @licence MIT (https://opensource.org/licenses/MIT)
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three'), require('photo-sphere-viewer')) :
  typeof define === 'function' && define.amd ? define(['exports', 'three', 'photo-sphere-viewer'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.PhotoSphereViewer = global.PhotoSphereViewer || {}, global.PhotoSphereViewer.CubemapAdapter = {}), global.THREE, global.PhotoSphereViewer));
})(this, (function (exports, THREE, photoSphereViewer) { 'use strict';

  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;

    _setPrototypeOf(subClass, superClass);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  /**
   * @typedef {Object} PSV.adapters.CubemapAdapter.Cubemap
   * @summary Object defining a cubemap
   * @property {string} left
   * @property {string} front
   * @property {string} right
   * @property {string} back
   * @property {string} top
   * @property {string} bottom
   */

  var CUBE_VERTICES = 8;
  var CUBE_MAP = [0, 2, 4, 5, 3, 1];
  var CUBE_HASHMAP = ['left', 'right', 'top', 'bottom', 'back', 'front'];
  /**
   * @summary Adapter for cubemaps
   * @memberof PSV.adapters
   */

  var CubemapAdapter = /*#__PURE__*/function (_AbstractAdapter) {
    _inheritsLoose(CubemapAdapter, _AbstractAdapter);

    function CubemapAdapter() {
      return _AbstractAdapter.apply(this, arguments) || this;
    }

    var _proto = CubemapAdapter.prototype;

    /**
     * @override
     * @param {string[] | PSV.adapters.CubemapAdapter.Cubemap} panorama
     * @returns {Promise.<PSV.TextureData>}
     */
    _proto.loadTexture = function loadTexture(panorama) {
      var _this = this;

      var cleanPanorama = [];

      if (Array.isArray(panorama)) {
        if (panorama.length !== 6) {
          return Promise.reject(new photoSphereViewer.PSVError('Must provide exactly 6 image paths when using cubemap.'));
        } // reorder images


        for (var i = 0; i < 6; i++) {
          cleanPanorama[i] = panorama[CUBE_MAP[i]];
        }
      } else if (typeof panorama === 'object') {
        if (!CUBE_HASHMAP.every(function (side) {
          return !!panorama[side];
        })) {
          return Promise.reject(new photoSphereViewer.PSVError('Must provide exactly left, front, right, back, top, bottom when using cubemap.'));
        } // transform into array


        CUBE_HASHMAP.forEach(function (side, i) {
          cleanPanorama[i] = panorama[side];
        });
      } else {
        return Promise.reject(new photoSphereViewer.PSVError('Invalid cubemap panorama, are you using the right adapter?'));
      }

      if (this.psv.config.fisheye) {
        photoSphereViewer.utils.logWarn('fisheye effect with cubemap texture can generate distorsion');
      }

      var promises = [];
      var progress = [0, 0, 0, 0, 0, 0];

      var _loop = function _loop(_i) {
        promises.push(_this.psv.textureLoader.loadImage(cleanPanorama[_i], function (p) {
          progress[_i] = p;

          _this.psv.loader.setProgress(photoSphereViewer.utils.sum(progress) / 6);
        }).then(function (img) {
          return _this.__createCubemapTexture(img);
        }));
      };

      for (var _i = 0; _i < 6; _i++) {
        _loop(_i);
      }

      return Promise.all(promises).then(function (texture) {
        return {
          texture: texture
        };
      });
    }
    /**
     * @summary Creates the final texture from image
     * @param {HTMLImageElement} img
     * @returns {external:THREE.Texture}
     * @private
     */
    ;

    _proto.__createCubemapTexture = function __createCubemapTexture(img) {
      var finalImage; // resize image

      if (img.width > photoSphereViewer.SYSTEM.maxTextureWidth) {
        var buffer = document.createElement('canvas');
        var ratio = photoSphereViewer.SYSTEM.getMaxCanvasWidth() / img.width;
        buffer.width = img.width * ratio;
        buffer.height = img.height * ratio;
        var ctx = buffer.getContext('2d');
        ctx.drawImage(img, 0, 0, buffer.width, buffer.height);
        finalImage = buffer;
      } else {
        finalImage = img;
      }

      return photoSphereViewer.utils.createTexture(finalImage);
    }
    /**
     * @override
     */
    ;

    _proto.createMesh = function createMesh(scale) {
      if (scale === void 0) {
        scale = 1;
      }

      var cubeSize = photoSphereViewer.CONSTANTS.SPHERE_RADIUS * 2 * scale;
      var geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize, CUBE_VERTICES, CUBE_VERTICES, CUBE_VERTICES);
      var materials = [];

      for (var i = 0; i < 6; i++) {
        materials.push(new THREE.MeshBasicMaterial({
          side: THREE.BackSide
        }));
      }

      var mesh = new THREE.Mesh(geometry, materials);
      mesh.scale.set(1, 1, -1);
      return mesh;
    }
    /**
     * @override
     */
    ;

    _proto.setTexture = function setTexture(mesh, textureData) {
      var texture = textureData.texture;

      for (var i = 0; i < 6; i++) {
        if (mesh.material[i].map) {
          mesh.material[i].map.dispose();
        }

        mesh.material[i].map = texture[i];
      }
    }
    /**
     * @override
     */
    ;

    _proto.setTextureOpacity = function setTextureOpacity(mesh, opacity) {
      for (var i = 0; i < 6; i++) {
        mesh.material[i].opacity = opacity;
        mesh.material[i].transparent = opacity < 1;
      }
    };

    return CubemapAdapter;
  }(photoSphereViewer.AbstractAdapter);
  CubemapAdapter.id = 'cubemap';
  CubemapAdapter.supportsTransition = true;

  exports.CubemapAdapter = CubemapAdapter;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=cubemap.js.map
