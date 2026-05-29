---
title: "如何添加 Reading Books"
author: "InkTH"
date: "2026-04-19"
tags:
  - Guide
  - Reading
  - Website
cover: "/images/readings/image.png"
comment: "一个给自己看的快速说明：如何添加一本新的 Reading 书籍、封面和阅读短文。"
noteLink: ""
draft: false
---

## 添加一本书的流程

Reading 页面里的每一本书，本质上都是一个 Markdown 文件。

文件放在：

```txt
src/content/readings/
```

封面图片放在：

```txt
public/images/readings/
```

例如你放了一张图片：

```txt
public/images/readings/book5.png
```

那么在 Markdown 里写：

```yaml
cover: "/images/readings/book5.png"
```

注意路径从 `/images/...` 开始，不要写 `public/...`

## 新建 Markdown 文件

在 `src/content/readings/` 下新建一个文件，例如：

```txt
my-book.md
```

然后写入下面这种结构：

```md
---
title: "书名"
author: "作者"
date: "2026-04-23"
tags:
  - Novel
  - Reading
cover: "/images/readings/book5.png"
comment: "卡片上显示的短评。"
noteLink: ""
draft: false
---

## 为什么读这本书

这里写正文。

## 我会记住什么

这里继续写阅读感受。
```

## 字段说明

+ `title`: 书名,会显示在卡片和详情页标题
+ `author`: 作者
+ `date`: 日期,Readings 页面会按日期排序
+ `tags`: 标签
+ `cover`: 封面图路径
+ `comment`: 卡片上的短评
+ `noteLink`: 如果为空,卡片会链接到当前文章详情页
+ `draft`: `false` 表示公开显示,`true` 表示隐藏

## 最常见的问题

图片不显示时,优先检查三件事:

+ 图片是否真的在 `public/images/readings/` 下面
+ `cover` 是否写成了 `/images/readings/xxx.png`
+ 图片文件名大小写是否完全一致

如果 `cover` 写成下面这样,就会错:

```yaml
cover: "public/images/readings/book5.png"
```

正确写法是:

```yaml
cover: "/images/readings/book5.png"
```

## 当前规则

如果只是想加一本书,通常只需要做两件事:

1. 把封面图丢进 `public/images/readings/`
2. 在 `src/content/readings/` 新建一个 `.md` 文件

剩下的卡片、详情页、封面展示都会自动生成。
