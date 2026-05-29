---
title: "静态站点中的代码高亮方案对比"
date: "2026-04-08"
tags:
  - Web Development
  - Developer Tools
summary: "对比 Prism、highlight.js 和 Shiki 在静态站点中的适用场景和优劣。"
draft: false
---

## 三种主流方案

### Prism.js

老牌方案，插件生态丰富，但需要客户端 JavaScript 执行。

### highlight.js

同样是客户端方案，API 简单，但主题定制能力有限。

### Shiki

基于 VS Code 的 TextMate 语法，在构建时生成带样式的 HTML，无需客户端 JS。

## 为什么选择 Shiki

对于静态生成的站点，Shiki 的优势很明显：

- 零客户端 JavaScript
- 与 VS Code 主题完全兼容
- 通过 `rehype-pretty-code` 与 unified 管线无缝集成

```python
# Shiki 生成的代码块自带内联样式
def fibonacci(n: int) -> int:
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)
```

在构建阶段完成所有语法分析和样式注入，最终输出的是纯 HTML + CSS。
