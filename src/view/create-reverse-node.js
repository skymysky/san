/**
 * Copyright (c) Baidu Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license.
 * See LICENSE file in the project root for license information.
 *
 * @file 通过组件反解创建节点的工厂方法
 */

var Element = require('./element');
var TemplateNode = require('./template-node');
var AsyncComponent = require('./async-component');

// #[begin] reverse
/**
 * 通过组件反解创建节点
 *
 * @param {ANode} aNode 抽象节点
 * @param {Node} parent 父亲节点
 * @param {Model} scope 所属数据环境
 * @param {Component} owner 所属组件环境
 * @param {DOMChildrenWalker} reverseWalker 子元素遍历对象
 * @return {Node}
 */
function createReverseNode(aNode, parent, scope, owner, reverseWalker, componentName) {
    if (aNode.elem) {
        return new Element(aNode, parent, scope, owner, componentName, reverseWalker);
    }

    if (aNode.Clazz) {
        return new aNode.Clazz(aNode, parent, scope, owner, reverseWalker);
    }

    var ComponentOrLoader = owner.components[componentName || aNode.tagName];

    if (ComponentOrLoader) {
        return typeof ComponentOrLoader === 'function'
            ? new ComponentOrLoader({
                source: aNode,
                owner: owner,
                scope: scope,
                parent: parent,
                reverseWalker: reverseWalker
            })
            : new AsyncComponent({
                source: aNode,
                owner: owner,
                scope: scope,
                parent: parent,
                reverseWalker: reverseWalker
            }, ComponentOrLoader);
    }

    if (aNode.directives.is) {
        switch (componentName) {
            case 'fragment':
            case 'template':
                    return new TemplateNode(aNode, parent, scope, owner, reverseWalker);
        }
    }
    else {
        aNode.elem = true;
    }
    return new Element(aNode, parent, scope, owner, componentName, reverseWalker);
}
// #[end]

exports = module.exports = createReverseNode;
