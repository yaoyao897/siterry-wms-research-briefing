/**
 * 备注面板：将 .remarks-md__mermaid 渲染为 SVG 流程图
 * 依赖 remarks-mermaid-init.js 预先加载 window.__mermaid
 */
(function (global) {
  'use strict';

  function whenMermaidReady() {
    if (global.__mermaid) return Promise.resolve(global.__mermaid);
    return new Promise(function (resolve) {
      if (global.__mermaidReady && global.__mermaid) {
        resolve(global.__mermaid);
        return;
      }
      global.addEventListener('wms-mermaid-ready', function () {
        resolve(global.__mermaid);
      }, { once: true });
    });
  }

  /**
   * @param {HTMLElement|null|undefined} container
   * @returns {Promise<void>}
   */
  function renderRemarksMermaid(container) {
    if (!container) return Promise.resolve();
    var nodes = container.querySelectorAll('.remarks-md__mermaid.mermaid:not([data-mmd-done])');
    if (!nodes.length) return Promise.resolve();

    return whenMermaidReady().then(function (mermaid) {
      if (!mermaid) return;
      var list = Array.from(nodes);
      list.forEach(function (node) {
        node.removeAttribute('data-mmd-done');
        node.removeAttribute('data-processed');
      });
      return mermaid.run({ nodes: list, suppressErrors: true }).then(function () {
        list.forEach(function (node) {
          node.setAttribute('data-mmd-done', '1');
        });
      }).catch(function () {
        list.forEach(function (node) {
          if (!node.querySelector('svg')) {
            node.classList.add('remarks-md__mermaid--err');
          }
        });
      });
    });
  }

  global.renderRemarksMermaid = renderRemarksMermaid;
})(typeof window !== 'undefined' ? window : this);
