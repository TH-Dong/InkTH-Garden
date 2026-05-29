---
title: "用 KaTeX 在网页中渲染数学公式"
date: "2026-04-10"
updated: "2026-04-11"
tags:
  - Web Development
  - Math
summary: "在 Next.js 项目中接入 KaTeX 进行数学公式渲染的实践记录。"
draft: false
---

## 为什么选择 KaTeX

常见的数学公式渲染方案有 MathJax 和 KaTeX。KaTeX 的主要优势在于：

- 渲染速度更快
- 支持服务端渲染（SSR / SSG 友好）
- 输出体积更小

对于静态生成的内容站来说，KaTeX 是更合适的选择。

## 基本集成方式

在 unified/remark/rehype 生态中，通过 `remark-math` 解析 LaTeX 语法，再通过 `rehype-katex` 转换为 HTML：

```typescript
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
```

行内公式使用 `$...$`，块级公式使用 `$$...$$`。

## 效果验证

行内公式：欧拉公式 $e^{i\pi} + 1 = 0$ 是数学中最优美的等式之一。

块级公式：

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

渲染结果清晰、排版稳定，适合长期使用。
