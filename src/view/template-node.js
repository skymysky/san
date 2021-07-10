/**
 * Copyright (c) Baidu Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license.
 * See LICENSE file in the project root for license information.
 *
 * @file template 节点类
 */

var guid = require('../util/guid');
var insertBefore = require('../browser/insert-before');
var removeEl = require('../browser/remove-el');
var NodeType = require('./node-type');
var LifeCycle = require('./life-cycle');
var createReverseNode = require('./create-reverse-node');
var elementDisposeChildren = require('./element-dispose-children');
var nodeOwnOnlyChildrenAttach = require('./node-own-only-children-attach');

/**
 * template 节点类
 *
 * @class
 * @param {Object} aNode 抽象节点
 * @param {Node} parent 父亲节点
 * @param {Model} scope 所属数据环境
 * @param {Component} owner 所属组件环境
 * @param {DOMChildrenWalker?} reverseWalker 子元素遍历对象
 */
function TemplateNode(aNode, parent, scope, owner, reverseWalker) {
    this.aNode = aNode;
    this.owner = owner;
    this.scope = scope;
    this.parent = parent;
    this.parentComponent = parent.nodeType === NodeType.CMPT
        ? parent
        : parent.parentComponent;

    this.id = guid++;
    this.lifeCycle = LifeCycle.start;
    this.children = [];

    // #[begin] reverse
    if (reverseWalker) {
        var hasFlagComment;

        // start flag
        if (reverseWalker.current && reverseWalker.current.nodeType === 8) {
            this.sel = reverseWalker.current;
            hasFlagComment = 1;
            reverseWalker.goNext();
        }
        else {
            this.sel = document.createComment(this.id);
            insertBefore(this.sel, reverseWalker.target, reverseWalker.current);
        }

        // content
        var aNodeChildren = this.aNode.children;
        for (var i = 0, l = aNodeChildren.length; i < l; i++) {
            this.children.push(
                createReverseNode(aNodeChildren[i], this, this.scope, this.owner, reverseWalker)
            );
        }

        // end flag
        if (hasFlagComment) {
            this.el = reverseWalker.current;
            reverseWalker.goNext();
        }
        else {
            this.el = document.createComment(this.id);
            insertBefore(this.el, reverseWalker.target, reverseWalker.current);
        }

        this.lifeCycle = LifeCycle.attached;
    }
    // #[end]
}



TemplateNode.prototype.nodeType = NodeType.TPL;

TemplateNode.prototype.attach = nodeOwnOnlyChildrenAttach;

/**
 * 销毁释放
 *
 * @param {boolean=} noDetach 是否不要把节点从dom移除
 * @param {boolean=} noTransition 是否不显示过渡动画效果
 */
TemplateNode.prototype.dispose = function (noDetach, noTransition) {
    elementDisposeChildren(this.children, noDetach, noTransition);

    if (!noDetach) {
        removeEl(this.el);
        removeEl(this.sel);
    }

    this.sel = null;
    this.el = null;
    this.owner = null;
    this.scope = null;
    this.children = null;

    this.lifeCycle = LifeCycle.disposed;

    if (this._ondisposed) {
        this._ondisposed();
    }
};

/**
 * 视图更新函数
 *
 * @param {Array} changes 数据变化信息
 */
TemplateNode.prototype._update = function (changes) {
    for (var i = 0; i < this.children.length; i++) {
        this.children[i]._update(changes);
    }
};

TemplateNode.prototype._getElAsRootNode = function () {
    return this.sel;
};

exports = module.exports = TemplateNode;
